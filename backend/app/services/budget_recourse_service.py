import os
from typing import Dict, Any, List, Optional
from ml_engine.budget_recourse import BudgetConstrainedRecourseOptimizer
from backend.app.services.ml_service import ml_service

class BudgetRecourseService:
    """
    Singleton service wrapper for Budget-Constrained Recourse Optimization (AFRO).
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BudgetRecourseService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.optimizer = BudgetConstrainedRecourseOptimizer(
            model=ml_service.model,
            preprocessor=ml_service.preprocessor
        )

    def optimize_recourse(
        self,
        input_dict: Dict[str, Any],
        target_probability: float = 0.75,
        horizon_months: int = 6,
        monthly_living_expenses: Optional[float] = None,
        max_surplus_allocation_pct: float = 0.60
    ) -> Dict[str, Any]:
        """Runs SLSQP constrained mathematical optimizer on applicant cashflow and debt parameters."""
        return self.optimizer.optimize_recourse(
            baseline_state=input_dict,
            target_probability=target_probability,
            horizon_months=horizon_months,
            monthly_living_expenses=monthly_living_expenses,
            max_surplus_allocation_pct=max_surplus_allocation_pct
        )

    def get_budget_frontier(
        self,
        input_dict: Dict[str, Any],
        horizon_months: int = 6
    ) -> List[Dict[str, Any]]:
        """Computes Pareto budget tradeoff curve across monthly allocation commitments."""
        return self.optimizer.compute_budget_frontier(
            baseline_state=input_dict,
            horizon_months=horizon_months
        )

budget_recourse_service = BudgetRecourseService()
