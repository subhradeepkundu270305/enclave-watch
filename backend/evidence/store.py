"""SQLite persistence for alerts and the evidence chain.

The chain is append-only: sequence is monotonic and prev_hash always
matches the previous record's this_hash.
"""
import json
import aiosqlite
from models import EvidenceRecord
from evidence.chain import GENESIS_HASH
from config import DB_PATH


CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS alerts (
    sequence    INTEGER PRIMARY KEY,
    alert_id    TEXT NOT NULL,
    chain_hash  TEXT NOT NULL,
    bundle_json TEXT NOT NULL,
    created_at  REAL NOT NULL,
    threat_type TEXT,
    severity    TEXT,
    src_ip      TEXT
);
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_TABLE)
        await db.commit()


async def get_chain_length() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM alerts") as cur:
            row = await cur.fetchone()
            return row[0] if row else 0


async def get_last_chain_hash() -> str:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT chain_hash FROM alerts ORDER BY sequence DESC LIMIT 1"
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else GENESIS_HASH


async def get_next_sequence() -> int:
    return await get_chain_length()


async def append_bundle(bundle: EvidenceRecord) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        alert = bundle.alert
        await db.execute(
            """INSERT INTO alerts
               (sequence, alert_id, chain_hash, bundle_json, created_at, threat_type, severity, src_ip)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                bundle.chain_context["sequence"],
                alert.get("id", ""),
                bundle.chain_context["this_hash"],
                json.dumps(bundle.model_dump()),
                alert.get("ts", 0.0),
                alert.get("threat_type", ""),
                alert.get("severity", ""),
                alert.get("src_ip", ""),
            )
        )
        await db.commit()


async def get_alerts(
    limit: int = 50,
    offset: int = 0,
    severity: str | None = None,
    threat_type: str | None = None,
) -> list[dict]:
    conditions = []
    params: list = []
    if severity:
        conditions.append("severity = ?")
        params.append(severity)
    if threat_type:
        conditions.append("threat_type = ?")
        params.append(threat_type)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    params += [limit, offset]

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT bundle_json FROM alerts {where} ORDER BY sequence DESC LIMIT ? OFFSET ?",
            params
        ) as cur:
            rows = await cur.fetchall()
            return [json.loads(r["bundle_json"]) for r in rows]


async def get_alert_by_id(alert_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT bundle_json FROM alerts WHERE alert_id = ? LIMIT 1",
            (alert_id,)
        ) as cur:
            row = await cur.fetchone()
            return json.loads(row["bundle_json"]) if row else None


async def tamper_bundle(alert_id: str) -> bool:
    """Mutate stored bundle to demonstrate verification failure."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT sequence, bundle_json FROM alerts WHERE alert_id = ? LIMIT 1",
            (alert_id,)
        ) as cur:
            row = await cur.fetchone()
        if not row:
            return False
        bundle = json.loads(row["bundle_json"])
        # Mutate: change confidence score in the alert
        bundle["alert"]["confidence"] = 0.0
        bundle["alert"]["title"] = "[TAMPERED] " + bundle["alert"].get("title", "")
        await db.execute(
            "UPDATE alerts SET bundle_json = ? WHERE sequence = ?",
            (json.dumps(bundle), row["sequence"])
        )
        await db.commit()
        return True


async def get_ip_history() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT src_ip,
                      COUNT(*) as total_alerts,
                      MAX(severity) as highest_severity,
                      GROUP_CONCAT(DISTINCT threat_type) as threat_types,
                      MIN(created_at) as first_seen,
                      MAX(created_at) as last_seen
               FROM alerts
               GROUP BY src_ip
               ORDER BY total_alerts DESC
               LIMIT 100"""
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def get_analytics_by_type() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT threat_type, COUNT(*) as count FROM alerts GROUP BY threat_type"
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def get_analytics_by_severity() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity"
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def verify_chain_intact() -> bool:
    """Walk the entire chain and verify prev_hash links."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT sequence, chain_hash, bundle_json FROM alerts ORDER BY sequence ASC"
        ) as cur:
            rows = await cur.fetchall()

    prev = GENESIS_HASH
    for row in rows:
        bundle = json.loads(row["bundle_json"])
        ctx = bundle.get("chain_context", {})
        if ctx.get("prev_hash") != prev:
            return False
        prev = ctx.get("this_hash", "")
    return True
