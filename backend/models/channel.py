"""Channel model for broadcaster identity across platforms."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

from .stream import Platform


class PollingPriority(str):
    """Polling frequency priority levels."""
    HIGH = "high"      # 2 minutes - currently live or recent
    MEDIUM = "medium"  # 30 minutes - active in last 7 days
    LOW = "low"        # 6 hours - inactive for 30 days
    DEAD = "dead"      # 24+ hours - inactive for months


class Channel(BaseModel):
    """
    Represents a broadcaster/channel across any platform.
    Tracks metadata needed for trust scoring and smart polling.
    """
    id: UUID = Field(default_factory=uuid4)
    platform: Platform
    platform_channel_id: str
    display_name: str
    avatar_url: Optional[str] = None
    trust_score: float = Field(default=0.5, ge=0.0, le=1.0)
    subscriber_count: int = 0
    account_created_at: Optional[datetime] = None
    last_scraped_at: Optional[datetime] = None
    last_live_at: Optional[datetime] = None
    polling_priority: str = PollingPriority.MEDIUM
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }

    def calculate_trust_score(self) -> float:
        """
        Calculate trust score based on multiple signals.

        Formula from spec:
        - Account Age (W_a=0.3)
        - Subscriber Count (W_s=0.3)
        - History (W_h=0.4) - has streamed protests before

        For MVP: Simplified version
        - Allowlist channels: 1.0
        - Verified/established: 0.8
        - New/unknown: 0.5
        """
        W_AGE = 0.3
        W_SUBS = 0.3
        W_HISTORY = 0.4

        # Age component (assumes older = more trustworthy)
        age_score = 0.5  # Default
        if self.account_created_at:
            age_days = (datetime.utcnow() - self.account_created_at).days
            # 1 year+ = 1.0, scales down from there
            age_score = min(1.0, age_days / 365.0)

        # Subscriber component (logarithmic scale)
        import math
        subs_score = 0.5  # Default
        if self.subscriber_count > 0:
            # 100k subs = 1.0, scales logarithmically
            subs_score = min(1.0, math.log10(max(1, self.subscriber_count)) / 5.0)

        # History component (has to be manually tagged or learned)
        # For MVP, default to 0.5
        history_score = 0.5

        calculated_score = (
            W_AGE * age_score +
            W_SUBS * subs_score +
            W_HISTORY * history_score
        )

        return round(calculated_score, 2)

    def update_polling_priority(self):
        """
        Update the polling priority based on recent activity.
        Implements the "Smart Polling" logic from the spec.
        """
        if not self.last_live_at:
            self.polling_priority = PollingPriority.MEDIUM
            return

        time_since_live = datetime.utcnow() - self.last_live_at
        hours_since = time_since_live.total_seconds() / 3600

        if hours_since < 24:  # Live in last 24 hours
            self.polling_priority = PollingPriority.HIGH
        elif hours_since < 168:  # 7 days
            self.polling_priority = PollingPriority.MEDIUM
        elif hours_since < 720:  # 30 days
            self.polling_priority = PollingPriority.LOW
        else:
            self.polling_priority = PollingPriority.DEAD

    def get_rss_url(self) -> Optional[str]:
        """Get the RSS feed URL for this channel (YouTube only)."""
        if self.platform == Platform.YOUTUBE:
            return f"https://www.youtube.com/feeds/videos.xml?channel_id={self.platform_channel_id}"
        return None
