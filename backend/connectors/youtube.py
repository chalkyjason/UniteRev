"""
YouTube Connector
Implements the three-pronged strategy to work within strict API quotas:
1. RSS Backdoor (0 cost) - Monitor seed channels
2. Surgical Search (100 units/30min) - Discover unknown streamers
3. Batch Validation (1 unit per 50 videos) - Update live streams
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging
import re

import feedparser
import httpx
from googleapiclient.discovery import build
from google.oauth2 import service_account

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


class YouTubeConnector(BaseConnector):
    """
    YouTube Data API v3 Connector with Quota-Aware Architecture.

    Default Quota: 10,000 units/day
    - search.list: 100 units
    - videos.list: 1 unit (supports batching up to 50 IDs)
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(Platform.YOUTUBE, config)

        self.api_key = config.get('api_key')
        self.quota_limit = config.get('quota_limit', 10000)
        self.search_interval_minutes = config.get('search_interval_minutes', 30)
        self.last_search_time: Optional[datetime] = None

        # YouTube API client
        self.youtube = None
        self.http_client = httpx.AsyncClient(timeout=30.0)

        # Keywords for discovery
        self.protest_keywords = [
            "protest", "rally", "march", "demonstration",
            "activism", "police", "riot", "civil unrest",
            "breaking news", "live coverage"
        ]

        self.exclude_keywords = [
            "gaming", "gameplay", "let's play", "walkthrough",
            "reaction", "review", "trailer", "music video"
        ]

    async def authenticate(self) -> bool:
        """Initialize YouTube API client."""
        try:
            self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            self.logger.info("YouTube API client initialized")
            return True
        except Exception as e:
            self.logger.error(f"YouTube authentication failed: {e}")
            self.record_error(e)
            return False

    # ==================== Strategy A: RSS Backdoor (0 cost) ====================

    async def monitor_channel_rss(self, channel_id: str) -> List[NormalizedStream]:
        """
        Monitor a channel's RSS feed for new content.
        Cost: 0 API units (standard HTTP GET)

        Returns streams that need validation.
        """
        rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"

        try:
            response = await self.http_client.get(rss_url)
            response.raise_for_status()

            feed = feedparser.parse(response.text)

            discovered_streams = []

            for entry in feed.entries[:5]:  # Check last 5 videos
                video_id = entry.yt_videoid if hasattr(entry, 'yt_videoid') else self._extract_video_id(entry.link)
                published = datetime(*entry.published_parsed[:6])

                # Only check videos published in the last 2 hours
                if datetime.utcnow() - published > timedelta(hours=2):
                    continue

                # RSS doesn't tell us if it's live, so we need to validate
                # But we return a partial stream object to signal "needs checking"
                self.logger.debug(f"RSS detected new video: {video_id} from channel {channel_id}")

            return discovered_streams

        except Exception as e:
            self.logger.error(f"RSS feed error for channel {channel_id}: {e}")
            return []

    def _extract_video_id(self, url: str) -> str:
        """Extract video ID from YouTube URL."""
        match = re.search(r'v=([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else ""

    # ==================== Strategy B: Surgical Search (100 units) ====================

    async def discover_streams(self, keywords: List[str]) -> List[NormalizedStream]:
        """
        Discovery Loop: Search for live streams using keywords.
        Cost: 100 units per call
        Frequency: Once every 30 minutes (max 48 times/day = 4,800 units)
        """
        if not self.is_operational():
            return []

        # Rate limit: Only search every N minutes
        if self.last_search_time:
            time_since_last = datetime.utcnow() - self.last_search_time
            if time_since_last < timedelta(minutes=self.search_interval_minutes):
                self.logger.debug(
                    f"Skipping search, last search was {time_since_last.seconds // 60} minutes ago"
                )
                return []

        # Check quota
        if not self.consume_quota(100):
            return []

        try:
            # Build search query
            query = " OR ".join(keywords if keywords else self.protest_keywords)
            exclude = " -" + " -".join(self.exclude_keywords)
            search_query = query + exclude

            self.logger.info(f"YouTube search: {search_query}")

            # API call
            request = self.youtube.search().list(
                part="snippet",
                type="video",
                eventType="live",
                q=search_query,
                maxResults=20,
                relevanceLanguage="en",
                safeSearch="none",
                videoDefinition="any"
            )

            response = request.execute()
            self.last_search_time = datetime.utcnow()

            # Parse results
            streams = []
            video_ids = []

            for item in response.get('items', []):
                video_id = item['id']['videoId']
                video_ids.append(video_id)

            # Batch validate these videos to get full details
            if video_ids:
                streams = await self._batch_get_video_details(video_ids, keywords)

            self.record_success()
            self.logger.info(f"YouTube search discovered {len(streams)} streams")

            return streams

        except Exception as e:
            self.logger.error(f"YouTube search error: {e}")
            self.record_error(e)
            return []

    # ==================== Strategy C: Batch Validation (1 unit per 50) ====================

    async def check_stream_status(self, stream_ids: List[str]) -> List[StreamUpdate]:
        """
        Liveness Loop: Update status of known streams.
        Cost: 1 unit per request (up to 50 IDs per request)
        Frequency: Every 2 minutes

        This is the most efficient operation.
        """
        if not self.is_operational():
            return []

        if not stream_ids:
            return []

        updates = []

        # Batch into groups of 50
        for i in range(0, len(stream_ids), 50):
            batch = stream_ids[i:i + 50]

            if not self.consume_quota(1):
                break

            try:
                request = self.youtube.videos().list(
                    part="liveStreamingDetails,statistics,snippet",
                    id=",".join(batch)
                )

                response = request.execute()

                for item in response.get('items', []):
                    video_id = item['id']
                    live_details = item.get('liveStreamingDetails', {})
                    statistics = item.get('statistics', {})

                    # Determine status
                    if 'actualEndTime' in live_details:
                        status = StreamStatus.ENDED
                    elif 'actualStartTime' in live_details:
                        status = StreamStatus.LIVE
                    else:
                        status = StreamStatus.UPCOMING

                    viewer_count = int(statistics.get('viewCount', 0))
                    if 'concurrentViewers' in live_details:
                        viewer_count = int(live_details['concurrentViewers'])

                    updates.append(StreamUpdate(
                        platform_stream_id=video_id,
                        viewer_count=viewer_count,
                        status=status,
                        last_checked_at=datetime.utcnow()
                    ))

                self.record_success()

            except Exception as e:
                self.logger.error(f"Batch validation error: {e}")
                self.record_error(e)

        return updates

    async def _batch_get_video_details(
        self,
        video_ids: List[str],
        matched_keywords: List[str]
    ) -> List[NormalizedStream]:
        """
        Get full details for a batch of video IDs.
        Cost: 1 unit per request (50 videos max)
        """
        if not self.consume_quota(1):
            return []

        streams = []

        try:
            request = self.youtube.videos().list(
                part="snippet,liveStreamingDetails,statistics",
                id=",".join(video_ids)
            )

            response = request.execute()

            for item in response.get('items', []):
                stream = self._parse_video_to_stream(item, matched_keywords)
                if stream:
                    streams.append(stream)

        except Exception as e:
            self.logger.error(f"Batch get details error: {e}")
            self.record_error(e)

        return streams

    def _parse_video_to_stream(self, item: Dict, matched_keywords: List[str]) -> Optional[NormalizedStream]:
        """Convert YouTube API response to NormalizedStream."""
        try:
            video_id = item['id']
            snippet = item['snippet']
            live_details = item.get('liveStreamingDetails', {})
            statistics = item.get('statistics', {})

            # Check if actually live
            if 'actualEndTime' in live_details:
                status = StreamStatus.ENDED
            elif 'actualStartTime' in live_details:
                status = StreamStatus.LIVE
            else:
                # Not actually live, skip
                return None

            # Parse start time
            start_time = None
            if 'actualStartTime' in live_details:
                start_time = datetime.fromisoformat(live_details['actualStartTime'].replace('Z', '+00:00'))

            # Viewer count
            viewer_count = 0
            if 'concurrentViewers' in live_details:
                viewer_count = int(live_details['concurrentViewers'])
            elif 'viewCount' in statistics:
                viewer_count = int(statistics['viewCount'])

            # Build NormalizedStream
            stream = NormalizedStream(
                platform=Platform.YOUTUBE,
                platform_stream_id=video_id,
                channel_details=ChannelDetails(
                    name=snippet['channelTitle'],
                    id=snippet['channelId'],
                    url=f"https://www.youtube.com/channel/{snippet['channelId']}",
                    avatar_url=None,  # Would need separate API call
                    trust_score=0.5  # Default, calculated later
                ),
                stream_metadata=StreamMetadata(
                    title=snippet['title'],
                    description=snippet.get('description', ''),
                    thumbnail_url=snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else None,
                    embed_url=f"https://www.youtube.com/watch?v={video_id}",
                    viewer_count=viewer_count,
                    started_at=start_time,
                    language=snippet.get('defaultLanguage', 'en')
                ),
                status=status,
                search_context=SearchContext(
                    matched_keywords=matched_keywords,
                    discovery_method="search"
                )
            )

            return stream

        except Exception as e:
            self.logger.error(f"Error parsing video {item.get('id')}: {e}")
            return None

    # ==================== Channel Information ====================

    async def get_channel_info(self, channel_id: str) -> Optional[Channel]:
        """
        Get channel details.
        Cost: 1 unit
        """
        if not self.consume_quota(1):
            return None

        try:
            request = self.youtube.channels().list(
                part="snippet,statistics,contentDetails",
                id=channel_id
            )

            response = request.execute()

            if not response.get('items'):
                return None

            item = response['items'][0]
            snippet = item['snippet']
            statistics = item['statistics']

            channel = Channel(
                platform=Platform.YOUTUBE,
                platform_channel_id=channel_id,
                display_name=snippet['title'],
                avatar_url=snippet['thumbnails']['default']['url'],
                subscriber_count=int(statistics.get('subscriberCount', 0)),
                account_created_at=datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00'))
            )

            # Calculate trust score
            channel.trust_score = channel.calculate_trust_score()

            self.record_success()
            return channel

        except Exception as e:
            self.logger.error(f"Error getting channel info for {channel_id}: {e}")
            self.record_error(e)
            return None

    async def close(self):
        """Clean up resources."""
        await self.http_client.aclose()
