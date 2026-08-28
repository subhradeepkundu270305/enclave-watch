"""Port Scan Detection — Connection rate + unique-port threshold.

Formula: R_c = N_connections / W
Alert when unique_dst_ports > N AND connection_rate > R in window W.
"""
from detectors.base import BaseDetector
from models import FeatureVector
from config import PORT_SCAN_UNIQUE_PORTS, PORT_SCAN_RATE


class PortScanDetector(BaseDetector):
    name = "port_scan"
    description = "Detects port scanning via unique destination port count and connection rate thresholds"
    algorithm = "Unique Port Count + Connection Rate Threshold"

    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        unique_ports = features.unique_dst_ports
        rate = features.connection_rate

        port_excess = max(0.0, (unique_ports - PORT_SCAN_UNIQUE_PORTS) / PORT_SCAN_UNIQUE_PORTS)
        rate_excess = max(0.0, (rate - PORT_SCAN_RATE) / PORT_SCAN_RATE)

        # Both conditions must be triggered
        if unique_ports < PORT_SCAN_UNIQUE_PORTS or rate < PORT_SCAN_RATE:
            prob = 0.0
        else:
            prob = min(1.0, (port_excess + rate_excess) / 2.0)

        return prob, {
            "unique_dst_ports": unique_ports,
            "port_threshold": PORT_SCAN_UNIQUE_PORTS,
            "connection_rate": round(rate, 4),
            "rate_threshold": PORT_SCAN_RATE,
            "port_excess_ratio": round(port_excess, 4),
            "rate_excess_ratio": round(rate_excess, 4),
            "recent_ports_sample": list(set(features.recent_dst_ports))[:20],
        }
