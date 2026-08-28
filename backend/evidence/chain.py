"""Evidence chain — SHA-256 hash chain + Ed25519 signing.

Chain construction:
  content_hash = SHA256(canonical_json(alert))
  chain_hash   = SHA256(prev_hash || content_hash || timestamp)
  signature    = Ed25519_Sign(sk, chain_hash)

Verification:
  Recompute chain_hash, verify signature with public key.
"""
import json
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey
)
from cryptography.hazmat.primitives.serialization import (
    Encoding, PublicFormat, PrivateFormat, NoEncryption,
    load_pem_private_key, load_pem_public_key
)
from cryptography.exceptions import InvalidSignature
from models import Alert, EvidenceRecord
from config import KEYS_DIR

GENESIS_HASH = "0" * 64


def _load_or_generate_keypair() -> tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    keys_path = Path(KEYS_DIR)
    keys_path.mkdir(parents=True, exist_ok=True)
    sk_path = keys_path / "signing_key.pem"
    pk_path = keys_path / "verify_key.pem"

    if sk_path.exists() and pk_path.exists():
        with open(sk_path, "rb") as f:
            sk = load_pem_private_key(f.read(), password=None)
        with open(pk_path, "rb") as f:
            pk = load_pem_public_key(f.read())
        return sk, pk

    sk = Ed25519PrivateKey.generate()
    pk = sk.public_key()

    with open(sk_path, "wb") as f:
        f.write(sk.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()))
    with open(pk_path, "wb") as f:
        f.write(pk.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo))

    return sk, pk


_sk, _pk = _load_or_generate_keypair()
_pk_pem: str = _pk.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo).decode()


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canonical_json(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def build_evidence_bundle(
    alert: Alert,
    prev_hash: str,
    sequence: int
) -> EvidenceRecord:
    now_str = datetime.now(timezone.utc).isoformat()
    alert_dict = alert.model_dump()

    content_hash = _sha256(_canonical_json(alert_dict))
    chain_input = f"{prev_hash}|{content_hash}|{now_str}".encode()
    chain_hash = _sha256(chain_input)

    sig_bytes = _sk.sign(chain_hash.encode())
    sig_hex = sig_bytes.hex()

    return EvidenceRecord(
        version="1.0",
        created_at=now_str,
        content_hash=content_hash,
        signature_hex=sig_hex,
        public_key_pem=_pk_pem,
        chain_context={
            "sequence": sequence,
            "prev_hash": prev_hash,
            "this_hash": chain_hash,
        },
        alert=alert_dict,
        verified=True,
    )


def verify_bundle(bundle: dict) -> tuple[bool, str]:
    """Recompute hash and verify Ed25519 signature. Returns (ok, reason)."""
    try:
        alert_dict = bundle["alert"]
        content_hash = _sha256(_canonical_json(alert_dict))
        if content_hash != bundle["content_hash"]:
            return False, "content_hash_mismatch"

        chain_ctx = bundle["chain_context"]
        chain_input = f"{chain_ctx['prev_hash']}|{content_hash}|{bundle['created_at']}".encode()
        expected_chain_hash = _sha256(chain_input)
        if expected_chain_hash != chain_ctx["this_hash"]:
            return False, "chain_hash_mismatch"

        sig_bytes = bytes.fromhex(bundle["signature_hex"])
        pk = load_pem_public_key(bundle["public_key_pem"].encode())
        pk.verify(sig_bytes, chain_ctx["this_hash"].encode())

        return True, "ok"
    except InvalidSignature:
        return False, "invalid_signature"
    except Exception as e:
        return False, f"error: {e}"


def get_public_key_pem() -> str:
    return _pk_pem
