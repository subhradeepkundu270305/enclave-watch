"""Synthetic traffic generator — simulates TAP/SPAN/diode input.

All generators are async; they yield NetworkEvent objects.
NO outbound network calls are made — all data is fabricated in-process.
"""
import asyncio
import random
import math
import string
import time
from typing import AsyncGenerator
from models import NetworkEvent, TLSMetadata


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _rand_ip(prefix: str = "") -> str:
    if prefix:
        parts = prefix.split(".")
        while len(parts) < 4:
            parts.append(str(random.randint(1, 254)))
        return ".".join(parts[:4])
    return f"{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _rand_private_ip() -> str:
    return f"192.168.{random.randint(1, 10)}.{random.randint(2, 254)}"


COMMON_PORTS = [80, 443, 22, 53, 8080, 8443, 3306, 5432, 6379, 25, 587, 21]
C2_TARGETS = ["45.76.12.88", "185.220.101.34", "94.102.49.190", "91.108.4.1"]
NORMAL_DOMAINS = [
    "update.microsoft.com", "ocsp.digicert.com", "clients.google.com",
    "api.github.com", "connectivity-check.ubuntu.com"
]

_HIGH_ENTROPY_CHARS = string.ascii_lowercase + string.digits


def _rand_high_entropy_subdomain(length: int = None) -> str:
    n = length or random.randint(32, 52)
    return "".join(random.choices(_HIGH_ENTROPY_CHARS, k=n))


def _rand_normal_subdomain() -> str:
    words = ["mail", "api", "cdn", "static", "update", "services", "auth", "login"]
    return random.choice(words)


_SUSPICIOUS_JA3 = [
    "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0",
    "771,4865-4866-4867-49195-49199,0-23-65281-10-11-35-16-5,29-23-24,0",
    "769,0-4-5-10-9-100-98-3-6-19-18-99,10-11,23-24-25,0"
]

_NORMAL_JA3 = [
    "771,4865-4866-4867-49195-49199-49196-49200-52393-52392,0-23-65281-10-11-35-16-5-13-51-45-43-21,29-23-24,0",
    "771,49195-49199-52393-52392-49196-49200-49162-49161-49171-49172,0-23-65281-10-11,23-24-25,0"
]


def _make_tls(suspicious: bool = False) -> TLSMetadata:
    if suspicious:
        ja3 = random.choice(_SUSPICIOUS_JA3)
        return TLSMetadata(
            ja3_hash=ja3,
            cipher_suite="TLS_RSA_WITH_RC4_128_MD5",
            tls_version="TLSv1.0",
            self_signed=True,
            extensions=["0", "10"],
            curves=["23"]
        )
    ja3 = random.choice(_NORMAL_JA3)
    return TLSMetadata(
        ja3_hash=ja3,
        cipher_suite="TLS_AES_256_GCM_SHA384",
        tls_version="TLSv1.3",
        self_signed=False,
        extensions=["0", "23", "65281", "10", "11", "35", "16", "5", "13"],
        curves=["29", "23", "24"]
    )


# ─── Individual generators ────────────────────────────────────────────────────

def gen_normal_event() -> NetworkEvent:
    src = _rand_private_ip()
    port = random.choice(COMMON_PORTS)
    is_tls = port in (443, 8443)
    is_dns = port == 53
    return NetworkEvent(
        src_ip=src,
        dst_ip=_rand_ip("8.8."),
        dst_port=port,
        protocol="UDP" if is_dns else "TCP",
        bytes_out=random.randint(200, 4000),
        bytes_in=random.randint(500, 20000),
        duration=round(random.uniform(0.01, 2.0), 3),
        dns_query=f"{_rand_normal_subdomain()}.{random.choice(['google.com','microsoft.com','github.com'])}" if is_dns else None,
        tls_metadata=_make_tls(False) if is_tls else None,
        attack_type="normal"
    )


def gen_ddos_event(target_ip: str = "10.0.0.1") -> NetworkEvent:
    return NetworkEvent(
        src_ip=_rand_ip(),  # spoofed / varied sources
        dst_ip=target_ip,
        dst_port=random.choice([80, 443]),
        protocol="TCP",
        bytes_out=random.randint(40, 120),   # small SYN packets
        bytes_in=0,
        duration=0.0,
        attack_type="ddos"
    )


def gen_c2_beacon_event(src_ip: str = None) -> NetworkEvent:
    src = src_ip or _rand_private_ip()
    return NetworkEvent(
        src_ip=src,
        dst_ip=random.choice(C2_TARGETS),
        dst_port=random.choice([443, 8080, 4444]),
        protocol="TCP",
        bytes_out=random.randint(200, 800),
        bytes_in=random.randint(100, 600),
        duration=round(random.uniform(0.1, 0.8), 3),
        tls_metadata=_make_tls(True),
        attack_type="c2_beacon"
    )


def gen_dns_tunnel_event(src_ip: str = None) -> NetworkEvent:
    src = src_ip or _rand_private_ip()
    subdomain = _rand_high_entropy_subdomain()
    domain = random.choice(["tunnel.attacker.xyz", "exfil.badactor.net", "c2dns.evil.org"])
    return NetworkEvent(
        src_ip=src,
        dst_ip="8.8.8.8",
        dst_port=53,
        protocol="UDP",
        bytes_out=random.randint(180, 512),
        bytes_in=random.randint(100, 300),
        duration=round(random.uniform(0.01, 0.1), 4),
        dns_query=f"{subdomain}.{domain}",
        attack_type="dns_tunnel"
    )


def gen_encrypted_malware_event(src_ip: str = None) -> NetworkEvent:
    src = src_ip or _rand_private_ip()
    return NetworkEvent(
        src_ip=src,
        dst_ip=_rand_ip(),
        dst_port=443,
        protocol="TCP",
        bytes_out=random.randint(1000, 8000),
        bytes_in=random.randint(500, 4000),
        duration=round(random.uniform(1.0, 15.0), 3),
        tls_metadata=_make_tls(True),
        attack_type="encrypted_malware"
    )


def gen_port_scan_event(src_ip: str = None, port: int = None) -> NetworkEvent:
    src = src_ip or _rand_private_ip()
    return NetworkEvent(
        src_ip=src,
        dst_ip=_rand_ip("10.0.1."),
        dst_port=port or random.randint(1, 65535),
        protocol=random.choice(["TCP", "UDP"]),
        bytes_out=random.randint(40, 80),
        bytes_in=random.randint(0, 60),
        duration=round(random.uniform(0.001, 0.05), 4),
        attack_type="port_scan"
    )


def gen_data_exfil_event(src_ip: str = None) -> NetworkEvent:
    src = src_ip or _rand_private_ip()
    return NetworkEvent(
        src_ip=src,
        dst_ip=_rand_ip(),
        dst_port=random.choice([443, 21, 22, 2049]),
        protocol="TCP",
        bytes_out=random.randint(500_000, 10_000_000),  # massive outbound
        bytes_in=random.randint(100, 1000),
        duration=round(random.uniform(5.0, 60.0), 2),
        tls_metadata=_make_tls(False),
        attack_type="data_exfil"
    )


# ─── Burst generators (for Demo Mode) ────────────────────────────────────────

async def burst_attack(attack_type: str, count: int = 20) -> list[NetworkEvent]:
    """Generate a burst of events for a given attack type (for /demo/generate)."""
    generators = {
        "normal":             gen_normal_event,
        "ddos":               gen_ddos_event,
        "c2_beacon":          gen_c2_beacon_event,
        "dns_tunnel":         gen_dns_tunnel_event,
        "encrypted_malware":  gen_encrypted_malware_event,
        "port_scan":          lambda: gen_port_scan_event(port=random.randint(1, 65535)),
        "data_exfil":         gen_data_exfil_event,
    }
    gen_fn = generators.get(attack_type, gen_normal_event)
    # Port scan: use the same src IP scanning sequential ports
    if attack_type == "port_scan":
        src = _rand_private_ip()
        return [gen_port_scan_event(src_ip=src, port=i) for i in range(1, count + 1)]
    # C2 beacon: same src IP
    if attack_type == "c2_beacon":
        src = _rand_private_ip()
        return [gen_c2_beacon_event(src_ip=src) for _ in range(count)]
    return [gen_fn() for _ in range(count)]


# ─── Continuous mixed stream ───────────────────────────────────────────────────

async def continuous_stream(
    queue,
    normal_ratio: float = 0.6,
    interval: float = 0.2
) -> None:
    """Continuously generates mixed traffic and puts events into queue."""
    attack_fns = [
        gen_ddos_event,
        gen_c2_beacon_event,
        gen_dns_tunnel_event,
        gen_encrypted_malware_event,
        lambda: gen_port_scan_event(port=random.randint(1, 65535)),
        gen_data_exfil_event,
    ]
    # Persistent state for realistic patterns
    beacon_ip = _rand_private_ip()
    scan_ip = _rand_private_ip()
    exfil_ip = _rand_private_ip()
    scan_port = 1

    while True:
        r = random.random()
        if r < normal_ratio:
            event = gen_normal_event()
        elif r < normal_ratio + 0.07:
            event = gen_ddos_event()
        elif r < normal_ratio + 0.14:
            event = gen_c2_beacon_event(src_ip=beacon_ip)
        elif r < normal_ratio + 0.21:
            event = gen_dns_tunnel_event()
        elif r < normal_ratio + 0.28:
            event = gen_encrypted_malware_event()
        elif r < normal_ratio + 0.35:
            event = gen_port_scan_event(src_ip=scan_ip, port=scan_port)
            scan_port = (scan_port % 1024) + 1
        else:
            event = gen_data_exfil_event(src_ip=exfil_ip)

        await queue.put(event)
        await asyncio.sleep(interval)
