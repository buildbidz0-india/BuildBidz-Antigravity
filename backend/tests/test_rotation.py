import asyncio
import sys
from unittest.mock import MagicMock, patch

# Mocking external dependencies for the test
sys.modules['structlog'] = MagicMock()
sys.modules['groq'] = MagicMock()
sys.modules['app.config'] = MagicMock()

from app.core.ai_rotator import APIKeyRotator

async def test_rotation_logic():
    print("Testing API Key Rotation...")
    keys = ["key1", "key2", "key3"]
    rotator = APIKeyRotator(keys, service_name="Test Service")
    
    # Verify initial key
    print(f"Initial key: {rotator.get_key()}")
    assert rotator.get_key() == "key1"
    
    # Mock a rate limit hit
    print("Simulating rate limit on key1...")
    rotator.mark_limited("key1")
    
    # Verify rotation
    print(f"Key after rotation: {rotator.get_key()}")
    assert rotator.get_key() == "key2"
    
    # Mark another limit
    print("Simulating rate limit on key2...")
    rotator.mark_limited("key2")
    
    # Verify rotation
    print(f"Key after second rotation: {rotator.get_key()}")
    assert rotator.get_key() == "key3"
    
    # Verify cycle back to key1
    print("Simulating rate limit on key3...")
    rotator.mark_limited("key3")
    print(f"Key after cycling: {rotator.get_key()}")
    assert rotator.get_key() == "key1"
    
    print("Rotation logic verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_rotation_logic())
