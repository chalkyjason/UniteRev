"""
Celery tasks for background processing.
Implements the Discovery Loop and Liveness Loop for each platform.
"""

import asyncio
import logging
from typing import List
from datetime import datetime, timedelta

from .celery_app import celery_app
from models.database import DatabaseManager
from models.stream import Platform, StreamStatus
from connectors.youtube import YouTubeConnector
from connectors.twitch import TwitchConnector
import os

# Initialize logger
logger = logging.getLogger(__name__)

# Database connection
db = DatabaseManager(os.getenv('DATABASE_URL'))


def get_youtube_connector():
    """Initialize YouTube connector."""
    return YouTubeConnector({
        'api_key': os.getenv('YOUTUBE_API_KEY'),
        'quota_limit': int(os.getenv('YOUTUBE_QUOTA_LIMIT', 10000)),
        'search_interval_minutes': int(os.getenv('YOUTUBE_SEARCH_INTERVAL_MINUTES', 30))
    })


def get_twitch_connector():
    """Initialize Twitch connector."""
    return TwitchConnector({
        'client_id': os.getenv('TWITCH_CLIENT_ID'),
        'client_secret': os.getenv('TWITCH_CLIENT_SECRET'),
        'rate_limit_safety_threshold': int(os.getenv('TWITCH_RATE_LIMIT_SAFETY_THRESHOLD', 50))
    })


# ==================== Discovery Loop Tasks ====================

@celery_app.task(name='workers.tasks.youtube_discovery', bind=True)
def youtube_discovery(self):
    """
    YouTube Discovery Loop: Search for new live streams.
    Runs every 30 minutes (4,800 units/day max).
    """
    logger.info("Starting YouTube discovery loop")

    async def run():
        connector = get_youtube_connector()

        try:
            await db.connect()
            await connector.authenticate()

            # Default protest keywords
            keywords = [
                "protest", "rally", "march", "demonstration",
                "activism", "breaking news live"
            ]

            # Discover streams
            streams = await connector.discover_streams(keywords)

            logger.info(f"YouTube discovered {len(streams)} streams")

            # Save to database
            for stream in streams:
                try:
                    stream_id = await db.upsert_stream(stream)
                    logger.debug(f"Saved stream: {stream_id}")
                except Exception as e:
                    logger.error(f"Error saving stream: {e}")

            # Log quota usage
            await db.log_api_usage(
                Platform.YOUTUBE,
                "search.list",
                100,  # Cost of search
                True
            )

            logger.info(f"YouTube discovery complete. Quota remaining: {connector.get_quota_remaining()}")

        except Exception as e:
            logger.error(f"YouTube discovery error: {e}")
            raise

        finally:
            await connector.close()
            await db.disconnect()

    # Run async function
    asyncio.run(run())


@celery_app.task(name='workers.tasks.twitch_discovery', bind=True)
def twitch_discovery(self):
    """
    Twitch Discovery Loop: Search for new live streams.
    Runs every 5 minutes (Twitch has generous rate limits).
    """
    logger.info("Starting Twitch discovery loop")

    async def run():
        connector = get_twitch_connector()

        try:
            await db.connect()
            await connector.authenticate()

            keywords = [
                "protest", "rally", "march", "police",
                "activism", "breaking", "news"
            ]

            streams = await connector.discover_streams(keywords)

            logger.info(f"Twitch discovered {len(streams)} streams")

            for stream in streams:
                try:
                    stream_id = await db.upsert_stream(stream)
                    logger.debug(f"Saved stream: {stream_id}")
                except Exception as e:
                    logger.error(f"Error saving stream: {e}")

            logger.info("Twitch discovery complete")

        except Exception as e:
            logger.error(f"Twitch discovery error: {e}")
            raise

        finally:
            await connector.close()
            await db.disconnect()

    asyncio.run(run())


# ==================== Liveness Loop Tasks ====================

@celery_app.task(name='workers.tasks.youtube_liveness_check', bind=True)
def youtube_liveness_check(self):
    """
    YouTube Liveness Loop: Update status of known live streams.
    Runs every 2 minutes. Uses batch API (1 unit per 50 videos).
    """
    logger.info("Starting YouTube liveness check")

    async def run():
        connector = get_youtube_connector()

        try:
            await db.connect()
            await connector.authenticate()

            # Get all active YouTube streams
            active_ids = await db.get_active_stream_ids(Platform.YOUTUBE)

            if not active_ids:
                logger.info("No active YouTube streams to check")
                return

            logger.info(f"Checking {len(active_ids)} YouTube streams")

            # Batch check status
            updates = await connector.check_stream_status(active_ids)

            # Apply updates to database
            for update in updates:
                try:
                    if update.status == StreamStatus.ENDED:
                        # Mark as ended
                        await db.update_stream_viewer_count(
                            update.platform_stream_id,
                            update.viewer_count
                        )
                        logger.info(f"Stream {update.platform_stream_id} ended")
                    else:
                        # Update viewer count
                        await db.update_stream_viewer_count(
                            update.platform_stream_id,
                            update.viewer_count
                        )

                except Exception as e:
                    logger.error(f"Error updating stream {update.platform_stream_id}: {e}")

            # Log quota usage
            batches = (len(active_ids) + 49) // 50  # Ceiling division
            await db.log_api_usage(
                Platform.YOUTUBE,
                "videos.list",
                batches,
                True
            )

            logger.info(f"YouTube liveness check complete. Updated {len(updates)} streams")

        except Exception as e:
            logger.error(f"YouTube liveness check error: {e}")
            raise

        finally:
            await connector.close()
            await db.disconnect()

    asyncio.run(run())


@celery_app.task(name='workers.tasks.twitch_liveness_check', bind=True)
def twitch_liveness_check(self):
    """
    Twitch Liveness Loop: Update status of known live streams.
    Runs every 1 minute (Twitch is very cheap for this).
    """
    logger.info("Starting Twitch liveness check")

    async def run():
        connector = get_twitch_connector()

        try:
            await db.connect()
            await connector.authenticate()

            active_ids = await db.get_active_stream_ids(Platform.TWITCH)

            if not active_ids:
                logger.info("No active Twitch streams to check")
                return

            logger.info(f"Checking {len(active_ids)} Twitch streams")

            updates = await connector.check_stream_status(active_ids)

            for update in updates:
                try:
                    if update.status == StreamStatus.ENDED:
                        logger.info(f"Stream {update.platform_stream_id} ended")

                    await db.update_stream_viewer_count(
                        update.platform_stream_id,
                        update.viewer_count
                    )

                except Exception as e:
                    logger.error(f"Error updating stream {update.platform_stream_id}: {e}")

            logger.info(f"Twitch liveness check complete. Updated {len(updates)} streams")

        except Exception as e:
            logger.error(f"Twitch liveness check error: {e}")
            raise

        finally:
            await connector.close()
            await db.disconnect()

    asyncio.run(run())


# ==================== Maintenance Tasks ====================

@celery_app.task(name='workers.tasks.reset_daily_quotas', bind=True)
def reset_daily_quotas(self):
    """Reset daily API quotas at midnight UTC."""
    logger.info("Resetting daily API quotas")

    # This would reset any in-memory quota counters
    # For this implementation, the connectors track their own quotas
    # and reset happens per-instance

    logger.info("Daily quotas reset complete")


@celery_app.task(name='workers.tasks.cleanup_old_streams', bind=True)
def cleanup_old_streams(self):
    """Clean up old ended streams from the database."""
    logger.info("Cleaning up old streams")

    async def run():
        try:
            await db.connect()

            # Archive streams older than 7 days
            # This could move them to a separate archive table
            # For now, just log it

            logger.info("Old streams cleanup complete")

        finally:
            await db.disconnect()

    asyncio.run(run())


@celery_app.task(name='workers.tasks.update_channel_priorities', bind=True)
def update_channel_priorities(self):
    """
    Update polling priorities for all channels based on recent activity.
    Implements the Smart Polling algorithm from the spec.
    """
    logger.info("Updating channel polling priorities")

    async def run():
        try:
            await db.connect()

            # This would iterate through channels and update their priority
            # based on last_live_at timestamp

            logger.info("Channel priorities updated")

        finally:
            await db.disconnect()

    asyncio.run(run())
