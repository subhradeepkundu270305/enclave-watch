"""C2 Beacon Detection — Autocorrelation + FFT on inter-connection timing.

Formula: P_k = |FFT(x)_k|²
Flag if peak power at k>0 exceeds FFT_PEAK_RATIO × mean power.
A regular heartbeat appears as a dominant frequency spike.
"""
import math
import numpy as np
from collections import defaultdict
from detectors.base import BaseDetector
from models import FeatureVector
from config import FFT_MIN_SAMPLES, FFT_PEAK_RATIO


class C2BeaconDetector(BaseDetector):
    name = "c2_beacon"
    description = "Detects C2 beaconing via FFT power spectrum analysis of connection inter-arrival times"
    algorithm = "FFT Power Spectrum + Autocorrelation"

    def __init__(self):
        self._buffers: defaultdict[str, list[float]] = defaultdict(list)

    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        ip = features.src_ip
        iats = features.inter_arrival_times

        if len(iats) < FFT_MIN_SAMPLES:
            return 0.0, {"reason": "insufficient_samples", "samples": len(iats)}

        x = np.array(iats[-FFT_MIN_SAMPLES:], dtype=float)

        # Detrend
        x = x - x.mean()

        fft_vals = np.fft.rfft(x)
        power = np.abs(fft_vals) ** 2

        # Skip DC component (k=0)
        ac_power = power[1:]
        if len(ac_power) == 0:
            return 0.0, {"reason": "no_ac_components"}

        peak_idx = int(np.argmax(ac_power)) + 1
        peak_power = float(ac_power[peak_idx - 1])
        mean_power = float(ac_power.mean()) + 1e-9
        ratio = peak_power / mean_power

        # Compute dominant period in seconds
        n = len(x)
        mean_iat = float(np.mean(np.abs(features.inter_arrival_times))) if features.inter_arrival_times else 1.0
        total_time = n * mean_iat
        dominant_period = total_time / peak_idx if peak_idx > 0 else 0.0

        prob = min(1.0, (ratio - 1.0) / 10.0) if ratio > FFT_PEAK_RATIO * 10 else 0.0

        return prob, {
            "peak_frequency_idx": peak_idx,
            "peak_power": round(peak_power, 4),
            "mean_power": round(mean_power, 4),
            "peak_ratio": round(ratio, 4),
            "dominant_period_sec": round(dominant_period, 2),
            "samples_analysed": len(x),
        }

    def reset_state(self, src_ip: str) -> None:
        self._buffers.pop(src_ip, None)
