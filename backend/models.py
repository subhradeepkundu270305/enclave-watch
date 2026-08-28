"""Pydantic models for Enclave Watch."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime, timezone


def _now_ts() -> float:
    return datetime.now(timezone.utc).timestamp()


class TLSMetadata(BaseModel):
    ja3_hash: Optional[str] = None
    cipher_suite: Optional[str] = None
    tls_version: Optional[str] = "TLSv1.3"
    self_signed: bool = False
    extensions: Optional[List[str]] = None
    curves: Optional[List[str]] = None


class NetworkEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ts: float = Field(default_factory=_now_ts)
    src_ip: str
    dst_ip: str
    dst_port: int
    protocol: str = "TCP"
    bytes_out: int = 0
    bytes_in: int = 0
    duration: float = 0.0
    dns_query: Optional[str] = None
    tls_metadata: Optional[TLSMetadata] = None
    attack_type: Optional[str] = None  # simulation label only


class FeatureVector(BaseModel):
    src_ip: str
    ts: float
    connection_rate: float = 0.0
    unique_dst_ports: int = 0
    bytes_out_total: int = 0
    bytes_in_total: int = 0
    dns_query_entropy: float = 0.0
    tls_fingerprint_hash: Optional[str] = None
    inter_arrival_times: List[float] = Field(default_factory=list)
    recent_dst_ports: List[int] = Field(default_factory=list)
    recent_bytes_out: List[int] = Field(default_factory=list)
    has_self_signed: bool = False
    tls_feature_vec: List[float] = Field(default_factory=list)
    dns_subdomain_length: float = 0.0
    dns_query_frequency: float = 0.0


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sequence: int = 0
    ts: float = Field(default_factory=_now_ts)
    threat_type: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    confidence: float
    risk_score: float
    src_ip: str
    dst_ip: Optional[str] = None
    dst_port: Optional[int] = None
    title: str
    description: str
    evidence_dict: Dict[str, Any] = Field(default_factory=dict)


class EvidenceRecord(BaseModel):
    version: str = "1.0"
    created_at: str
    content_hash: str
    signature_hex: str
    public_key_pem: str
    chain_context: Dict[str, Any]
    alert: Dict[str, Any]
    verified: bool = False


class HealthStatus(BaseModel):
    uptime_seconds: float
    events_processed: int
    events_per_second: float
    total_alerts: int
    chain_length: int
    chain_intact: bool
    active_detectors: int
    ws_connections: int
    started_at: str


class IPHistoryRecord(BaseModel):
    src_ip: str
    total_alerts: int
    highest_severity: str
    threat_types: List[str]
    first_seen: float
    last_seen: float
    total_bytes_out: int
    avg_confidence: float
