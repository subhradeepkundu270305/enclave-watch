"""Base detector interface."""
from abc import ABC, abstractmethod
from models import FeatureVector


class BaseDetector(ABC):
    name: str = "base"
    description: str = ""
    algorithm: str = ""

    @abstractmethod
    def detect(self, features: FeatureVector) -> tuple[float, dict]:
        """Return (probability 0..1, evidence_dict)."""
        ...

    def reset_state(self, src_ip: str) -> None:
        """Optional: reset per-IP state (called on IP eviction)."""
        pass
