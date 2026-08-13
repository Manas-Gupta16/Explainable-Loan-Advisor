import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from scipy.optimize import minimize
from ml_engine.causal_recourse import StructuralCausalModel

class BudgetConstrainedRecourseOptimizer:
    """
    Mathematical Optimization Engine for Affordable & Feasible Recourse (AFRO).
    Formulates counterfactual search as a constrained nonlinear optimization problem (SLSQP),
    strictly enforcing monthly disposable cashflow budget constraints and actionable feature bounds.
    """

    def __init__(self, model, preprocessor):
        self.model = model
        self.preprocessor = preprocessor

    def predict_probability(self, state_dict: Dict[str, Any]) -> float:
        """Evaluates ML model approval probability for a given financial feature vector."""
        X_df = self.preprocessor.transform_single(state_dict)
        return float(self.model.predict_proba(X_df)[0][1])

    def calculate_cashflow_profile(
        self,
        applicant_income: float,
        coapplicant_income: float,
        existing_debts: float,
        monthly_living_expenses: Optional[float] = None
    ) -> Dict[str, float]:
        """
        Computes granular monthly cashflow surplus, fixed debt service, and max affordable budget.
        """
        gross_annual = max(applicant_income + coapplicant_income, 1000.0)
        gross_monthly = gross_annual / 12.0

        # Estimated monthly tax & statutory deduction (~20%)
        net_monthly_income = gross_monthly * 0.80

        # Monthly debt service obligations (~3.5% of total debt balance)
        monthly_debt_service = existing_debts * 0.035

        # Monthly living expenses (if not provided, estimated as ~45% of net monthly income)
        if monthly_living_expenses is None or monthly_living_expenses <= 0:
            living_exp = net_monthly_income * 0.45
        else:
            living_exp = float(monthly_living_expenses)

        # Monthly disposable surplus = Net Income - Living Expenses - Existing Debt Service
        disposable_surplus = max(net_monthly_income - living_exp - monthly_debt_service, 0.0)

        # Max safe monthly budget allocated to debt reduction (capped at 65% of disposable surplus)
        safe_monthly_budget = disposable_surplus * 0.65

        return {
            "gross_monthly_income": round(gross_monthly, 2),
            "net_monthly_income": round(net_monthly_income, 2),
            "monthly_debt_service": round(monthly_debt_service, 2),
            "monthly_living_expenses": round(living_exp, 2),
            "monthly_disposable_surplus": round(disposable_surplus, 2),
            "safe_monthly_allocation_cap": round(safe_monthly_budget, 2)
        }

    def optimize_recourse(
        self,
        baseline_state: Dict[str, Any],
        target_probability: float = 0.75,
        horizon_months: int = 6,
        monthly_living_expenses: Optional[float] = None,
        max_surplus_allocation_pct: float = 0.60
    ) -> Dict[str, Any]:
        """
        Solves the constrained optimization problem via Sequential Least Squares Quadratic Programming (SLSQP).
        """
        baseline_prob = round(self.predict_probability(baseline_state), 4)
        
        # If already meeting target probability
        if baseline_prob >= target_probability:
            return {
                "status": "ALREADY_SATISFIED",
                "baseline_probability": baseline_prob,
                "target_probability": target_probability,
                "optimized_probability": baseline_prob,
                "feasibility_index": 100.0,
                "cashflow_profile": self.calculate_cashflow_profile(
                    baseline_state.get("applicant_income", 50000),
                    baseline_state.get("coapplicant_income", 0),
                    baseline_state.get("existing_debts", 10000),
                    monthly_living_expenses
                ),
                "interventions": {},
                "summary": "Applicant profile already exceeds the target approval threshold without modification."
            }

        # Extract baseline parameters
        app_inc = float(baseline_state.get("applicant_income", 50000.0))
        co_inc = float(baseline_state.get("coapplicant_income", 0.0))
        cur_debt = float(baseline_state.get("existing_debts", 10000.0))
        cur_loan = float(baseline_state.get("loan_amount", 25000.0))
        cur_tenure = int(baseline_state.get("loan_tenure_months", 36))

        cashflow = self.calculate_cashflow_profile(app_inc, co_inc, cur_debt, monthly_living_expenses)
        monthly_surplus = cashflow["monthly_disposable_surplus"]
        
        # Total cumulative budget available over the horizon
        effective_alloc_pct = np.clip(max_surplus_allocation_pct, 0.10, 0.85)
        cumulative_budget_cap = max(monthly_surplus * effective_alloc_pct * horizon_months, 500.0)

        # Memoization cache for probability evaluation
        eval_cache: Dict[Tuple[float, float, int], float] = {}

        def get_eval_prob(d_debt_val: float, d_loan_val: float, d_tenure_val: int) -> float:
            key = (round(d_debt_val, -1), round(d_loan_val, -1), int(d_tenure_val))
            if key not in eval_cache:
                temp_interventions = {
                    "existing_debts": max(cur_debt - key[0], 0.0),
                    "loan_amount": max(cur_loan - key[1], 1000.0),
                    "loan_tenure_months": int(min(cur_tenure + key[2], 84))
                }
                sim_state = StructuralCausalModel.propagate_causal_state(
                    baseline_state=baseline_state,
                    interventions=temp_interventions,
                    elapsed_days=horizon_months * 30
                )
                eval_cache[key] = self.predict_probability(sim_state)
            return eval_cache[key]

        # Objective Function
        def objective(x):
            d_debt, d_loan, d_tenure = x[0], x[1], x[2]
            cost_debt = (d_debt / max(cumulative_budget_cap, 1.0)) ** 2
            cost_loan = (d_loan / max(cur_loan, 1.0)) ** 2
            cost_tenure = (d_tenure / max(cur_tenure, 12.0)) ** 2
            
            prob = get_eval_prob(d_debt, d_loan, int(d_tenure))
            prob_penalty = 10.0 * max(target_probability - prob, 0.0) ** 2
            return 1.5 * cost_debt + 1.0 * cost_loan + 0.5 * cost_tenure + prob_penalty

        # Hard Constraints
        def budget_constraint(x):
            return cumulative_budget_cap - x[0]

        def prob_constraint(x):
            prob = get_eval_prob(x[0], x[1], int(x[2]))
            return prob - (target_probability - 0.03)

        constraints = [
            {'type': 'ineq', 'fun': budget_constraint},
            {'type': 'ineq', 'fun': prob_constraint}
        ]

        # Bounds on variables
        max_debt_payoff = min(cur_debt, cumulative_budget_cap)
        max_loan_downsize = cur_loan * 0.35
        max_tenure_add = max(min(72 - cur_tenure, 36), 0)

        bounds = [
            (0.0, max_debt_payoff),
            (0.0, max_loan_downsize),
            (0.0, max_tenure_add)
        ]

        # Initial Guess
        x0 = [min(max_debt_payoff * 0.5, 2000.0), 0.0, 12.0 if max_tenure_add >= 12 else 0.0]

        # Execute SLSQP Optimization with optimal iteration bounds
        res = minimize(
            fun=objective,
            x0=x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 30, 'ftol': 1e-3, 'disp': False}
        )

        opt_d_debt = float(np.clip(res.x[0], 0.0, max_debt_payoff))
        opt_d_loan = float(np.clip(res.x[1], 0.0, max_loan_downsize))
        opt_d_tenure = int(np.clip(res.x[2], 0, max_tenure_add))

        # Evaluate final optimized state
        final_interventions = {
            "existing_debts": round(max(cur_debt - opt_d_debt, 0.0), 2),
            "loan_amount": round(max(cur_loan - opt_d_loan, 1000.0), 2),
            "loan_tenure_months": cur_tenure + opt_d_tenure
        }

        final_state = StructuralCausalModel.propagate_causal_state(
            baseline_state=baseline_state,
            interventions=final_interventions,
            elapsed_days=horizon_months * 30
        )
        final_prob = round(self.predict_probability(final_state), 4)

        # Monthly Required Payment Calculation
        monthly_required_debt_payment = round(opt_d_debt / max(horizon_months, 1), 2)
        monthly_burden_pct = round((monthly_required_debt_payment / max(monthly_surplus, 1.0)) * 100, 1)

        # Feasibility Index (0 to 100)
        feasibility_index = float(np.clip(100.0 - (monthly_burden_pct * 0.8) + (final_prob * 20.0), 10.0, 100.0))

        return {
            "status": "OPTIMAL_RECOURSE_FOUND" if final_prob >= (target_probability - 0.04) else "SUB_OPTIMAL_BUDGET_CONSTRAINED",
            "baseline_probability": baseline_prob,
            "target_probability": target_probability,
            "optimized_probability": final_prob,
            "probability_gain": round(final_prob - baseline_prob, 4),
            "feasibility_index": round(feasibility_index, 1),
            "horizon_months": horizon_months,
            "budget_constraints": {
                "cumulative_budget_cap": round(cumulative_budget_cap, 2),
                "monthly_disposable_surplus": round(monthly_surplus, 2),
                "monthly_required_allocation": monthly_required_debt_payment,
                "surplus_utilization_pct": monthly_burden_pct
            },
            "optimized_actions": {
                "debt_payoff_total": round(opt_d_debt, 2),
                "target_debt_balance": final_interventions["existing_debts"],
                "loan_downsize_amount": round(opt_d_loan, 2),
                "target_loan_amount": final_interventions["loan_amount"],
                "tenure_extension_months": opt_d_tenure,
                "target_tenure_months": final_interventions["loan_tenure_months"]
            },
            "endogenous_state_trajectory": {
                "projected_cibil_score": final_state["cibil_score"],
                "cibil_gain": final_state["cibil_score"] - baseline_state.get("cibil_score", 650),
                "projected_dti_ratio": f"{(final_state['dti_ratio'] * 100):.1f}%",
                "projected_utilization": f"{(final_state['credit_card_utilization'] * 100):.1f}%"
            },
            "cashflow_profile": cashflow
        }

    def compute_budget_frontier(
        self,
        baseline_state: Dict[str, Any],
        horizon_months: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Computes the Pareto Budget Frontier tradeoff curve across allocation scales.
        """
        app_inc = float(baseline_state.get("applicant_income", 50000.0))
        co_inc = float(baseline_state.get("coapplicant_income", 0.0))
        cur_debt = float(baseline_state.get("existing_debts", 10000.0))
        
        cashflow = self.calculate_cashflow_profile(app_inc, co_inc, cur_debt)
        max_surplus = max(cashflow["monthly_disposable_surplus"], 500.0)

        allocation_steps = [0.20, 0.40, 0.60, 0.80]
        frontier = []

        for step in allocation_steps:
            m_budget = round(max_surplus * step, 2)
            res = self.optimize_recourse(
                baseline_state=baseline_state,
                target_probability=0.75,
                horizon_months=horizon_months,
                max_surplus_allocation_pct=step
            )
            frontier.append({
                "allocation_pct": f"{int(step * 100)}%",
                "monthly_commitment": m_budget,
                "cumulative_cost": round(m_budget * horizon_months, 2),
                "achievable_probability": res["optimized_probability"],
                "projected_cibil": res["endogenous_state_trajectory"]["projected_cibil_score"],
                "feasibility_score": res["feasibility_index"]
            })

        return frontier
