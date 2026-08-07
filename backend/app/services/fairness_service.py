from typing import Dict, Any
from ml_engine.fairness import fairness_engine

class FairnessAuditService:
    """
    Service wrapper for executing regulatory fairness and demographic parity audits.
    """
    def run_compliance_audit(self) -> Dict[str, Any]:
        result = fairness_engine.generate_institutional_audit()
        return result

fairness_service = FairnessAuditService()
