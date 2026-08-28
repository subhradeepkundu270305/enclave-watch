"""Feature extraction — computes rolling per-source-IP statistics.

Maintains a deque-based sliding window (FEATURE_WINDOW_SEC) per IP.
All computation is purely from observed packet metadata — no outbound probing.
"""
import math
import time
import hashlib
from collections import defaultdict, deque
from typing import Optional
from models import NetworkEvent, FeatureVector
from config import FEATURE_WINDOW_SEC


class _IPState:
    """Rolling window state for one source IP."""
    __slots__ = (
        "timestamps", "dst_ports", "bytes_out", "dns_queries",
        "inter_arrivals", "last_ts", "tls_features", "has_self_signed"
    )

    def __init__(self):
        self.timestamps: deque[float] = deque()
        self.dst_ports: deque[int] = deque()
        self.bytes_out: deque[int] = deque()
        self.dns_queries: deque[str] = deque()
        self.inter_arrivals: deque[float] = deque(maxlen=256)
        self.last_ts: Optional[float] = None
        self.tls_features: deque[list] = deque(maxlen=256)
        self.has_self_signed: bool = False


def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((v / n) * math.log2(v / n) for v in freq.values())


def _tls_feature_vector(tls) -> list[float]:
    """Convert TLS metadata into a numeric feature vector."""
    if tls is None:
        return [0.0, 0.0, 0.0, 0.0]
    version_map = {"TLSv1.0": 1.0, "TLSv1.1": 2.0, "TLSv1.2": 3.0, "TLSv1.3": 4.0}
    ver = version_map.get(tls.tls_version or "", 3.0)
    n_ext = len(tls.extensions or [])
    n_curves = len(tls.curves or [])
    self_signed_f = 1.0 if tls.self_signed else 0.0
    return [ver, float(n_ext), float(n_curves), self_signed_f]


def _tls_fp_hash(tls) -> Optional[str]:
    if tls is None:
        return None
    raw = f"{tls.cipher_suite}|{tls.tls_version}|{','.join(sorted(tls.extensions or []))}|{','.join(sorted(tls.curves or []))}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


class FeatureExtractor:
    """Stateful feature extractor over the event stream."""

    def __init__(self, window_sec: float = FEATURE_WINDOW_SEC):
        self._window = window_sec
        self._states: defaultdict[str, _IPState] = defaultdict(_IPState)

    def _evict_old(self, state: _IPState, now: float) -> None:
        cutoff = now - self._window
        while state.timestamps and state.timestamps[0] < cutoff:
            state.timestamps.popleft()
            if state.dst_ports:
                state.dst_ports.popleft()
            if state.bytes_out:
                state.bytes_out.popleft()

    def process(self, event: NetworkEvent) -> FeatureVector:
        now = event.ts
        st = self._states[event.src_ip]

        # Inter-arrival time
        if st.last_ts is not None:
            st.inter_arrivals.append(now - st.last_ts)
        st.last_ts = now

        # Sliding window update
        st.timestamps.append(now)
        st.dst_ports.append(event.dst_port)
        st.bytes_out.append(event.bytes_out)
        if event.dns_query:
            subdomain = event.dns_query.split(".")[0]
            st.dns_queries.append(subdomain)
            if len(st.dns_queries) > 256:
                st.dns_queries.popleft()

        # TLS features
        if event.tls_metadata:
            st.tls_features.append(_tls_feature_vector(event.tls_metadata))
            if event.tls_metadata.self_signed:
                st.has_self_signed = True

        self._evict_old(st, now)

        # Compute features
        n = len(st.timestamps)
        window_actual = min(self._window, now - st.timestamps[0] + 1e-9) if n > 1 else self._window
        conn_rate = n / window_actual

        # DNS entropy (mean over recent subdomains)
        dns_entropy = 0.0
        dns_sublen = 0.0
        dns_freq = 0.0
        if st.dns_queries:
            entropies = [_shannon_entropy(q) for q in list(st.dns_queries)[-20:]]
            dns_entropy = sum(entropies) / len(entropies)
            dns_sublen = sum(len(q) for q in list(st.dns_queries)[-20:]) / len(list(st.dns_queries)[-20:])
            dns_freq = len(st.dns_queries) / window_actual

        return FeatureVector(
            src_ip=event.src_ip,
            ts=now,
            connection_rate=conn_rate,
            unique_dst_ports=len(set(st.dst_ports)),
            bytes_out_total=sum(st.bytes_out),
            bytes_in_total=0,
            dns_query_entropy=dns_entropy,
            tls_fingerprint_hash=_tls_fp_hash(event.tls_metadata),
            inter_arrival_times=list(st.inter_arrivals)[-64:],
            recent_dst_ports=list(st.dst_ports)[-64:],
            recent_bytes_out=list(st.bytes_out)[-64:],
            has_self_signed=st.has_self_signed,
            tls_feature_vec=_tls_feature_vector(event.tls_metadata),
            dns_subdomain_length=dns_sublen,
            dns_query_frequency=dns_freq,
        )

    def get_all_ips(self) -> list[str]:
        return list(self._states.keys())
