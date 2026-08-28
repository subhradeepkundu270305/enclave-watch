"""
Enclave Watch — Central Configuration
All tunable constants live here. Override via environment variables in production.
"""
import os

# EWMA / DDoS Detection
EWMA_ALPHA: float = float(os.getenv("EWMA_ALPHA", "0.3"))
EWMA_K_THRESHOLD: float = float(os.getenv("EWMA_K_THRESHOLD", "3.0"))
DDOS_RATE_THRESHOLD: float = float(os.getenv("DDOS_RATE_THRESHOLD", "50.0"))

# C2 Beacon Detection
FFT_MIN_SAMPLES: int = int(os.getenv("FFT_MIN_SAMPLES", "32"))
FFT_PEAK_RATIO: float = float(os.getenv("FFT_PEAK_RATIO", "0.35"))

# DNS Tunnel Detection
DNS_ENTROPY_THRESHOLD: float = float(os.getenv("DNS_ENTROPY_THRESHOLD", "3.5"))
DNS_SUBDOMAIN_LEN_THRESHOLD: int = int(os.getenv("DNS_SUBDOMAIN_LEN_THRESHOLD", "30"))
DNS_NGRAM_THRESHOLD: float = float(os.getenv("DNS_NGRAM_THRESHOLD", "-6.0"))

# Encrypted Malware Detection
TLS_MAHALANOBIS_THRESHOLD: float = float(os.getenv("TLS_MAHALANOBIS_THRESHOLD", "3.0"))
TLS_WARMUP_SAMPLES: int = int(os.getenv("TLS_WARMUP_SAMPLES", "20"))
SELF_SIGNED_WEIGHT: float = float(os.getenv("SELF_SIGNED_WEIGHT", "1.5"))

# Port Scan Detection
PORT_SCAN_UNIQUE_PORTS: int = int(os.getenv("PORT_SCAN_UNIQUE_PORTS", "15"))
PORT_SCAN_WINDOW_SEC: float = float(os.getenv("PORT_SCAN_WINDOW_SEC", "30.0"))
PORT_SCAN_RATE: float = float(os.getenv("PORT_SCAN_RATE", "3.0"))

# Data Exfiltration Detection
CUSUM_H: float = float(os.getenv("CUSUM_H", "5.0"))
CUSUM_SLACK: float = float(os.getenv("CUSUM_SLACK", "0.5"))
CUSUM_EPSILON: float = 1e-6

# Feature Extraction
FEATURE_WINDOW_SEC: float = float(os.getenv("FEATURE_WINDOW_SEC", "60.0"))

# Scoring
CONFIDENCE_WEIGHTS: dict = {
    "ddos": 1.0, "c2_beacon": 1.2, "dns_tunnel": 1.0,
    "encrypted_malware": 0.9, "port_scan": 0.8, "data_exfil": 1.1,
}
ASSET_CRITICALITY: float = float(os.getenv("ASSET_CRITICALITY", "1.0"))
IMPACT_SCORE: float = float(os.getenv("IMPACT_SCORE", "1.0"))

# Traffic Generator
TRAFFIC_GEN_INTERVAL: float = float(os.getenv("TRAFFIC_GEN_INTERVAL", "0.2"))
NORMAL_EVENT_RATIO: float = float(os.getenv("NORMAL_EVENT_RATIO", "0.6"))

# WebSocket
WS_PING_INTERVAL: int = int(os.getenv("WS_PING_INTERVAL", "30"))

# Storage
DB_PATH: str = os.getenv("DB_PATH", "enclave_watch.db")
KEYS_DIR: str = os.getenv("KEYS_DIR", "keys")
MAX_ALERTS_MEMORY: int = int(os.getenv("MAX_ALERTS_MEMORY", "1000"))

# Security info (read-only display)
OPERATION_MODE: str = "PASSIVE_MONITORING"
EGRESS_RULE: str = "BLOCK_ALL"
DATA_RETENTION_DAYS: int = int(os.getenv("DATA_RETENTION_DAYS", "90"))
