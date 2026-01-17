"""
Feed endpoints - Live and Recent streams
GET /api/v1/feed/live
GET /api/v1/feed/recent
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from models.stream import Platform
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/live")
async def get_live_feed(
    keywords: Optional[str] = Query(None, description="Comma-separated keywords to filter by"),
    platform: Optional[str] = Query(None, description="Filter by platform: youtube, twitch, rumble, x"),
    sort: str = Query("relevance", description="Sort by: relevance, viewers"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get currently live streams.

    Returns the main "Live Now" feed with optional filtering.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Parse parameters
        keyword_list = keywords.split(',') if keywords else None
        platform_filter = Platform(platform) if platform else None

        # Get streams from database
        streams = await db.get_live_streams(
            keywords=keyword_list,
            platform=platform_filter,
            limit=limit,
            offset=offset
        )

        # Format response
        results = []
        for stream in streams:
            results.append({
                "id": str(stream['id']),
                "platform": stream['platform'],
                "stream_id": stream['platform_stream_id'],
                "channel": {
                    "name": stream['channel_name'],
                    "avatar": stream['channel_avatar'],
                    "verified": stream['trust_score'] > 0.8,
                    "trust_score": float(stream['trust_score'])
                },
                "stream": {
                    "title": stream['title'],
                    "description": stream['description'],
                    "thumbnail": stream['thumbnail_url'],
                    "embed_url": stream['embed_url'],
                    "viewer_count": stream['viewer_count'],
                    "started_at": stream['start_time'].isoformat() if stream['start_time'] else None,
                    "language": stream['language']
                },
                "status": stream['status'],
                "location": stream['geo_city'],  # City-level only (privacy)
                "matched_keywords": stream['matched_keywords'],
                "detected_at": stream['detected_at'].isoformat()
            })

        return {
            "total": len(results),
            "limit": limit,
            "offset": offset,
            "streams": results
        }

    except Exception as e:
        logger.error(f"Error fetching live feed: {e}")
        raise HTTPException(status_code=500, detail="Error fetching live streams")


@router.get("/recent")
async def get_recent_feed(
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get recently ended streams.

    Returns the "Recently Live / Uploaded" feed for post-event analysis.
    """
    from api.main import db

    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        streams = await db.get_recent_streams(limit=limit, offset=offset)

        results = []
        for stream in streams:
            # Calculate time since ended
            from datetime import datetime, timezone
            if stream['end_time']:
                time_diff = datetime.now(timezone.utc) - stream['end_time']
                hours = int(time_diff.total_seconds() / 3600)
                time_ago = f"{hours}h ago" if hours > 0 else "Just ended"
            else:
                time_ago = "Unknown"

            results.append({
                "id": str(stream['id']),
                "platform": stream['platform'],
                "stream_id": stream['platform_stream_id'],
                "channel": {
                    "name": stream['channel_name'],
                    "avatar": stream['channel_avatar'],
                    "verified": stream['trust_score'] > 0.8,
                    "trust_score": float(stream['trust_score'])
                },
                "stream": {
                    "title": stream['title'],
                    "description": stream['description'],
                    "thumbnail": stream['thumbnail_url'],
                    "embed_url": stream['embed_url'],
                    "peak_viewer_count": stream['peak_viewer_count'],
                    "started_at": stream['start_time'].isoformat() if stream['start_time'] else None,
                    "ended_at": stream['end_time'].isoformat() if stream['end_time'] else None,
                    "language": stream['language']
                },
                "status": stream['status'],
                "time_ago": time_ago,
                "location": stream['geo_city'],
                "matched_keywords": stream['matched_keywords']
            })

        return {
            "total": len(results),
            "limit": limit,
            "offset": offset,
            "streams": results
        }

    except Exception as e:
        logger.error(f"Error fetching recent feed: {e}")
        raise HTTPException(status_code=500, detail="Error fetching recent streams")
