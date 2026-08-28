"""Enclave Watch — FastAPI application entry point.

Pipeline: Traffic Generator → asyncio.Queue → Feature Extractor
         → 6 Detectors → Evidence Chain → WebSocket Broadcast

NO outbound network calls are made from this backend.
All traffic is synthetic; all detection is passive.
"""
import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import (
    TRAFFIC_GEN_INTERVAL, NORMAL_EVENT_RATIO,
    CONFIDENCE_WEIGHTS, ASSET_CRITICALITY, IMPACT_SCORE,
    OPERATION_MODE, EGRESS_RULE, DATA_RETENTION_DAYS,
)
from models import Alert, NetworkEvent
from generator.traffic_gen import continuous_stream, burst_attack, gen_normal_event
from pipeline.queue_manager import event_queue
from pipeline.feature_extractor import FeatureExtractor
from detectors.ddos import DDoSDetector
from detectors.c2_beacon import C2BeaconDetector
from detectors.dns_tunnel import DNSTunnelDetector
from detectors.encrypted_malware import EncryptedMalwareDetector
from detectors.port_scan import PortScanDetector
from detectors.data_exfil import DataExfilDetector
from evidence.chain import build_evidence_bundle, verify_bundle, get_public_key_pem, GENESIS_HASH
from evidence.store import (
    init_db, append_bundle, get_alerts, get_alert_by_id,
    get_chain_length, get_last_chain_hash, get_next_sequence,
    tamper_bundle as _tamper_bundle, get_ip_history,
    get_analytics_by_type, get_analytics_by_severity,
    verify_chain_intact
)
from websocket.broadcaster import manager

# ─── Global state ─────────────────────────────────────────────────────────────

_start_time = time.time()
_events_processed = 0
_total_alerts = 0
_recent_events: list[dict] = []   # last 200 raw events for Live Monitoring
_MAX_RECENT = 200
_eps_window: list[float] = []     # timestamps for EPS calculation
_EPS_WINDOW_SEC = 10.0

# Detector instances
_detectors = {
    "ddos":               DDoSDetector(),
    "c2_beacon":          C2BeaconDetector(),
    "dns_tunnel":         DNSTunnelDetector(),
    "encrypted_malware":  EncryptedMalwareDetector(),
    "port_scan":          PortScanDetector(),
    "data_exfil":         DataExfilDetector(),
}

_extractor = FeatureExtractor()

# ─── Scoring helpers ──────────────────────────────────────────────────────────

def _severity(confidence: float) -> str:
    if confidence >= 0.8:   return "CRITICAL"
    if confidence >= 0.6:   return "HIGH"
    if confidence >= 0.4:   return "MEDIUM"
    return "LOW"


def _weighted_confidence(scores: dict[str, float]) -> float:
    total_w = sum(CONFIDENCE_WEIGHTS[k] for k in scores)
    if total_w == 0:
        return 0.0
    return sum(CONFIDENCE_WEIGHTS[k] * v for k, v in scores.items()) / total_w


def _risk_score(prob: float) -> float:
    return round(prob * ASSET_CRITICALITY * IMPACT_SCORE, 4)


_THREAT_TITLES = {
    "ddos":               "Volumetric DDoS Attack Detected",
    "c2_beacon":          "C2 Beaconing Pattern Identified",
    "dns_tunnel":         "DNS Tunnelling Exfiltration Suspected",
    "encrypted_malware":  "Anomalous TLS Session / Encrypted Malware",
    "port_scan":          "Port Scanning Activity Detected",
    "data_exfil":         "Data Exfiltration Spike Detected",
}

_THREAT_DESCS = {
    "ddos": "Connection rate significantly exceeded adaptive EWMA threshold — consistent with SYN flood pattern.",
    "c2_beacon": "Inter-arrival time FFT shows dominant periodic frequency — consistent with C2 heartbeat beaconing.",
    "dns_tunnel": "High-entropy subdomains with anomalous length and query frequency — consistent with DNS tunnelling.",
    "encrypted_malware": "TLS fingerprint vector is far from normal baseline (Mahalanobis) with self-signed certificate.",
    "port_scan": "Unique destination port count and connection rate both exceed thresholds within the observation window.",
    "data_exfil": "CUSUM on standardised outbound bytes crossed threshold — sustained anomalous egress volume detected.",
}

# ─── Pipeline loop ────────────────────────────────────────────────────────────

async def _pipeline_loop() -> None:
    global _events_processed, _total_alerts
    prev_hash = GENESIS_HASH

    # Load latest chain state
    try:
        prev_hash = await get_last_chain_hash()
    except Exception:
        pass

    while True:
        event: NetworkEvent = await event_queue.get()
        _events_processed += 1
        now = time.time()
        _eps_window.append(now)
        # Trim EPS window
        cutoff = now - _EPS_WINDOW_SEC
        while _eps_window and _eps_window[0] < cutoff:
            _eps_window.pop(0)

        event_dict = event.model_dump()
        event_dict["type"] = "network_event"

        # Store in recent events ring buffer
        _recent_events.append(event_dict)
        if len(_recent_events) > _MAX_RECENT:
            _recent_events.pop(0)

        # Broadcast raw event to dashboard
        await manager.broadcast(event_dict)

        # Feature extraction
        features = _extractor.process(event)

        # Run all 6 detectors
        results: dict[str, tuple[float, dict]] = {}
        for name, det in _detectors.items():
            try:
                prob, evidence = det.detect(features)
                results[name] = (prob, evidence)
            except Exception:
                results[name] = (0.0, {"error": "detector_exception"})

        # Check if any detector fires above threshold
        fired = {k: v for k, v in results.items() if v[0] >= 0.3}
        if not fired:
            event_queue.task_done()
            continue

        # Build composite alert for the top-scoring threat
        top_threat = max(fired, key=lambda k: fired[k][0])
        top_prob, top_evidence = fired[top_threat]
        conf = round(min(1.0, top_prob), 4)
        sev = _severity(conf)

        alert = Alert(
            threat_type=top_threat,
            severity=sev,
            confidence=conf,
            risk_score=_risk_score(conf),
            src_ip=event.src_ip,
            dst_ip=event.dst_ip,
            dst_port=event.dst_port,
            title=_THREAT_TITLES.get(top_threat, "Threat Detected"),
            description=_THREAT_DESCS.get(top_threat, ""),
            evidence_dict={
                "detector_scores": {k: round(v[0], 4) for k, v in results.items()},
                "top_detector": top_threat,
                "top_evidence": top_evidence,
                "event_id": event.id,
            }
        )

        seq = await get_next_sequence()
        alert.sequence = seq

        # Build evidence bundle
        bundle = build_evidence_bundle(alert, prev_hash, seq)
        prev_hash = bundle.chain_context["this_hash"]
        _total_alerts += 1

        # Persist
        try:
            await append_bundle(bundle)
        except Exception:
            pass

        # Broadcast alert
        payload = bundle.model_dump()
        payload["type"] = "new_alert"
        await manager.broadcast(payload)

        # Broadcast detector status
        status_payload = {
            "type": "detector_status",
            "scores": {k: round(v[0], 4) for k, v in results.items()},
            "ts": event.ts,
        }
        await manager.broadcast(status_payload)

        # Broadcast health every 10 events
        if _events_processed % 10 == 0:
            await _broadcast_health()

        event_queue.task_done()


async def _broadcast_health() -> None:
    uptime = time.time() - _start_time
    eps = len(_eps_window) / _EPS_WINDOW_SEC
    chain_len = await get_chain_length()
    chain_ok = await verify_chain_intact()
    payload = {
        "type": "system_health",
        "uptime_seconds": round(uptime, 1),
        "events_processed": _events_processed,
        "events_per_second": round(eps, 2),
        "total_alerts": _total_alerts,
        "chain_length": chain_len,
        "chain_intact": chain_ok,
        "active_detectors": len(_detectors),
        "ws_connections": manager.count,
    }
    await manager.broadcast(payload)


# ─── App lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    asyncio.create_task(
        continuous_stream(event_queue, NORMAL_EVENT_RATIO, TRAFFIC_GEN_INTERVAL)
    )
    asyncio.create_task(_pipeline_loop())
    yield


app = FastAPI(
    title="Enclave Watch API",
    description="Passive AI Cyber Threat Detection — NTRO SIH 2026",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ─── REST endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    uptime = time.time() - _start_time
    eps = len(_eps_window) / _EPS_WINDOW_SEC
    chain_len = await get_chain_length()
    chain_ok = await verify_chain_intact()
    return {
        "uptime_seconds": round(uptime, 1),
        "started_at": datetime.fromtimestamp(_start_time, timezone.utc).isoformat(),
        "events_processed": _events_processed,
        "events_per_second": round(eps, 2),
        "total_alerts": _total_alerts,
        "chain_length": chain_len,
        "chain_intact": chain_ok,
        "active_detectors": len(_detectors),
        "ws_connections": manager.count,
        "operation_mode": OPERATION_MODE,
        "egress_rule": EGRESS_RULE,
    }


@app.get("/alerts")
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    threat_type: Optional[str] = None,
):
    bundles = await get_alerts(limit, offset, severity, threat_type)
    return {"alerts": bundles, "count": len(bundles)}


@app.get("/alerts/{alert_id}/evidence")
async def get_evidence(alert_id: str):
    bundle = await get_alert_by_id(alert_id)
    if not bundle:
        raise HTTPException(404, "Alert not found")
    return bundle


@app.post("/verify/{alert_id}")
async def verify_alert(alert_id: str):
    bundle = await get_alert_by_id(alert_id)
    if not bundle:
        raise HTTPException(404, "Alert not found")
    ok, reason = verify_bundle(bundle)
    return {"alert_id": alert_id, "verified": ok, "reason": reason}


@app.post("/tamper-test/{alert_id}")
async def tamper_test(alert_id: str):
    """Mutate stored record and show verification failing — for demo."""
    ok = await _tamper_bundle(alert_id)
    if not ok:
        raise HTTPException(404, "Alert not found")
    bundle = await get_alert_by_id(alert_id)
    verified, reason = verify_bundle(bundle)
    return {
        "alert_id": alert_id,
        "tampered": True,
        "verified": verified,
        "reason": reason,
        "bundle": bundle,
    }


@app.get("/ip-history")
async def ip_history():
    records = await get_ip_history()
    return {"records": records, "count": len(records)}


@app.get("/analytics/by-type")
async def analytics_by_type():
    data = await get_analytics_by_type()
    return {"data": data}


@app.get("/analytics/by-severity")
async def analytics_by_severity():
    data = await get_analytics_by_severity()
    return {"data": data}


@app.get("/recent-events")
async def recent_events(limit: int = Query(100, ge=1, le=200)):
    return {"events": _recent_events[-limit:]}


@app.post("/demo/generate/{attack_type}")
async def demo_generate(attack_type: str):
    valid = ["normal", "ddos", "c2_beacon", "dns_tunnel", "encrypted_malware", "port_scan", "data_exfil"]
    if attack_type not in valid:
        raise HTTPException(400, f"Unknown attack_type. Valid: {valid}")
    events = await burst_attack(attack_type, count=30)
    for ev in events:
        await event_queue.put(ev)
    return {"queued": len(events), "attack_type": attack_type}


@app.post("/demo/run-all")
async def demo_run_all():
    types = ["ddos", "c2_beacon", "dns_tunnel", "encrypted_malware", "port_scan", "data_exfil"]
    total = 0
    for at in types:
        events = await burst_attack(at, count=20)
        for ev in events:
            await event_queue.put(ev)
        total += len(events)
        await asyncio.sleep(0.1)
    return {"queued": total, "attack_types": types}


@app.get("/settings")
async def settings():
    return {
        "operation_mode": OPERATION_MODE,
        "egress_rule": EGRESS_RULE,
        "data_retention_days": DATA_RETENTION_DAYS,
        "public_key_pem": get_public_key_pem(),
        "detectors": [
            {"name": d.name, "description": d.description, "algorithm": d.algorithm}
            for d in _detectors.values()
        ],
    }


@app.get("/detectors")
async def detectors_status():
    return {
        "detectors": [
            {
                "name": d.name,
                "description": d.description,
                "algorithm": d.algorithm,
                "active": True,
            }
            for d in _detectors.values()
        ]
    }
