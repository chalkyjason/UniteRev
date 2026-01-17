"""
Twitch Connector
Uses the Twitch Helix API with much more generous rate limits (800 points/min).
Strategy: Category + Keyword filtering for protest/news content.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging
import re

import httpx

from .base import BaseConnector
from models.stream import (
    NormalizedStream,
    StreamUpdate,
    Platform,
    StreamStatus,
    ChannelDetails,
    StreamMetadata,
    SearchContext
)
from models.channel import Channel


class TwitchConnector(BaseConnector):
    """
    Twitch Helix API Connector.

    Rate Limits: ~800 requests per minute (Token Bucket system)
    Much more generous than YouTube.
    """

    # Twitch Category IDs for non-gaming content
    NEWS_CATEGORIES = {
        "509672": "News & Politics",
        "509658": "Just Chatting",
        "509673": "Talk Shows & Podcasts"
    }

    def __init__(self, config: Dict[str, Any]):
        super().__init__(Platform.TWITCH, config)

        self.client_id = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None

        # Rate limiting
        self.rate_limit_remaining = 800
        self.rate_limit_reset: Optional[datetime] = None
        self.safety_threshold = config.get('rate_limit_safety_threshold', 50)

        self.http_client = httpx.AsyncClient(timeout=30.0)

        # Keywords for filtering
        self.protest_keywords = [
            "protest", "rally", "march", "demonstration",
            "activism", "police", "riot", "breaking",
            "live coverage", "news", "on the ground"
        ]

    async def authenticate(self) -> bool:
        """
        Obtain OAuth token for Twitch API.
        Uses Client Credentials flow.
        """
        try:
            response = await self.http_client.post(
                "https://id.twitch.tv/oauth2/token",
                params={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "client_credentials"
                }
            )

            response.raise_for_status()
            data = response.json()

            self.access_token = data['access_token']
            self.token_expires_at = datetime.utcnow() + timedelta(seconds=data['expires_in'])

            self.logger.info("Twitch authentication successful")
            return True

        except Exception as e:
            self.logger.error(f"Twitch authentication failed: {e}")
            self.record_error(e)
            return False

    async def _ensure_authenticated(self):
        """Refresh token if expired."""
        if not self.access_token or datetime.utcnow() >= self.token_expires_at:
            await self.authenticate()

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests."""
        return {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {self.access_token}"
        }

    def _check_rate_limit(self, response: httpx.Response):
        """
        Update rate limit state from response headers.
        Implements circuit breaker if limits are approaching.
        """
        if 'Ratelimit-Remaining' in response.headers:
            self.rate_limit_remaining = int(response.headers['Ratelimit-Remaining'])

        if 'Ratelimit-Reset' in response.headers:
            reset_timestamp = int(response.headers['Ratelimit-Reset'])
            self.rate_limit_reset = datetime.fromtimestamp(reset_timestamp)

        # Circuit breaker
        if self.rate_limit_remaining < self.safety_threshold:
            self.logger.warning(
                f"Twitch rate limit approaching: {self.rate_limit_remaining} remaining"
            )
            if self.rate_limit_reset:
                pause_seconds = (self.rate_limit_reset - datetime.utcnow()).total_seconds()
                self.pause_connector("Rate limit safety threshold", duration_seconds=int(pause_seconds))

    # ==================== Discovery Methods ====================

    async def discover_streams(self, keywords: List[str]) -> List[NormalizedStream]:
        """
        Discovery Loop: Find live streams matching keywords.

        Two-step approach:
        1. Get streams from News & Politics categories
        2. Filter by keyword match in title
        """
        if not self.is_operational():
            return []

        await self._ensure_authenticated()

        all_streams = []

        # Method 1: Search channels (keyword-based)
        keyword_streams = await self._search_channels(keywords if keywords else self.protest_keywords)
        all_streams.extend(keyword_streams)

        # Method 2: Category scan with client-side filtering
        category_streams = await self._scan_categories(keywords if keywords else self.protest_keywords)
        all_streams.extend(category_streams)

        # Deduplicate by stream ID
        seen = set()
        unique_streams = []
        for stream in all_streams:
            if stream.platform_stream_id not in seen:
                seen.add(stream.platform_stream_id)
                unique_streams.append(stream)

        self.logger.info(f"Twitch discovered {len(unique_streams)} streams")
        return unique_streams

    async def _search_channels(self, keywords: List[str]) -> List[NormalizedStream]:
        """
        Search for channels by keyword.
        Endpoint: GET /search/channels
        """
        streams = []

        for keyword in keywords[:5]:  # Limit to prevent too many requests
            try:
                response = await self.http_client.get(
                    "https://api.twitch.tv/helix/search/channels",
                    headers=self._get_headers(),
                    params={
                        "query": keyword,
                        "live_only": True,
                        "first": 20
                    }
                )

                response.raise_for_status()
                self._check_rate_limit(response)

                data = response.json()

                for item in data.get('data', []):
                    if not item.get('is_live'):
                        continue

                    # Get stream details
                    stream = await self._get_stream_by_user_id(item['id'], [keyword])
                    if stream:
                        streams.append(stream)

                self.record_success()

            except Exception as e:
                self.logger.error(f"Twitch channel search error for '{keyword}': {e}")
                self.record_error(e)

        return streams

    async def _scan_categories(self, keywords: List[str]) -> List[NormalizedStream]:
        """
        Scan News & Politics categories and filter by keywords.
        Endpoint: GET /streams
        """
        streams = []

        for game_id, category_name in self.NEWS_CATEGORIES.items():
            try:
                response = await self.http_client.get(
                    "https://api.twitch.tv/helix/streams",
                    headers=self._get_headers(),
                    params={
                        "game_id": game_id,
                        "first": 100,
                        "type": "live"
                    }
                )

                response.raise_for_status()
                self._check_rate_limit(response)

                data = response.json()

                for item in data.get('data', []):
                    # Client-side keyword filter
                    title = item.get('title', '').lower()

                    matched = [kw for kw in keywords if kw.lower() in title]

                    if matched:
                        stream = self._parse_stream(item, matched)
                        if stream:
                            streams.append(stream)

                self.record_success()

            except Exception as e:
                self.logger.error(f"Twitch category scan error for {category_name}: {e}")
                self.record_error(e)

        return streams

    async def _get_stream_by_user_id(self, user_id: str, keywords: List[str]) -> Optional[NormalizedStream]:
        """Get stream details for a specific user."""
        try:
            response = await self.http_client.get(
                "https://api.twitch.tv/helix/streams",
                headers=self._get_headers(),
                params={"user_id": user_id}
            )

            response.raise_for_status()
            self._check_rate_limit(response)

            data = response.json()

            if data.get('data'):
                return self._parse_stream(data['data'][0], keywords)

            return None

        except Exception as e:
            self.logger.error(f"Error getting stream for user {user_id}: {e}")
            return None

    # ==================== Liveness Loop ====================

    async def check_stream_status(self, stream_ids: List[str]) -> List[StreamUpdate]:
        """
        Liveness Loop: Check status of known streams.
        Endpoint: GET /streams (supports up to 100 user_ids)
        """
        if not self.is_operational():
            return []

        await self._ensure_authenticated()

        updates = []

        # Batch into groups of 100
        for i in range(0, len(stream_ids), 100):
            batch = stream_ids[i:i + 100]

            try:
                # stream_ids for Twitch are actually user_ids
                response = await self.http_client.get(
                    "https://api.twitch.tv/helix/streams",
                    headers=self._get_headers(),
                    params={"user_id": batch}
                )

                response.raise_for_status()
                self._check_rate_limit(response)

                data = response.json()

                # Create a set of currently live stream IDs
                live_ids = {item['user_id']: item for item in data.get('data', [])}

                # Update status for all streams in batch
                for stream_id in batch:
                    if stream_id in live_ids:
                        item = live_ids[stream_id]
                        updates.append(StreamUpdate(
                            platform_stream_id=stream_id,
                            viewer_count=item.get('viewer_count', 0),
                            status=StreamStatus.LIVE,
                            last_checked_at=datetime.utcnow()
                        ))
                    else:
                        # Stream is no longer live
                        updates.append(StreamUpdate(
                            platform_stream_id=stream_id,
                            viewer_count=0,
                            status=StreamStatus.ENDED,
                            last_checked_at=datetime.utcnow()
                        ))

                self.record_success()

            except Exception as e:
                self.logger.error(f"Twitch status check error: {e}")
                self.record_error(e)

        return updates

    # ==================== Parsing ====================

    def _parse_stream(self, item: Dict, matched_keywords: List[str]) -> Optional[NormalizedStream]:
        """Convert Twitch API response to NormalizedStream."""
        try:
            user_id = item['user_id']
            user_name = item['user_name']
            title = item['title']
            viewer_count = item.get('viewer_count', 0)
            started_at = datetime.fromisoformat(item['started_at'].replace('Z', '+00:00'))
            thumbnail = item.get('thumbnail_url', '').replace('{width}', '1280').replace('{height}', '720')
            language = item.get('language', 'en')

            stream = NormalizedStream(
                platform=Platform.TWITCH,
                platform_stream_id=user_id,  # Use user_id as stream identifier
                channel_details=ChannelDetails(
                    name=user_name,
                    id=user_id,
                    url=f"https://www.twitch.tv/{user_name.lower()}",
                    avatar_url=None,  # Would need separate API call
                    trust_score=0.5
                ),
                stream_metadata=StreamMetadata(
                    title=title,
                    description=None,
                    thumbnail_url=thumbnail,
                    embed_url=f"https://www.twitch.tv/{user_name.lower()}",
                    viewer_count=viewer_count,
                    started_at=started_at,
                    language=language
                ),
                status=StreamStatus.LIVE,
                search_context=SearchContext(
                    matched_keywords=matched_keywords,
                    discovery_method="search"
                )
            )

            return stream

        except Exception as e:
            self.logger.error(f"Error parsing Twitch stream: {e}")
            return None

    # ==================== Channel Information ====================

    async def get_channel_info(self, channel_id: str) -> Optional[Channel]:
        """
        Get channel/user details.
        Endpoint: GET /users
        """
        await self._ensure_authenticated()

        try:
            response = await self.http_client.get(
                "https://api.twitch.tv/helix/users",
                headers=self._get_headers(),
                params={"id": channel_id}
            )

            response.raise_for_status()
            self._check_rate_limit(response)

            data = response.json()

            if not data.get('data'):
                return None

            item = data['data'][0]

            # Get follower count (separate endpoint)
            follower_count = 0
            try:
                followers_response = await self.http_client.get(
                    "https://api.twitch.tv/helix/channels/followers",
                    headers=self._get_headers(),
                    params={"broadcaster_id": channel_id}
                )
                followers_data = followers_response.json()
                follower_count = followers_data.get('total', 0)
            except:
                pass

            created_at = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))

            channel = Channel(
                platform=Platform.TWITCH,
                platform_channel_id=channel_id,
                display_name=item['display_name'],
                avatar_url=item.get('profile_image_url'),
                subscriber_count=follower_count,
                account_created_at=created_at
            )

            channel.trust_score = channel.calculate_trust_score()

            self.record_success()
            return channel

        except Exception as e:
            self.logger.error(f"Error getting Twitch channel info for {channel_id}: {e}")
            self.record_error(e)
            return None

    async def close(self):
        """Clean up resources."""
        await self.http_client.aclose()
