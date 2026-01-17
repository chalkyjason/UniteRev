"""
Normalized Stream Model
This is the canonical representation of a live stream across all platforms.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, field_validator


class Platform(str, Enum):
    """Supported streaming platforms."""
    YOUTUBE = "youtube"
    TWITCH = "twitch"
    RUMBLE = "rumble"
    X = "x"


class StreamStatus(str, Enum):
    """Lifecycle status of a stream."""
    LIVE = "LIVE"
    ENDED = "ENDED"
    UPCOMING = "UPCOMING"
    REMOVED = "REMOVED"


class ChannelDetails(BaseModel):
    """Channel/Broadcaster information."""
    name: str
    id: str  # Platform-specific channel ID
    url: str
    avatar_url: Optional[str] = None
    trust_score: float = Field(default=0.5, ge=0.0, le=1.0)
    subscriber_count: Optional[int] = None

    @field_validator('trust_score')
    @classmethod
    def validate_trust_score(cls, v):
        """Ensure trust score is within valid range."""
        return max(0.0, min(1.0, v))


class StreamMetadata(BaseModel):
    """Stream-specific metadata."""
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    embed_url: Optional[str] = None
    viewer_count: int = 0
    peak_viewer_count: int = 0
    started_at: Optional[datetime] = None
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    last_checked_at: datetime = Field(default_factory=datetime.utcnow)
    language: Optional[str] = None


class SearchContext(BaseModel):
    """Context about how this stream was discovered."""
    matched_keywords: List[str] = Field(default_factory=list)
    geo_tag: Optional[str] = None  # City-level only (e.g., "Seattle, WA")
    geo_city: Optional[str] = None
    geo_region: Optional[str] = None
    geo_country: Optional[str] = None
    category: str = "activism"  # news | activism
    discovery_method: str = "search"  # search | rss | submission | signal


class NormalizedStream(BaseModel):
    """
    The canonical Stream object that all platform-specific data is normalized into.
    This is the core data structure that flows through the entire application.
    """
    internal_id: UUID = Field(default_factory=uuid4)
    platform: Platform
    platform_stream_id: str  # e.g., YouTube video ID
    channel_details: ChannelDetails
    stream_metadata: StreamMetadata
    status: StreamStatus = StreamStatus.LIVE
    search_context: SearchContext
    is_hidden: bool = False
    report_count: int = 0

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }

    def to_api_response(self) -> dict:
        """Convert to API response format (excludes internal fields)."""
        return {
            "id": str(self.internal_id),
            "platform": self.platform.value,
            "stream_id": self.platform_stream_id,
            "channel": {
                "name": self.channel_details.name,
                "url": self.channel_details.url,
                "avatar": self.channel_details.avatar_url,
                "verified": self.channel_details.trust_score > 0.8,
                "trust_score": round(self.channel_details.trust_score, 2)
            },
            "stream": {
                "title": self.stream_metadata.title,
                "description": self.stream_metadata.description,
                "thumbnail": self.stream_metadata.thumbnail_url,
                "embed_url": self.stream_metadata.embed_url,
                "viewer_count": self.stream_metadata.viewer_count,
                "started_at": self.stream_metadata.started_at.isoformat() if self.stream_metadata.started_at else None,
                "language": self.stream_metadata.language
            },
            "status": self.status.value,
            "location": self.search_context.geo_tag,  # City-level only
            "matched_keywords": self.search_context.matched_keywords,
            "detected_at": self.stream_metadata.detected_at.isoformat()
        }

    def calculate_relevance_score(self) -> float:
        """
        Calculate a weighted relevance score for ranking.
        Used to sort the "Live Now" feed.
        """
        # Weights (can be tuned)
        W_TRUST = 0.3
        W_VIEWERS = 0.4
        W_KEYWORDS = 0.3

        # Trust score component (already 0-1)
        trust_component = self.channel_details.trust_score

        # Viewer count component (logarithmic scale)
        # Normalize to 0-1 where 10k viewers = 1.0
        import math
        viewer_component = min(1.0, math.log10(max(1, self.stream_metadata.viewer_count)) / 4.0)

        # Keyword match component
        keyword_component = min(1.0, len(self.search_context.matched_keywords) / 3.0)

        score = (
            W_TRUST * trust_component +
            W_VIEWERS * viewer_component +
            W_KEYWORDS * keyword_component
        )

        return round(score, 3)


class StreamUpdate(BaseModel):
    """Represents a lightweight update to an existing stream (for Liveness Loop)."""
    platform_stream_id: str
    viewer_count: int
    status: StreamStatus
    last_checked_at: datetime = Field(default_factory=datetime.utcnow)
