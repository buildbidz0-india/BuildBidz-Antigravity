
# Verification Script for BuildBidz AI Model Router
# Tests the circuit breaker failover logic offline

import sys
import os
import asyncio
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.model_config import TaskType, MODEL_AWARD, MODEL_COORDINATOR, MODEL_GENERAL
from app.core.model_router import model_router, CircuitState

def print_result(name, passed):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")

async def test_routing():
    print("\n--- Testing Model Routing ---")
    
    # 1. Test normal routing
    result = model_router.route(TaskType.AWARD)
    print(f"Normal Award Route: {result.model_spec.model_id}")
    passed = result.model_spec.model_id == MODEL_AWARD.model_id
    print_result("Primary Route", passed)

    # 2. Test circuit breaker failure
    print("\n--- Testing Circuit Breaker Failure ---")
    model_id = MODEL_AWARD.model_id
    
    # Simulate failures
    print(f"Simulating failures for {model_id}...")
    model_router.record_failure(model_id, "test_fail_1")
    model_router.record_failure(model_id, "test_fail_2")
    model_router.record_failure(model_id, "test_fail_3")
    
    # Check if circuit is open
    cb = model_router._get_circuit_breaker(model_id)
    print(f"Circuit State: {cb.state}")
    print_result("Circuit Open", cb.state == CircuitState.OPEN)

    # 3. Test Failover
    print("\n--- Testing Automatic Failover ---")
    # Now that Award Primary is OPEN, it should route to Tier 1 Fallback (Coordinator)
    result = model_router.route(TaskType.AWARD)
    print(f"Failover Route: {result.model_spec.model_id}")
    print(f"Is Fallback: {result.is_fallback}")
    print(f"Reason: {result.reason}")
    
    # Roadmap says Tier 1 fallback for Award is Coordinator (Llama 3.3)
    passed = (
        result.model_spec.model_id == MODEL_COORDINATOR.model_id and 
        result.is_fallback == True
    )
    print_result("Failover to Tier 1", passed)

    # 4. Test Latency Tracking
    print("\n--- Testing Latency Threshold ---")
    # Reset general model
    gen_id = MODEL_GENERAL.model_id
    model_router.record_success(gen_id, latency_ms=100)
    
    # Record slow request (6000ms > 5000ms threshold)
    model_router.record_success(gen_id, latency_ms=6000)
    
    # Check failure count (should be 1 now, because slow request counts as failure)
    cb_gen = model_router._get_circuit_breaker(gen_id)
    print(f"General Model Failures: {cb_gen.failure_count}")
    print_result("Latency Exceeded Counts as Failure", cb_gen.failure_count == 1)

    # 5. Health Check
    print("\n--- Testing Health Status ---")
    health = model_router.get_health_status()
    print(f"System Health: {health['healthy']}")
    print(f"Open Circuits: {health['circuits_open']}")
    print_result("Health Status Reflects Open Circuits", health['healthy'] == False and health['circuits_open'] >= 1)

async def main():
    await test_routing()

if __name__ == "__main__":
    asyncio.run(main())
