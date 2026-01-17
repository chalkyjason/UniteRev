"""
Health check and monitoring endpoints
GET /health
GET /status
"""

from fastapi import APIRouter
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/status")
async def system_status():
    """
    Detailed system status including connector health and quota usage.
    """
    from api.main import db
    from models.stream import Platform

    if not db:
        return {
            "status": "degraded",
            "reason": "Database unavailable"
        }

    try:
        # Get quota usage for today
        youtube_quota = await db.get_quota_usage_today(Platform.YOUTUBE)

        # Get active stream counts
        async with db.pool.acquire() as conn:
            youtube_live = await conn.fetchval(
                """
                SELECT COUNT(*) FROM streams s
                JOIN channels c ON s.channel_id = c.id
                WHERE c.platform = 'youtube' AND s.status = 'LIVE'
                """
            )

            twitch_live = await conn.fetchval(
                """
                SELECT COUNT(*) FROM streams s
                JOIN channels c ON s.channel_id = c.id
                WHERE c.platform = 'twitch' AND s.status = 'LIVE'
                """
            )

        return {
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "platforms": {
                "youtube": {
                    "status": "active",
                    "quota_used": youtube_quota,
                    "quota_limit": 10000,
                    "live_streams": youtube_live
                },
                "twitch": {
                    "status": "active",
                    "live_streams": twitch_live
                }
            }
        }

    except Exception as e:
        logger.error(f"Error fetching system status: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
