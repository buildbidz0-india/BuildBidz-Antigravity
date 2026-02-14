
# Verification Script for BuildBidz Field Voice (ASR)
# Tests the ASR worker configuration and prompt injection logic

import sys
import os
import asyncio
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.workers.asr_worker import GroqASR, transcribe_audio

def print_result(name, passed):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")

async def test_asr_config():
    print("\n--- Testing Field Voice (Whisper V3) Configuration ---")
    
    # 1. Test GroqASR initialization
    try:
        groq_asr = GroqASR()
        print_result("GroqASR Initialized", groq_asr.endpoint is not None)
    except Exception as e:
        print_result("GroqASR Init Failed", False)
        print(e)
        return

    # 2. Test Prompt Injection Support (Static Check)
    import inspect
    sig = inspect.signature(groq_asr.transcribe)
    params = sig.parameters
    
    print(f"Transcribe Params: {list(params.keys())}")
    has_kwargs = 'kwargs' in params
    print_result("Accepts Extra Params (Prompt)", has_kwargs)

async def main():
    await test_asr_config()

if __name__ == "__main__":
    asyncio.run(main())
