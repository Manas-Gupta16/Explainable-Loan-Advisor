import os
from typing import Dict, Any, Optional
from ml_engine.causal_recourse import CausalRecourseEngine, StructuralCausalModel
from backend.app.services.ml_service import ml_service

class CausalService:
    """
    Singleton service wrapper for the Causal DAG Recourse Trajectory Engine.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CausalService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.engine = CausalRecourseEngine(
            model=ml_service.model,
            preprocessor=ml_service.preprocessor
        )

    def generate_causal_trajectory(
        self,
        input_dict: Dict[str, Any],
        target_probability: float = 0.75,
        max_horizon_days: int = 90
    ) -> Dict[str, Any]:
        """Generates 3-phase temporal recourse trajectory along the Structural Causal DAG."""
        return self.engine.solve_phased_trajectory(
            baseline_state=input_dict,
            target_probability=target_probability,
            max_horizon_days=max_horizon_days
        )

    def get_causal_graph(self) -> Dict[str, Any]:
        """Returns structural nodes, causal mechanism edges, and temporal lag parameters."""
        return StructuralCausalModel.CAUSAL_GRAPH

causal_service = CausalService()
