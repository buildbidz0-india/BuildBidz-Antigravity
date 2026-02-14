# =============================================================================
# BuildBidz AI - Model Router with Circuit Breaker
# =============================================================================
# Orchestration layer that routes AI requests to the correct model based
# on task type and implements the Reliability Architecture (99.9% uptime)
# from the Strategic AI Integration Roadmap (2026).
#
# Failover Logic:
#   1. Primary Model (task-designated)
#   2. Tier 1 Fallback (if latency > threshold or rate limit hit)
#   3. Tier 2 Fallback (if Tier 1 also fails)
# =============================================================================

import time
import asyncio
from enum import Enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable
from datetime import datetime, timedelta

import structlog

from app.core.model_config import (
    TaskType,
    ModelSpec,
    TaskModelMapping,
    get_model_for_task,
)

logger = structlog.get_logger()


# =============================================================================
# Circuit Breaker
# =============================================================================

class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation, requests flow through
    OPEN = "open"          # Failures exceeded threshold, requests blocked
    HALF_OPEN = "half_open"  # Testing if service has recovered


@dataclass
class CircuitBreaker:
    """
    Per-model circuit breaker implementing the roadmap's reliability architecture.
    
    When a model exceeds the latency threshold (default 5s from roadmap) or
    hits too many consecutive failures, the circuit opens and traffic is routed
    to the next fallback in the chain.
    """
    model_id: str
    failure_threshold: int = 3
    recovery_timeout_seconds: int = 60
    latency_threshold_ms: int = 5000  # 5s as specified in the roadmap

    # Internal state
    state: CircuitState = field(default=CircuitState.CLOSED)
    failure_count: int = field(default=0)
    last_failure_time: Optional[datetime] = field(default=None)
    last_success_time: Optional[datetime] = field(default=None)

    # Metrics
    total_requests: int = field(default=0)
    total_failures: int = field(default=0)
    total_fallbacks: int = field(default=0)

    def record_success(self, latency_ms: float):
        """Record a successful request and potentially close the circuit."""
        self.total_requests += 1
        self.last_success_time = datetime.now()
        self.failure_count = 0
        self.state = CircuitState.CLOSED

        logger.debug(
            "Circuit breaker: success",
            model=self.model_id,
            latency_ms=round(latency_ms, 1),
            state=self.state.value,
        )

    def record_failure(self, reason: str = ""):
        """Record a failure and potentially open the circuit."""
        self.total_requests += 1
        self.total_failures += 1
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(
                "Circuit breaker OPENED — routing to fallback",
                model=self.model_id,
                failures=self.failure_count,
                reason=reason,
            )
        else:
            logger.warning(
                "Circuit breaker: failure recorded",
                model=self.model_id,
                failures=f"{self.failure_count}/{self.failure_threshold}",
                reason=reason,
            )

    def record_latency_exceeded(self, latency_ms: float):
        """Record a request that exceeded the latency threshold."""
        self.total_fallbacks += 1
        logger.warning(
            "Circuit breaker: latency threshold exceeded",
            model=self.model_id,
            latency_ms=round(latency_ms, 1),
            threshold_ms=self.latency_threshold_ms,
        )
        self.record_failure(reason=f"latency_exceeded_{round(latency_ms)}ms")

    def should_allow_request(self) -> bool:
        """Check if a request should be allowed through the circuit."""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if self.last_failure_time is not None:
                elapsed = (datetime.now() - self.last_failure_time).total_seconds()
                if elapsed >= self.recovery_timeout_seconds:
                    self.state = CircuitState.HALF_OPEN
                    logger.info(
                        "Circuit breaker moving to HALF_OPEN (testing recovery)",
                        model=self.model_id,
                        elapsed_seconds=int(elapsed),
                    )
                    return True
            return False

        # HALF_OPEN: allow one test request
        return True

    def get_metrics(self) -> Dict[str, Any]:
        """Get circuit breaker metrics for monitoring."""
        return {
            "model_id": self.model_id,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "total_requests": self.total_requests,
            "total_failures": self.total_failures,
            "total_fallbacks": self.total_fallbacks,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time is not None else None,
            "last_success": self.last_success_time.isoformat() if self.last_success_time is not None else None,
        }


# =============================================================================
# Routing Result
# =============================================================================

@dataclass
class RoutingResult:
    """Result of a model routing decision."""
    model_spec: ModelSpec
    is_fallback: bool = False
    fallback_level: int = 0  # 0 = primary, 1 = tier 1, 2 = tier 2, etc.
    reason: str = ""


# =============================================================================
# Model Router
# =============================================================================

class ModelRouter:
    """
    Central orchestration layer for routing AI requests to the correct model.
    
    Implements the roadmap's multi-model architecture:
    - Routes based on TaskType → ModelSpec mapping
    - Circuit breaker per model (5s latency threshold, 3 failure threshold)
    - Automatic failover through the fallback chain
    - Metrics tracking for monitoring
    
    Usage:
        router = ModelRouter()
        result = router.route(TaskType.AWARD)
        # result.model_spec.model_id -> "openai/gpt-oss-120b"
        
        # After a successful call:
        router.record_success(result.model_spec.model_id, latency_ms=1200)
        
        # After a failure:
        router.record_failure(result.model_spec.model_id, "rate_limit")
    """

    def __init__(
        self,
        failure_threshold: int = 3,
        recovery_timeout_seconds: int = 60,
        latency_threshold_ms: int = 5000,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.latency_threshold_ms = latency_threshold_ms

        # Per-model circuit breakers (created lazily)
        self._circuit_breakers: Dict[str, CircuitBreaker] = {}

        logger.info(
            "ModelRouter initialized",
            failure_threshold=failure_threshold,
            recovery_timeout_s=recovery_timeout_seconds,
            latency_threshold_ms=latency_threshold_ms,
        )

    def _get_circuit_breaker(self, model_id: str) -> CircuitBreaker:
        """Get or create a circuit breaker for a model."""
        if model_id not in self._circuit_breakers:
            self._circuit_breakers[model_id] = CircuitBreaker(
                model_id=model_id,
                failure_threshold=self.failure_threshold,
                recovery_timeout_seconds=self.recovery_timeout_seconds,
                latency_threshold_ms=self.latency_threshold_ms,
            )
        return self._circuit_breakers[model_id]

    def route(self, task_type: TaskType) -> RoutingResult:
        """
        Determine which model to use for a given task type.
        
        Checks the circuit breaker for each model in the fallback chain
        and returns the first model that is accepting requests.
        
        Args:
            task_type: The type of AI task to route.
            
        Returns:
            RoutingResult with the selected model and fallback metadata.
        """
        mapping = get_model_for_task(task_type)

        # Try primary model first
        primary_cb = self._get_circuit_breaker(mapping.primary.model_id)
        if primary_cb.should_allow_request():
            return RoutingResult(
                model_spec=mapping.primary,
                is_fallback=False,
                fallback_level=0,
                reason="primary",
            )

        # Try fallbacks in order
        for i, fallback in enumerate(mapping.fallbacks):
            fallback_cb = self._get_circuit_breaker(fallback.model_id)
            if fallback_cb.should_allow_request():
                logger.info(
                    "Routing to fallback model",
                    task=task_type.value,
                    primary=mapping.primary.model_id,
                    fallback=fallback.model_id,
                    fallback_level=i + 1,
                )
                return RoutingResult(
                    model_spec=fallback,
                    is_fallback=True,
                    fallback_level=i + 1,
                    reason=f"primary_circuit_open",
                )

        # All circuit breakers are open — force use primary as last resort
        logger.error(
            "All models in fallback chain have open circuits — forcing primary",
            task=task_type.value,
            primary=mapping.primary.model_id,
        )
        return RoutingResult(
            model_spec=mapping.primary,
            is_fallback=False,
            fallback_level=0,
            reason="all_circuits_open_forced_primary",
        )

    def record_success(self, model_id: str, latency_ms: float):
        """Record a successful request for a model."""
        cb = self._get_circuit_breaker(model_id)

        # Check if latency exceeded threshold (slow success is still a concern)
        if latency_ms > self.latency_threshold_ms:
            cb.record_latency_exceeded(latency_ms)
        else:
            cb.record_success(latency_ms)

    def record_failure(self, model_id: str, reason: str = ""):
        """Record a failed request for a model."""
        cb = self._get_circuit_breaker(model_id)
        cb.record_failure(reason)

    def get_system_prompt(self, task_type: TaskType) -> Optional[str]:
        """Get the system prompt template for a task type, if one exists."""
        mapping = get_model_for_task(task_type)
        return mapping.system_prompt_template

    def get_model_params(self, task_type: TaskType) -> Dict[str, Any]:
        """Get the default parameters for a task type's model."""
        result = self.route(task_type)
        spec = result.model_spec
        return {
            "model": spec.model_id,
            "temperature": spec.default_temperature,
            "max_tokens": spec.max_tokens,
            "stream": False,
        }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Get metrics for all circuit breakers (for monitoring dashboard)."""
        return {
            model_id: cb.get_metrics()
            for model_id, cb in self._circuit_breakers.items()
        }

    def get_health_status(self) -> Dict[str, Any]:
        """Get overall health status of the model routing system."""
        total_open = sum(
            1 for cb in self._circuit_breakers.values()
            if cb.state == CircuitState.OPEN
        )
        total_models = len(self._circuit_breakers) if self._circuit_breakers else 0

        return {
            "healthy": total_open == 0,
            "total_models_tracked": total_models,
            "circuits_open": total_open,
            "circuits": self.get_all_metrics(),
        }


# =============================================================================
# Global Router Instance
# =============================================================================

# Default configuration from the roadmap:
# - 5s latency threshold
# - 3 consecutive failures to open circuit
# - 60s recovery timeout
model_router = ModelRouter(
    failure_threshold=3,
    recovery_timeout_seconds=60,
    latency_threshold_ms=5000,
)
