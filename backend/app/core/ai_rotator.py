# =============================================================================
# BuildBidz AI Utilities - API Key Rotator
# =============================================================================

from typing import List, Optional
import structlog

logger = structlog.get_logger()

class APIKeyRotator:
    """
    Utility for rotating through multiple API keys to handle rate limits.
    """

    def __init__(self, keys: List[str], service_name: str = "AI Service"):
        self.keys = keys
        self.service_name = service_name
        self.current_index = 0
        self.failed_keys = set()

        if not self.keys:
            logger.warning(f"No API keys provided for {service_name}")

    def get_key(self) -> Optional[str]:
        """Get the current API key."""
        if not self.keys:
            return None
        return self.keys[self.current_index]

    def rotate(self) -> Optional[str]:
        """Switch to the next available API key."""
        if not self.keys or len(self.keys) <= 1:
            logger.warning(f"No alternative keys available for {self.service_name}")
            return self.get_key()

        old_key = self.get_key()
        self.current_index = (self.current_index + 1) % len(self.keys)
        new_key = self.get_key()

        if old_key and isinstance(old_key, str):
            old_prefix = old_key[0:8]
        else:
            old_prefix = "None"
            
        if new_key and isinstance(new_key, str):
            new_prefix = new_key[0:8]
        else:
            new_prefix = "None"

        logger.info(
            f"Rotating API key for {self.service_name}",
            old_key_prefix=old_prefix,
            new_key_prefix=new_prefix,
            key_index=self.current_index
        )
        return new_key

    def mark_limited(self, key: str):
        """Mark a key as rate-limited."""
        # In a more advanced implementation, we could set a cooldown timer
        prefix = "None"
        if key and isinstance(key, str):
            prefix = key[0:8]
            
        logger.warning(
            f"API key marked as rate-limited for {self.service_name}",
            key_prefix=prefix
        )
        self.failed_keys.add(key)
        self.rotate()

    @property
    def has_keys(self) -> bool:
        return len(self.keys) > 0
