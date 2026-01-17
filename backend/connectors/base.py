"""
Base Connector Abstract Class
All platform-specific connectors must inherit from this class.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
from enum import Enum

from models.stream import NormalizedStream, StreamUpdate, Platform
from models.channel import Channel


class ConnectorStatus(str, Enum):
    """Operational status of a connector."""
    ACTIVE = "active"
    PAUSED = "paused"  # Rate limited or circuit breaker triggered
    ERROR = "error"
    DISABLED = "disabled"


class BaseConnector(ABC):
    """
    Abstract base class for all platform connectors.

    Each connector is responsible for:
    1. Authentication Management
    2. Rate Limit Governance
    3. Protocol Translation (API -> NormalizedStream)
    4. Error Handling and Backoff
    """

    def __init__(self, platform: Platform, config: Dict[str, Any]):
        self.platform = platform
        self.config = config
        self.status = ConnectorStatus.ACTIVE
        self.logger = logging.getLogger(f"connector.{platform.value}")

        # Rate limiting state
        self.quota_consumed = 0
        self.quota_limit = config.get('quota_limit', float('inf'))
        self.last_reset = datetime.utcnow()
        self.error_count = 0
        self.max_errors_before_pause = 5

        # Circuit breaker
        self.circuit_breaker_until: Optional[datetime] = None

    # ==================== Abstract Methods (Must Implement) ====================

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Handle authentication for this platform.
        Returns True if successful, False otherwise.
        """
        pass

    @abstractmethod
    async def discover_streams(self, keywords: List[str]) -> List[NormalizedStream]:
        """
        Discovery Loop: Find new streams that match the given keywords.
        This is the "expensive" operation that runs infrequently (10-30 min).

        Returns a list of NormalizedStream objects.
        """
        pass

    @abstractmethod
    async def check_stream_status(self, stream_ids: List[str]) -> List[StreamUpdate]:
        """
        Liveness Loop: Update the status of known streams.
        This is the "cheap" operation that runs frequently (60-120 sec).

        Args:
            stream_ids: List of platform-specific stream IDs to check

        Returns:
            List of StreamUpdate objects with current status
        """
        pass

    @abstractmethod
    async def get_channel_info(self, channel_id: str) -> Optional[Channel]:
        """
        Fetch detailed information about a specific channel.
        Used for populating the Channel database.
        """
        pass

    # ==================== Rate Limiting & Quota Management ====================

    def consume_quota(self, units: int = 1) -> bool:
        """
        Attempt to consume quota units.
        Returns False if quota would be exceeded.
        """
        if self.quota_consumed + units > self.quota_limit:
            self.logger.warning(
                f"{self.platform.value} quota exhausted: "
                f"{self.quota_consumed}/{self.quota_limit}"
            )
            self.pause_connector("Quota exhausted")
            return False

        self.quota_consumed += units
        return True

    def reset_quota(self):
        """Reset daily quota counter (called by scheduler)."""
        self.quota_consumed = 0
        self.last_reset = datetime.utcnow()
        self.logger.info(f"{self.platform.value} quota reset to 0")

        # Re-enable if paused due to quota
        if self.status == ConnectorStatus.PAUSED:
            self.resume_connector()

    def get_quota_remaining(self) -> int:
        """Get remaining quota units."""
        return max(0, self.quota_limit - self.quota_consumed)

    # ==================== Circuit Breaker Pattern ====================

    def pause_connector(self, reason: str, duration_seconds: int = 300):
        """
        Pause the connector (circuit breaker).
        Used when rate limits are hit or too many errors occur.
        """
        from datetime import timedelta

        self.status = ConnectorStatus.PAUSED
        self.circuit_breaker_until = datetime.utcnow() + timedelta(seconds=duration_seconds)
        self.logger.warning(
            f"{self.platform.value} connector paused: {reason}. "
            f"Resuming at {self.circuit_breaker_until}"
        )

    def resume_connector(self):
        """Resume a paused connector."""
        self.status = ConnectorStatus.ACTIVE
        self.circuit_breaker_until = None
        self.error_count = 0
        self.logger.info(f"{self.platform.value} connector resumed")

    def is_operational(self) -> bool:
        """Check if connector is operational."""
        # Check circuit breaker
        if self.circuit_breaker_until:
            if datetime.utcnow() < self.circuit_breaker_until:
                return False
            else:
                # Circuit breaker expired, auto-resume
                self.resume_connector()

        return self.status == ConnectorStatus.ACTIVE

    def record_error(self, error: Exception):
        """
        Record an error and potentially trigger circuit breaker.
        """
        self.error_count += 1
        self.logger.error(
            f"{self.platform.value} error ({self.error_count}/{self.max_errors_before_pause}): {error}"
        )

        if self.error_count >= self.max_errors_before_pause:
            self.pause_connector(f"Too many errors: {self.error_count}", duration_seconds=600)

    def record_success(self):
        """Record a successful operation (reset error count)."""
        if self.error_count > 0:
            self.error_count = max(0, self.error_count - 1)

    # ==================== Utility Methods ====================

    async def exponential_backoff(self, attempt: int, base_delay: float = 2.0):
        """
        Implement exponential backoff for retries.
        """
        import asyncio
        delay = min(base_delay * (2 ** attempt), 60)  # Max 60 seconds
        self.logger.debug(f"Backing off for {delay}s (attempt {attempt})")
        await asyncio.sleep(delay)

    def get_status_info(self) -> Dict[str, Any]:
        """Get current status information for monitoring."""
        return {
            "platform": self.platform.value,
            "status": self.status.value,
            "quota_consumed": self.quota_consumed,
            "quota_limit": self.quota_limit,
            "quota_remaining": self.get_quota_remaining(),
            "error_count": self.error_count,
            "circuit_breaker_until": self.circuit_breaker_until.isoformat() if self.circuit_breaker_until else None,
            "last_reset": self.last_reset.isoformat()
        }
