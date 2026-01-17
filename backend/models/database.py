"""Database manager for PostgreSQL operations."""

import asyncpg
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import logging
import json

from .stream import NormalizedStream, StreamStatus, Platform
from .channel import Channel


class DatabaseManager:
    """Manages all database operations for the application."""

    def __init__(self, connection_url: str):
        self.connection_url = connection_url
        self.pool: Optional[asyncpg.Pool] = None
        self.logger = logging.getLogger("database")

    async def connect(self):
        """Initialize database connection pool."""
        self.pool = await asyncpg.create_pool(
            self.connection_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        self.logger.info("Database connection pool established")

    async def disconnect(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            self.logger.info("Database connection pool closed")

    # ==================== Channel Operations ====================

    async def upsert_channel(self, channel: Channel) -> UUID:
        """Insert or update a channel."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO channels (
                    platform, platform_channel_id, display_name, avatar_url,
                    trust_score, subscriber_count, account_created_at,
                    last_scraped_at, polling_priority
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (platform, platform_channel_id)
                DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    avatar_url = EXCLUDED.avatar_url,
                    trust_score = EXCLUDED.trust_score,
                    subscriber_count = EXCLUDED.subscriber_count,
                    last_scraped_at = EXCLUDED.last_scraped_at,
                    polling_priority = EXCLUDED.polling_priority,
                    updated_at = NOW()
                RETURNING id
                """,
                channel.platform.value,
                channel.platform_channel_id,
                channel.display_name,
                channel.avatar_url,
                channel.trust_score,
                channel.subscriber_count,
                channel.account_created_at,
                channel.last_scraped_at,
                channel.polling_priority
            )
            return row['id']

    async def get_channel(self, platform: Platform, platform_channel_id: str) -> Optional[Channel]:
        """Get a channel by platform and platform_channel_id."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM channels
                WHERE platform = $1 AND platform_channel_id = $2
                """,
                platform.value,
                platform_channel_id
            )
            if row:
                return Channel(**dict(row))
            return None

    async def get_channels_for_polling(self, priority: str, limit: int = 100) -> List[Channel]:
        """Get channels that need to be polled based on priority."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM channels
                WHERE polling_priority = $1
                ORDER BY last_scraped_at ASC NULLS FIRST
                LIMIT $2
                """,
                priority,
                limit
            )
            return [Channel(**dict(row)) for row in rows]

    # ==================== Stream Operations ====================

    async def upsert_stream(self, stream: NormalizedStream) -> UUID:
        """Insert or update a stream."""
        # First ensure channel exists
        channel_id = await self.upsert_channel(
            Channel(
                platform=stream.platform,
                platform_channel_id=stream.channel_details.id,
                display_name=stream.channel_details.name,
                avatar_url=stream.channel_details.avatar_url,
                trust_score=stream.channel_details.trust_score,
                subscriber_count=stream.channel_details.subscriber_count or 0
            )
        )

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO streams (
                    channel_id, platform_stream_id, title, description,
                    thumbnail_url, embed_url, status, viewer_count,
                    peak_viewer_count, start_time, detected_at,
                    last_checked_at, keywords, matched_keywords,
                    geo_city, geo_region, geo_country, language
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                ON CONFLICT (channel_id, platform_stream_id)
                DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    thumbnail_url = EXCLUDED.thumbnail_url,
                    status = EXCLUDED.status,
                    viewer_count = EXCLUDED.viewer_count,
                    peak_viewer_count = GREATEST(streams.peak_viewer_count, EXCLUDED.viewer_count),
                    last_checked_at = EXCLUDED.last_checked_at,
                    updated_at = NOW()
                RETURNING id
                """,
                channel_id,
                stream.platform_stream_id,
                stream.stream_metadata.title,
                stream.stream_metadata.description,
                stream.stream_metadata.thumbnail_url,
                stream.stream_metadata.embed_url,
                stream.status.value,
                stream.stream_metadata.viewer_count,
                stream.stream_metadata.peak_viewer_count,
                stream.stream_metadata.started_at,
                stream.stream_metadata.detected_at,
                stream.stream_metadata.last_checked_at,
                json.dumps(stream.search_context.matched_keywords),
                stream.search_context.matched_keywords,
                stream.search_context.geo_city,
                stream.search_context.geo_region,
                stream.search_context.geo_country,
                stream.stream_metadata.language
            )
            return row['id']

    async def get_live_streams(
        self,
        keywords: Optional[List[str]] = None,
        platform: Optional[Platform] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get live streams with optional filtering."""
        query = """
            SELECT
                s.*,
                c.platform,
                c.display_name as channel_name,
                c.avatar_url as channel_avatar,
                c.trust_score
            FROM streams s
            JOIN channels c ON s.channel_id = c.id
            WHERE s.status = 'LIVE' AND s.is_hidden = FALSE
        """
        params = []
        param_idx = 1

        if platform:
            query += f" AND c.platform = ${param_idx}"
            params.append(platform.value)
            param_idx += 1

        if keywords:
            query += f" AND s.matched_keywords && ${param_idx}::text[]"
            params.append(keywords)
            param_idx += 1

        query += f" ORDER BY s.viewer_count DESC LIMIT ${param_idx} OFFSET ${param_idx + 1}"
        params.extend([limit, offset])

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def get_recent_streams(self, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Get recently ended streams."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    s.*,
                    c.platform,
                    c.display_name as channel_name,
                    c.avatar_url as channel_avatar,
                    c.trust_score
                FROM streams s
                JOIN channels c ON s.channel_id = c.id
                WHERE s.status = 'ENDED' AND s.is_hidden = FALSE
                ORDER BY s.end_time DESC
                LIMIT $1 OFFSET $2
                """,
                limit,
                offset
            )
            return [dict(row) for row in rows]

    async def mark_stream_ended(self, stream_id: UUID, end_time: datetime):
        """Mark a stream as ended."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE streams
                SET status = 'ENDED', end_time = $2, updated_at = NOW()
                WHERE id = $1
                """,
                stream_id,
                end_time
            )

    async def update_stream_viewer_count(self, platform_stream_id: str, viewer_count: int):
        """Update viewer count for a stream."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE streams
                SET
                    viewer_count = $2,
                    peak_viewer_count = GREATEST(peak_viewer_count, $2),
                    last_checked_at = NOW(),
                    updated_at = NOW()
                WHERE platform_stream_id = $1
                """,
                platform_stream_id,
                viewer_count
            )

    async def get_active_stream_ids(self, platform: Platform) -> List[str]:
        """Get all platform_stream_ids that are currently LIVE for a given platform."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT s.platform_stream_id
                FROM streams s
                JOIN channels c ON s.channel_id = c.id
                WHERE c.platform = $1 AND s.status = 'LIVE'
                """,
                platform.value
            )
            return [row['platform_stream_id'] for row in rows]

    # ==================== User Follow Operations ====================

    async def follow_channel(self, device_id: str, channel_id: UUID) -> bool:
        """Add a channel follow."""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO user_follows (user_device_id, channel_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    """,
                    device_id,
                    channel_id
                )
                return True
        except Exception as e:
            self.logger.error(f"Error following channel: {e}")
            return False

    async def unfollow_channel(self, device_id: str, channel_id: UUID) -> bool:
        """Remove a channel follow."""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    DELETE FROM user_follows
                    WHERE user_device_id = $1 AND channel_id = $2
                    """,
                    device_id,
                    channel_id
                )
                return True
        except Exception as e:
            self.logger.error(f"Error unfollowing channel: {e}")
            return False

    async def get_followed_channels(self, device_id: str) -> List[Dict[str, Any]]:
        """Get all channels followed by a device."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT c.*, uf.created_at as followed_at
                FROM channels c
                JOIN user_follows uf ON c.id = uf.channel_id
                WHERE uf.user_device_id = $1
                ORDER BY uf.created_at DESC
                """,
                device_id
            )
            return [dict(row) for row in rows]

    # ==================== Moderation Operations ====================

    async def report_stream(self, stream_id: UUID, device_id: str, reason: str, notes: Optional[str] = None):
        """Report a stream for moderation."""
        async with self.pool.acquire() as conn:
            # Insert report
            await conn.execute(
                """
                INSERT INTO stream_reports (stream_id, reporter_device_id, reason, notes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
                """,
                stream_id,
                device_id,
                reason,
                notes
            )

            # Increment report count
            await conn.execute(
                """
                UPDATE streams
                SET report_count = report_count + 1, updated_at = NOW()
                WHERE id = $1
                """,
                stream_id
            )

            # Auto-hide if threshold exceeded
            threshold = 5  # From config
            await conn.execute(
                """
                UPDATE streams
                SET is_hidden = TRUE
                WHERE id = $1 AND report_count >= $2
                """,
                stream_id,
                threshold
            )

    # ==================== Analytics & Monitoring ====================

    async def log_api_usage(
        self,
        platform: Platform,
        endpoint: str,
        units_consumed: int,
        success: bool,
        error_message: Optional[str] = None
    ):
        """Log API usage for quota tracking."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO api_usage_log (platform, endpoint, quota_units_consumed, success, error_message)
                VALUES ($1, $2, $3, $4, $5)
                """,
                platform.value,
                endpoint,
                units_consumed,
                success,
                error_message
            )

    async def get_quota_usage_today(self, platform: Platform) -> int:
        """Get total quota consumed today for a platform."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT COALESCE(SUM(quota_units_consumed), 0) as total
                FROM api_usage_log
                WHERE platform = $1 AND created_at >= CURRENT_DATE
                """,
                platform.value
            )
            return row['total']
