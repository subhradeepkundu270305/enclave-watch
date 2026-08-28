"""DDoS Detection — EWMA + adaptive threshold.

Formula:
  μ_t = α·x_t + (1-α)·μ_(t-1)
  σ_t = sqrt(α·(x_t - μ_t)² + (1-α)·σ_(t-1)²)
  Alert if x_t > μ_t + k·σ_t
"""
import math
from collections import defaultdict
from detectors.base import BaseDetector
from models import FeatureVector
from config import EWMA_ALPHA, EWMA_K_THRESHOLD


def _sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(-20, min(20, z))))


class DDoSDetector(BaseDetector):
    name = "ddos"
    description = "Detects volumetric DDoS attacks via EWMA adaptive threshold on connection rate"
    algorithm = "EWMA + Adaptive σ Threshold"

    def __init__(self):
        self._mu: defaultdict[str, float] = defaultdict(float)
        self._sigma: defaultdict[str, float] = defaultdict(lambda: 1.0)
        self._n: defaultdict[str, int] = defaultdict(int)

    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        ip = features.src_ip
        x = features.connection_rate
        α = EWMA_ALPHA
        k = EWMA_K_THRESHOLD

        self._n[ip] += 1
        if self._n[ip] == 1:
            self._mu[ip] = x
            self._sigma[ip] = max(1.0, x * 0.1)
            return 0.0, {"reason": "warming_up"}

        μ_prev = self._mu[ip]
        σ_prev = self._sigma[ip]

        μ_t = α * x + (1 - α) * μ_prev
        σ_t = math.sqrt(α * (x - μ_t) ** 2 + (1 - α) * σ_prev ** 2)
        σ_t = max(σ_t, 0.001)

        self._mu[ip] = μ_t
        self._sigma[ip] = σ_t

        threshold = μ_t + k * σ_t
        z = (x - μ_t) / σ_t
        prob = _sigmoid(z - k) if x > threshold else 0.0

        return prob, {
            "connection_rate": round(x, 4),
            "ewma_mean": round(μ_t, 4),
            "ewma_std": round(σ_t, 4),
            "threshold": round(threshold, 4),
            "z_score": round(z, 4),
            "samples": self._n[ip],
        }

    def reset_state(self, src_ip: str) -> None:
        self._mu.pop(src_ip, None)
        self._sigma.pop(src_ip, None)
        self._n.pop(src_ip, None)
