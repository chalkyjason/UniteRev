"""
Channels endpoints
GET /api/v1/channels/search
GET /api/v1/channels/{channel_id}
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional
from uuid import UUID
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/search")
async def search_channels(
    q: str = Query(..., min_length=2, description="Search query"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search for channels by name.

    Allows users to find channels to follow.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # This would implement fuzzy search on the channels table
        # For now, basic implementation
        async with db.pool.acquire() as conn:
            query = """
                SELECT *
                FROM channels
                WHERE display_name ILIKE $1
            """
            params = [f"%{q}%"]

            if platform:
                query += " AND platform = $2"
                params.append(platform)

            query += " LIMIT $" + str(len(params) + 1)
            params.append(limit)

            rows = await conn.fetch(query, *params)

            results = []
            for row in rows:
                results.append({
                    "id": str(row['id']),
                    "platform": row['platform'],
                    "name": row['display_name'],
                    "avatar": row['avatar_url'],
                    "trust_score": float(row['trust_score']),
                    "subscriber_count": row['subscriber_count'],
                    "last_live_at": row['last_live_at'].isoformat() if row['last_live_at'] else None
                })

            return {
                "total": len(results),
                "channels": results
            }

    except Exception as e:
        logger.error(f"Error searching channels: {e}")
        raise HTTPException(status_code=500, detail="Error searching channels")


@router.get("/{channel_id}")
async def get_channel(
    channel_id: UUID = Path(..., description="Channel UUID")
):
    """Get detailed information about a specific channel."""
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM channels WHERE id = $1",
                channel_id
            )

            if not row:
                raise HTTPException(status_code=404, detail="Channel not found")

            # Get recent streams from this channel
            recent_streams = await conn.fetch(
                """
                SELECT * FROM streams
                WHERE channel_id = $1
                ORDER BY start_time DESC
                LIMIT 10
                """,
                channel_id
            )

            return {
                "id": str(row['id']),
                "platform": row['platform'],
                "name": row['display_name'],
                "avatar": row['avatar_url'],
                "trust_score": float(row['trust_score']),
                "subscriber_count": row['subscriber_count'],
                "last_live_at": row['last_live_at'].isoformat() if row['last_live_at'] else None,
                "recent_streams": [
                    {
                        "id": str(s['id']),
                        "title": s['title'],
                        "viewer_count": s['viewer_count'],
                        "started_at": s['start_time'].isoformat() if s['start_time'] else None
                    }
                    for s in recent_streams
                ]
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching channel: {e}")
        raise HTTPException(status_code=500, detail="Error fetching channel")
