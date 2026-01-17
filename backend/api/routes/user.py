"""
User endpoints (device-based, no authentication)
POST /api/v1/user/follow
DELETE /api/v1/user/follow
GET /api/v1/user/following
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from uuid import UUID
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class FollowRequest(BaseModel):
    device_id: str
    channel_id: UUID


@router.post("/follow")
async def follow_channel(request: FollowRequest):
    """
    Follow a channel (device-based, no auth).

    Implements the "Pin" feature from the spec.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        success = await db.follow_channel(request.device_id, request.channel_id)

        if success:
            return {"status": "success", "message": "Channel followed"}
        else:
            raise HTTPException(status_code=500, detail="Failed to follow channel")

    except Exception as e:
        logger.error(f"Error following channel: {e}")
        raise HTTPException(status_code=500, detail="Error following channel")


@router.delete("/follow")
async def unfollow_channel(request: FollowRequest):
    """Unfollow a channel."""
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        success = await db.unfollow_channel(request.device_id, request.channel_id)

        if success:
            return {"status": "success", "message": "Channel unfollowed"}
        else:
            raise HTTPException(status_code=500, detail="Failed to unfollow channel")

    except Exception as e:
        logger.error(f"Error unfollowing channel: {e}")
        raise HTTPException(status_code=500, detail="Error unfollowing channel")


@router.get("/following/{device_id}")
async def get_following(device_id: str):
    """
    Get all channels followed by a device.

    Returns the "Following List" with live status.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        channels = await db.get_followed_channels(device_id)

        # Check which followed channels are currently live
        results = []
        for channel in channels:
            # Check if channel has active streams
            async with db.pool.acquire() as conn:
                live_stream = await conn.fetchrow(
                    """
                    SELECT * FROM streams
                    WHERE channel_id = $1 AND status = 'LIVE'
                    ORDER BY viewer_count DESC
                    LIMIT 1
                    """,
                    channel['id']
                )

            is_live = live_stream is not None

            results.append({
                "id": str(channel['id']),
                "platform": channel['platform'],
                "name": channel['display_name'],
                "avatar": channel['avatar_url'],
                "trust_score": float(channel['trust_score']),
                "is_live": is_live,
                "followed_at": channel['followed_at'].isoformat(),
                "live_stream": {
                    "id": str(live_stream['id']),
                    "title": live_stream['title'],
                    "viewer_count": live_stream['viewer_count'],
                    "thumbnail": live_stream['thumbnail_url']
                } if is_live else None
            })

        return {
            "total": len(results),
            "channels": results
        }

    except Exception as e:
        logger.error(f"Error fetching following list: {e}")
        raise HTTPException(status_code=500, detail="Error fetching following list")
