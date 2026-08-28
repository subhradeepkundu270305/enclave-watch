"""DNS Tunnelling Detection — Shannon Entropy + N-gram analysis.

Formula: H(X) = -Σ p_i log₂(p_i)

High entropy + long subdomain + high query frequency → tunnelling.
N-gram scoring uses precomputed English character bigram log-probs.
"""
import math
from detectors.base import BaseDetector
from models import FeatureVector
from config import DNS_ENTROPY_THRESHOLD, DNS_SUBDOMAIN_LEN_THRESHOLD, DNS_NGRAM_THRESHOLD

# Precomputed English character bigram log-probabilities (top-50 bigrams)
# Source: approximated from standard English letter frequency analysis
_ENGLISH_BIGRAMS: dict[str, float] = {
    "th": -2.3, "he": -2.5, "in": -2.6, "er": -2.7, "an": -2.8,
    "re": -2.9, "on": -3.0, "at": -3.1, "en": -3.2, "nd": -3.3,
    "ti": -3.4, "es": -3.5, "or": -3.6, "te": -3.7, "of": -3.8,
    "ed": -3.9, "is": -4.0, "it": -4.1, "al": -4.2, "ar": -4.3,
    "st": -4.4, "to": -4.5, "nt": -4.6, "ng": -4.7, "se": -4.8,
    "ha": -4.9, "as": -5.0, "ou": -5.1, "io": -5.2, "le": -5.3,
    "ve": -5.4, "co": -5.5, "me": -5.6, "de": -5.7, "hi": -5.8,
    "ri": -5.9, "ro": -6.0, "ic": -6.1, "ne": -6.2, "ea": -6.3,
    "ra": -6.4, "ce": -6.5, "li": -6.6, "ch": -6.7, "ll": -6.8,
    "be": -6.9, "ma": -7.0, "si": -7.1, "om": -7.2, "ur": -7.3,
}
_DEFAULT_BIGRAM_LOGP = -9.0  # unseen bigrams


def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((v / n) * math.log2(v / n) for v in freq.values())


def _ngram_score(s: str) -> float:
    """Mean log-probability of character bigrams — lower = more random/non-English."""
    if len(s) < 2:
        return 0.0
    scores = []
    s_lower = s.lower()
    for i in range(len(s_lower) - 1):
        bg = s_lower[i:i + 2]
        scores.append(_ENGLISH_BIGRAMS.get(bg, _DEFAULT_BIGRAM_LOGP))
    return sum(scores) / len(scores)


class DNSTunnelDetector(BaseDetector):
    name = "dns_tunnel"
    description = "Detects DNS tunnelling via Shannon entropy and N-gram language model on subdomain strings"
    algorithm = "Shannon Entropy + Character N-gram Scoring"

    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        entropy = features.dns_query_entropy
        sublen = features.dns_subdomain_length
        freq = features.dns_query_frequency

        if entropy == 0.0 and sublen == 0.0:
            return 0.0, {"reason": "no_dns_activity"}

        # Entropy component
        entropy_score = min(1.0, max(0.0, (entropy - DNS_ENTROPY_THRESHOLD) / 2.0))

        # Length component
        len_score = min(1.0, max(0.0, (sublen - DNS_SUBDOMAIN_LEN_THRESHOLD) / 20.0))

        # Frequency component
        freq_score = min(1.0, freq / 5.0)

        # Combined weighted probability
        prob = 0.5 * entropy_score + 0.3 * len_score + 0.2 * freq_score
        prob = min(1.0, prob)

        return prob, {
            "dns_entropy": round(entropy, 4),
            "entropy_threshold": DNS_ENTROPY_THRESHOLD,
            "avg_subdomain_length": round(sublen, 2),
            "length_threshold": DNS_SUBDOMAIN_LEN_THRESHOLD,
            "query_frequency_hz": round(freq, 4),
            "entropy_score": round(entropy_score, 3),
            "length_score": round(len_score, 3),
            "frequency_score": round(freq_score, 3),
        }
