import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional

class StructuralCausalModel:
    """
    Structural Causal Model (SCM) defining causal mechanisms, endogenous feature propagation,
    and temporal delay dynamics for credit risk recourse.
    """

    # Definition of Causal Graph Edges and Mechanism Types
    CAUSAL_GRAPH = {
        "nodes": [
            {"id": "existing_debts", "name": "Existing Debt Obligations", "type": "ACTIONABLE_EXOGENOUS", "unit": "$"},
            {"id": "coapplicant_income", "name": "Co-Applicant Income", "type": "ACTIONABLE_EXOGENOUS", "unit": "$"},
            {"id": "loan_amount", "name": "Requested Loan Principal", "type": "ACTIONABLE_EXOGENOUS", "unit": "$"},
            {"id": "loan_tenure_months", "name": "Loan Repayment Tenure", "type": "ACTIONABLE_EXOGENOUS", "unit": "months"},
            {"id": "credit_card_utilization", "name": "Revolving Credit Utilization", "type": "ENDOGENOUS_IMMEDIATE", "unit": "%"},
            {"id": "dti_ratio", "name": "Debt-to-Income (DTI) Ratio", "type": "ENDOGENOUS_IMMEDIATE", "unit": "%"},
            {"id": "loan_to_income_ratio", "name": "Loan-to-Income Ratio", "type": "ENDOGENOUS_IMMEDIATE", "unit": "x"},
            {"id": "cibil_score", "name": "CIBIL Bureau Credit Score", "type": "ENDOGENOUS_LAGGED", "unit": "points"},
            {"id": "approval_probability", "name": "Predicted Approval Probability", "type": "TARGET_OUTCOME", "unit": "%"}
        ],
        "edges": [
            {"source": "existing_debts", "target": "credit_card_utilization", "mechanism": "Direct Balance Reduction", "lag_days": 0},
            {"source": "existing_debts", "target": "dti_ratio", "mechanism": "Monthly Liability Amortization", "lag_days": 0},
            {"source": "coapplicant_income", "target": "dti_ratio", "mechanism": "Household Income Expansion", "lag_days": 0},
            {"source": "coapplicant_income", "target": "loan_to_income_ratio", "mechanism": "Household Income Expansion", "lag_days": 0},
            {"source": "loan_amount", "target": "loan_to_income_ratio", "mechanism": "Principal Scaling", "lag_days": 0},
            {"source": "credit_card_utilization", "target": "cibil_score", "mechanism": "Bureau Scoring Cycle Lag", "lag_days": 45},
            {"source": "cibil_score", "target": "approval_probability", "mechanism": "ML Risk Model Weight", "lag_days": 0},
            {"source": "dti_ratio", "target": "approval_probability", "mechanism": "ML Risk Model Weight", "lag_days": 0},
            {"source": "loan_to_income_ratio", "target": "approval_probability", "mechanism": "ML Risk Model Weight", "lag_days": 0},
            {"source": "credit_card_utilization", "target": "approval_probability", "mechanism": "ML Risk Model Weight", "lag_days": 0}
        ]
    }

    @staticmethod
    def propagate_causal_state(
        baseline_state: Dict[str, Any],
        interventions: Dict[str, float],
        elapsed_days: int = 0
    ) -> Dict[str, Any]:
        """
        Propagates exogenous interventions through structural equations to compute
        intermediate and final endogenous feature states at a given time horizon.
        """
        state = dict(baseline_state)

        # 1. Apply Direct Exogenous Interventions
        applicant_income = float(state.get("applicant_income", 50000.0))
        coapplicant_income = float(state.get("coapplicant_income", 0.0))
        if "coapplicant_income" in interventions:
            coapplicant_income = float(interventions["coapplicant_income"])
            state["coapplicant_income"] = coapplicant_income

        total_household_income = max(applicant_income + coapplicant_income, 1.0)
        monthly_household_income = total_household_income / 12.0

        existing_debts = float(state.get("existing_debts", 10000.0))
        if "existing_debts" in interventions:
            existing_debts = max(float(interventions["existing_debts"]), 0.0)
            state["existing_debts"] = existing_debts

        loan_amount = float(state.get("loan_amount", 25000.0))
        if "loan_amount" in interventions:
            loan_amount = max(float(interventions["loan_amount"]), 1000.0)
            state["loan_amount"] = loan_amount

        loan_tenure_months = int(state.get("loan_tenure_months", 36))
        if "loan_tenure_months" in interventions:
            loan_tenure_months = max(int(interventions["loan_tenure_months"]), 12)
            state["loan_tenure_months"] = loan_tenure_months

        # 2. Immediate Endogenous Propagation (Lag = 0 days)
        # Structural Equation for DTI:
        estimated_monthly_debt = existing_debts * 0.04  # ~4% monthly debt service
        dti_ratio = min(estimated_monthly_debt / max(monthly_household_income, 1.0), 1.5)
        state["dti_ratio"] = round(dti_ratio, 4)

        # Structural Equation for Loan-to-Income:
        loan_to_income = loan_amount / total_household_income
        state["loan_to_income"] = round(loan_to_income, 4)

        # Structural Equation for Credit Utilization:
        # If debt decreased, utilization drops proportionally relative to assumed credit limit
        base_debts = max(float(baseline_state.get("existing_debts", existing_debts)), 1000.0)
        base_util = float(baseline_state.get("credit_card_utilization", 0.50))
        implied_credit_limit = max(base_debts / max(base_util, 0.05), 5000.0)
        current_util = np.clip(existing_debts / implied_credit_limit, 0.05, 1.0)
        state["credit_card_utilization"] = round(float(current_util), 4)

        # 3. Lagged Endogenous Propagation (CIBIL Score Trajectory over elapsed_days)
        base_cibil = int(baseline_state.get("cibil_score", 650))
        util_reduction = max(base_util - current_util, 0.0)
        
        # CIBIL gain from utilization drop (max ~65 pts gain from 80% -> 15% util)
        util_cibil_boost = util_reduction * 85.0
        
        # CIBIL gain from consecutive on-time monthly payments (+4-6 pts per 30-day cycle)
        months_elapsed = elapsed_days / 30.0
        on_time_cibil_boost = months_elapsed * 5.5
        
        # Temporal S-curve lag factor: CIBIL updates reflect with 30-45 day bureau lag
        lag_weight = 1.0 / (1.0 + np.exp(-(elapsed_days - 35) / 10.0)) if elapsed_days > 0 else 0.0
        cibil_gain = (util_cibil_boost * lag_weight) + on_time_cibil_boost
        
        simulated_cibil = int(np.clip(base_cibil + cibil_gain, 300, 850))
        state["cibil_score"] = simulated_cibil

        return state


class CausalRecourseEngine:
    """
    Computes time-sequenced, causally realistic recourse trajectories
    along the Structural Causal DAG to guarantee actionable feasibility.
    """

    def __init__(self, model, preprocessor):
        self.model = model
        self.preprocessor = preprocessor

    def predict_state_probability(self, state: Dict[str, Any]) -> float:
        """Evaluates ML model approval probability for a given causal state vector."""
        X_df = self.preprocessor.transform_single(state)
        prob = float(self.model.predict_proba(X_df)[0][1])
        return round(prob, 4)

    def compute_causal_sensitivity(self, baseline_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Computes Total Causal Effect (TCE) for each actionable exogenous feature lever.
        Evaluates both direct and indirect structural DAG downstream effects on approval probability.
        """
        baseline_prob = self.predict_state_probability(baseline_state)
        levers = [
            {
                "lever_id": "debt_paydown",
                "name": "Debt Balance Reduction",
                "action": "Pay down existing revolving/unsecured debt balance",
                "test_intervention": {"existing_debts": max(float(baseline_state.get("existing_debts", 10000)) * 0.5, 0.0)},
                "cost_unit": "$",
                "feasibility": "HIGH"
            },
            {
                "lever_id": "coapplicant_addition",
                "name": "Add Earning Co-Applicant",
                "action": "Introduce co-applicant / household income guarantor",
                "test_intervention": {"coapplicant_income": max(float(baseline_state.get("coapplicant_income", 0)) + 25000.0, 25000.0)},
                "cost_unit": "$/yr",
                "feasibility": "VERY_HIGH"
            },
            {
                "lever_id": "tenure_extension",
                "name": "Extend Loan Tenure",
                "action": "Extend repayment tenure to lower monthly installment burden",
                "test_intervention": {"loan_tenure_months": min(int(baseline_state.get("loan_tenure_months", 36)) + 24, 84)},
                "cost_unit": "months",
                "feasibility": "IMMEDIATE"
            },
            {
                "lever_id": "principal_downsizing",
                "name": "Loan Amount Downsizing",
                "action": "Reduce requested loan principal amount by 20%",
                "test_intervention": {"loan_amount": max(float(baseline_state.get("loan_amount", 30000)) * 0.8, 2000.0)},
                "cost_unit": "$",
                "feasibility": "IMMEDIATE"
            }
        ]

        results = []
        for lever in levers:
            intervened_state = StructuralCausalModel.propagate_causal_state(
                baseline_state=baseline_state,
                interventions=lever["test_intervention"],
                elapsed_days=60  # Evaluate at 60-day horizon
            )
            intervened_prob = self.predict_state_probability(intervened_state)
            delta_prob = round(intervened_prob - baseline_prob, 4)
            cibil_delta = intervened_state["cibil_score"] - baseline_state.get("cibil_score", 650)
            dti_delta = round(intervened_state["dti_ratio"] - baseline_state.get("dti_ratio", 0.4), 4)

            results.append({
                "lever_id": lever["lever_id"],
                "name": lever["name"],
                "action": lever["action"],
                "feasibility": lever["feasibility"],
                "marginal_prob_gain": delta_prob,
                "projected_cibil_boost": cibil_delta,
                "projected_dti_reduction_pct": round(abs(dti_delta) * 100, 1),
                "resulting_probability": intervened_prob
            })

        # Rank levers by Total Causal Gain
        results.sort(key=lambda x: x["marginal_prob_gain"], reverse=True)
        return results

    def solve_phased_trajectory(
        self,
        baseline_state: Dict[str, Any],
        target_probability: float = 0.75,
        max_horizon_days: int = 90
    ) -> Dict[str, Any]:
        """
        Constructs a realistic 3-Phase Actionable Recourse Trajectory:
        - Phase 1 (Day 0 - Immediate Actions): Direct interventions executed by the borrower.
        - Phase 2 (Day 30-45 - Structural Propagation): Debt drops, utilization relaxes.
        - Phase 3 (Day 60-90 - Target Bureau Horizon): CIBIL score catches up, approval unlocked.
        """
        baseline_prob = self.predict_state_probability(baseline_state)
        
        # If already approved, return maintenance path
        if baseline_prob >= target_probability:
            return {
                "initial_status": "APPROVED",
                "baseline_probability": baseline_prob,
                "target_probability": target_probability,
                "is_recourse_needed": False,
                "summary": "Current financial profile already satisfies prime underwriting risk thresholds.",
                "phases": []
            }

        # Determine optimal intervention bundle
        current_debt = float(baseline_state.get("existing_debts", 10000.0))
        current_loan = float(baseline_state.get("loan_amount", 25000.0))
        current_tenure = int(baseline_state.get("loan_tenure_months", 36))
        
        # Target debt reduction: pay down 40% of debt or max $5000
        target_debt = max(current_debt * 0.60, 0.0)
        debt_payoff_amount = current_debt - target_debt
        
        # Target tenure extension: +12 months if short tenure
        target_tenure = min(current_tenure + 12, 60) if current_tenure < 48 else current_tenure

        interventions = {
            "existing_debts": target_debt,
            "loan_tenure_months": target_tenure
        }

        # Step 0: Baseline (Day 0 Pre-Intervention)
        p0_state = StructuralCausalModel.propagate_causal_state(baseline_state, {}, elapsed_days=0)
        p0_prob = baseline_prob

        # Step 1: Immediate Direct Execution (Day 0 Post-Intervention)
        p1_state = StructuralCausalModel.propagate_causal_state(baseline_state, interventions, elapsed_days=0)
        p1_prob = self.predict_state_probability(p1_state)

        # Step 2: Intermediate Bureau Cycle (Day 30-45)
        p2_state = StructuralCausalModel.propagate_causal_state(baseline_state, interventions, elapsed_days=45)
        p2_prob = self.predict_state_probability(p2_state)

        # Step 3: Target State Horizon (Day 90)
        p3_state = StructuralCausalModel.propagate_causal_state(baseline_state, interventions, elapsed_days=max_horizon_days)
        p3_prob = self.predict_state_probability(p3_state)

        phases = [
            {
                "phase_id": 1,
                "timeline_days": "Day 0 (Immediate Action)",
                "milestone_title": "Direct Borrower Intervention",
                "direct_actions": [
                    f"Pay down ${debt_payoff_amount:,.0f} in revolving/card balances",
                    f"Adjust requested loan tenure from {current_tenure}m to {target_tenure}m"
                ],
                "structural_impact": {
                    "credit_utilization": f"{(p1_state['credit_card_utilization']*100):.1f}%",
                    "dti_ratio": f"{(p1_state['dti_ratio']*100):.1f}%",
                    "cibil_score": p1_state["cibil_score"]
                },
                "estimated_approval_prob": p1_prob,
                "status_verdict": "EARLY_TRANSITION"
            },
            {
                "phase_id": 2,
                "timeline_days": "Day 45 (Mid-Term Horizon)",
                "milestone_title": "Structural Bureau Propagation",
                "direct_actions": [
                    "Maintain zero late payments across all open credit lines",
                    "Keep revolving utilization strictly below 30%"
                ],
                "structural_impact": {
                    "credit_utilization": f"{(p2_state['credit_card_utilization']*100):.1f}%",
                    "dti_ratio": f"{(p2_state['dti_ratio']*100):.1f}%",
                    "cibil_score": p2_state["cibil_score"]
                },
                "estimated_approval_prob": p2_prob,
                "status_verdict": "CONDITIONAL_APPROVAL" if p2_prob >= 0.60 else "IMPROVING"
            },
            {
                "phase_id": 3,
                "timeline_days": f"Day {max_horizon_days} (Target State)",
                "milestone_title": "Prime Underwriting Clearance",
                "direct_actions": [
                    "Re-submit loan application for automated approval verification"
                ],
                "structural_impact": {
                    "credit_utilization": f"{(p3_state['credit_card_utilization']*100):.1f}%",
                    "dti_ratio": f"{(p3_state['dti_ratio']*100):.1f}%",
                    "cibil_score": p3_state["cibil_score"]
                },
                "estimated_approval_prob": p3_prob,
                "status_verdict": "CONFIDENT_APPROVAL" if p3_prob >= target_probability else "STRONG_ELIGIBILITY"
            }
        ]

        causal_sensitivities = self.compute_causal_sensitivity(baseline_state)

        return {
            "initial_status": "REJECTED" if baseline_prob < 0.45 else "PENDING",
            "baseline_probability": baseline_prob,
            "target_probability": target_probability,
            "final_projected_probability": p3_prob,
            "total_probability_gain": round(p3_prob - baseline_prob, 4),
            "projected_cibil_gain": p3_state["cibil_score"] - baseline_state.get("cibil_score", 650),
            "is_recourse_needed": True,
            "horizon_days": max_horizon_days,
            "phases": phases,
            "causal_levers_ranked": causal_sensitivities,
            "structural_causal_graph": StructuralCausalModel.CAUSAL_GRAPH
        }
