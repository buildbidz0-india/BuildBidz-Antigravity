
# Verification Script for BuildBidz Performance Benchmarking
# Tests the latency of all AI endpoints against the 5s SLA

import sys
import os
import asyncio
import time
from typing import Callable, Any

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.ai import groq_service
from app.services.award_engine import award_engine, BidComparisonRequest
from app.services.price_forecast import price_forecast_service, ForecastRequest, MaterialType, Region
from app.services.coordination_agent import coordination_agent, NotificationRequest, Language, CommunicationStep
from app.services.extraction_agent import extraction_agent

async def benchmark(name: str, func: Callable, *args, **kwargs):
    print(f"\n--- Benchmarking {name} ---")
    start = time.perf_counter()
    try:
        await func(*args, **kwargs)
        duration = time.perf_counter() - start
        
        status = "✅ PASS" if duration < 5.0 else "⚠️ WARN"
        print(f"Duration: {duration:.2f}s")
        print(f"{status} (Target: < 5.0s)")
        
    except Exception as e:
        duration = time.perf_counter() - start
        print(f"❌ FAIL (Error: {str(e)}...)")
        print(f"Duration: {duration:.2f}s")

async def run_benchmarks():
    print("BuildBidz AI Performance Benchmarks (SLA: 5s)")
    
    # 1. Award Engine
    req_award = BidComparisonRequest(
        project_id="test", 
        bids=[], 
        requirement={"description": "Test Req"}
    )
    # Mocking bids just to trigger logic (might fail validation but tests latency path)
    
    # 2. Price Forecast (Should use mock data, so fast)
    req_forecast = ForecastRequest(
        material=MaterialType.STEEL,
        region=Region.DELHI_NCR,
        quantity=100.0
    )
    await benchmark("Price Forecast Engine (DeepSeek-R1 Logic)", 
                    price_forecast_service.generate_forecast, req_forecast)

    # 3. Coordination Agent (Llama 3.3 Translation)
    req_coord = NotificationRequest(
        contractor_name="Demo User",
        phone_number="000",
        language=Language.HINGLISH,
        step=CommunicationStep.PAYMENT_RELEASED,
        project_name="Test Project",
        details={"amount": "100"}
    )
    await benchmark("Coordination Agent (Llama 3.3 Gen)", 
                    coordination_agent.generate_notification, req_coord)

    # 4. Extraction Agent (GPT-OSS 20B Parsing)
    sample_text = "INVOICE #123\nGSTIN: 29AAAAA0000A1Z5\nTotal: 5000"
    await benchmark("Magic Extractor (GPT-OSS 20B Parsing)", 
                    extraction_agent.extract_invoice_data, sample_text)

    # 5. Router Overhead (Health Check)
    async def async_get_health():
        return groq_service.get_health()
        
    await benchmark("AI Router Overhead (Health Check)", 
                    async_get_health)

async def main():
    await run_benchmarks()

if __name__ == "__main__":
    asyncio.run(main())
