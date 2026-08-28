"""Data Exfiltration Detection — Per-device baseline + CUSUM.

Formula:
  z_out = (B_out - μ_d) / (σ_d + ε)
  C_t = max(0, C_(t-1) + z_out - slack)
  Alert when C_t > h

Uses online rolling mean/std for per-device baseline.
"""
import math
from collections import defaultdict
from detectors.base import BaseDetector
from models import FeatureVector
from config import CUSUM_H, CUSUM_SLACK, CUSUM_EPSILON


class _OnlineStats:
    """Welford's online algorithm for mean and variance."""
    __slots__ = ("n", "mean", "M2")

    def __init__(self):
        self.n = 0
        self.mean = 0.0
        self.M2 = 0.0

    def update(self, x: float) -> None:
        self.n += 1
        delta = x - self.mean
        self.mean += delta / self.n
        delta2 = x - self.mean
        self.M2 += delta * delta2

    @property
    def variance(self) -> float:
        return self.M2 / self.n if self.n >= 2 else 1.0

    @property
    def std(self) -> float:
        return math.sqrt(self.variance)


class DataExfilDetector(BaseDetector):
    name = "data_exfil"
    description = "Detects data exfiltration via CUSUM on standardised outbound byte deviations from per-device baseline"
    algorithm = "CUSUM (Page-Hinkley) + Welford Online Baseline"

    def __init__(self):
        self._stats: defaultdict[str, _OnlineStats] = defaultdict(_OnlineStats)
        self._cusum: defaultdict[str, float] = defaultdict(float)

    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        ip = features.src_ip
        b_out = float(features.bytes_out_total)

        st = self._stats[ip]
        st.update(b_out)

        if st.n < 5:
            return 0.0, {"reason": "warming_up", "samples": st.n}

        z = (b_out - st.mean) / (st.std + CUSUM_EPSILON)
        c_prev = self._cusum[ip]
        c_t = max(0.0, c_prev + z - CUSUM_SLACK)
        self._cusum[ip] = c_t

        prob = min(1.0, c_t / CUSUM_H) if c_t > CUSUM_H else 0.0

        return prob, {
            "bytes_out_total": int(b_out),
            "baseline_mean": round(st.mean, 2),
            "baseline_std": round(st.std, 2),
            "z_score": round(z, 4),
            "cusum_value": round(c_t, 4),
            "cusum_threshold": CUSUM_H,
            "baseline_samples": st.n,
        }

    def reset_state(self, src_ip: str) -> None:
        self._stats.pop(src_ip, None)
        self._cusum.pop(src_ip, None)
