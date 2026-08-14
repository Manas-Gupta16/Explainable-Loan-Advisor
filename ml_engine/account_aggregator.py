import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple

class AccountAggregatorEngine:
    """
    Real-Time Account Aggregator (AA) & Open Banking Cashflow Volatility Engine.
    Processes granular bank transaction streams to extract liquidity patterns, NACH mandate
    bounce penalty ratios, cashflow volatility indices, and alternative credit scores.
    """

    TRANSACTION_CATEGORIES = {
        "SALARY_CREDIT": ["SALARY", "PAYROLL", "DIR DEP", "EMPLOYER", "WAGES"],
        "BUSINESS_INFLOW": ["INVOICE", "CLIENT PAYMENT", "SETTLEMENT", "MERCHANT", "UPI CREDIT", "RAZORPAY", "STRIPE"],
        "NACH_EMI_DEBIT": ["NACH", "ACH DEBIT", "LOAN EMI", "MANDATE", "HDFC LOAN", "BAJAJ FIN", "CHASE AUTO"],
        "RENT_UTILITY": ["RENT", "ELECTRICITY", "WATER", "BROADBAND", "GAS", "AIRTEL", "MAINTENANCE"],
        "DISCRETIONARY_EXPENSE": ["AMAZON", "SWIGGY", "ZOMATO", "UBER", "NETFLIX", "STARBUCKS", "DINING", "SHOPPING"],
        "INVESTMENTS_SAVINGS": ["MUTUAL FUND", "SIP", "ZERODHA", "GROWW", "VANGUARD", "FD DEPOSIT"],
        "BOUNCE_PENALTY": ["BOUNCE CHARGE", "INSUFFICIENT FUNDS", "RETURN PENALTY", "ECS REVERSAL", "UNPAID MANDATE"]
    }

    @classmethod
    def categorize_transaction(cls, description: str, amount: float, txn_type: str) -> str:
        """Categorizes transaction by parsing narration text and payment descriptors."""
        desc_upper = description.upper()
        
        # Check for bounce penalty first
        for kw in cls.TRANSACTION_CATEGORIES["BOUNCE_PENALTY"]:
            if kw in desc_upper:
                return "BOUNCE_PENALTY"

        if txn_type.upper() == "CREDIT":
            for kw in cls.TRANSACTION_CATEGORIES["SALARY_CREDIT"]:
                if kw in desc_upper:
                    return "SALARY_CREDIT"
            for kw in cls.TRANSACTION_CATEGORIES["BUSINESS_INFLOW"]:
                if kw in desc_upper:
                    return "BUSINESS_INFLOW"
            return "OTHER_CREDIT"

        elif txn_type.upper() == "DEBIT":
            for kw in cls.TRANSACTION_CATEGORIES["NACH_EMI_DEBIT"]:
                if kw in desc_upper:
                    return "NACH_EMI_DEBIT"
            for kw in cls.TRANSACTION_CATEGORIES["RENT_UTILITY"]:
                if kw in desc_upper:
                    return "RENT_UTILITY"
            for kw in cls.TRANSACTION_CATEGORIES["INVESTMENTS_SAVINGS"]:
                if kw in desc_upper:
                    return "INVESTMENTS_SAVINGS"
            for kw in cls.TRANSACTION_CATEGORIES["DISCRETIONARY_EXPENSE"]:
                if kw in desc_upper:
                    return "DISCRETIONARY_EXPENSE"
            return "GENERAL_DEBIT"

        return "UNCATEGORIZED"

    @classmethod
    def generate_synthetic_bank_stream(
        cls,
        account_type: str = "SALARIED_PRIME",  # "SALARIED_PRIME", "GIG_VOLATILE", "BOUNCE_STRESSED"
        monthly_salary: float = 6500.0,
        months: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic 6-month daily banking statement transaction streams for testing and evaluation.
        """
        transactions = []
        base_date = datetime.now(timezone.utc) - timedelta(days=months * 30)
        running_balance = monthly_salary * 1.5

        for m in range(months):
            month_start = base_date + timedelta(days=m * 30)

            # 1. Salary / Primary Inflow (Around 1st - 5th of each month)
            if account_type == "GIG_VOLATILE":
                # Multiple irregular inflows with variance
                inflows = [monthly_salary * np.random.uniform(0.3, 0.7) for _ in range(3)]
                for i, inflow_amt in enumerate(inflows):
                    txn_date = (month_start + timedelta(days=int(np.random.uniform(2, 28)))).strftime("%Y-%m-%d")
                    running_balance += inflow_amt
                    transactions.append({
                        "date": txn_date,
                        "description": f"UPI Client Settlement Inv #{m*10 + i}",
                        "amount": round(inflow_amt, 2),
                        "type": "CREDIT",
                        "category": "BUSINESS_INFLOW",
                        "running_balance": round(running_balance, 2)
                    })
            else:
                # Regular payroll deposit
                salary_date = (month_start + timedelta(days=int(np.random.choice([1, 2, 3])))).strftime("%Y-%m-%d")
                salary_amt = monthly_salary * (1.0 + np.random.uniform(-0.02, 0.02))
                running_balance += salary_amt
                transactions.append({
                    "date": salary_date,
                    "description": "TECH CORP AUTOMATED PAYROLL SALARY",
                    "amount": round(salary_amt, 2),
                    "type": "CREDIT",
                    "category": "SALARY_CREDIT",
                    "running_balance": round(running_balance, 2)
                })

            # 2. Fixed Rent & Utility Debts (5th - 10th of month)
            rent_amt = monthly_salary * 0.25
            rent_date = (month_start + timedelta(days=5)).strftime("%Y-%m-%d")
            running_balance -= rent_amt
            transactions.append({
                "date": rent_date,
                "description": "ACH APARTMENT LEASING RENT PAYMENT",
                "amount": round(rent_amt, 2),
                "type": "DEBIT",
                "category": "RENT_UTILITY",
                "running_balance": round(running_balance, 2)
            })

            # 3. Existing Loan EMIs / NACH Mandates (10th - 15th)
            emi_amt = monthly_salary * 0.18
            emi_date = (month_start + timedelta(days=10)).strftime("%Y-%m-%d")
            
            if account_type == "BOUNCE_STRESSED" and m in [1, 4]:
                # Simulate Insufficient Funds Bounce
                bounce_fee = 45.0
                running_balance -= bounce_fee
                transactions.append({
                    "date": emi_date,
                    "description": "NACH AUTO-DEBIT RETURN / INSUFFICIENT FUNDS PENALTY",
                    "amount": bounce_fee,
                    "type": "DEBIT",
                    "category": "BOUNCE_PENALTY",
                    "running_balance": round(running_balance, 2)
                })
            else:
                running_balance -= emi_amt
                transactions.append({
                    "date": emi_date,
                    "description": "NACH HDFC AUTO LOAN MANDATE EMI",
                    "amount": round(emi_amt, 2),
                    "type": "DEBIT",
                    "category": "NACH_EMI_DEBIT",
                    "running_balance": round(running_balance, 2)
                })

            # 4. Discretionary & Lifestyle Debits (Scattered throughout the month)
            for d in range(6):
                disc_amt = np.random.uniform(40.0, 160.0)
                disc_date = (month_start + timedelta(days=int(np.random.uniform(12, 28)))).strftime("%Y-%m-%d")
                running_balance = max(running_balance - disc_amt, 100.0)
                transactions.append({
                    "date": disc_date,
                    "description": np.random.choice(["AMAZON RETAIL", "ZOMATO ONLINE", "UBER RIDE", "STARBUCKS COFFEE"]),
                    "amount": round(disc_amt, 2),
                    "type": "DEBIT",
                    "category": "DISCRETIONARY_EXPENSE",
                    "running_balance": round(running_balance, 2)
                })

        # Sort transactions chronologically
        transactions.sort(key=lambda x: x["date"])
        return transactions

    @classmethod
    def analyze_transaction_stream(
        cls,
        transactions: List[Dict[str, Any]],
        requested_loan_emi: float = 650.0
    ) -> Dict[str, Any]:
        """
        Extracts comprehensive cashflow volatility metrics, NACH mandate bounce ratios,
        Average Daily Balance (ADB), and Account Aggregator Alternative Credit Score.
        """
        if not transactions:
            return {"status": "EMPTY_STREAM", "error": "No banking transactions provided."}

        df = pd.DataFrame(transactions)
        
        # Categorize if not already categorized
        if "category" not in df.columns or df["category"].isnull().any():
            df["category"] = df.apply(
                lambda row: cls.categorize_transaction(str(row.get("description", "")), float(row.get("amount", 0)), str(row.get("type", "DEBIT"))),
                axis=1
            )

        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["running_balance"] = pd.to_numeric(df["running_balance"], errors="coerce").fillna(1000.0)
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.sort_values("date")

        total_credits = float(df[df["type"].str.upper() == "CREDIT"]["amount"].sum())
        total_debits = float(df[df["type"].str.upper() == "DEBIT"]["amount"].sum())

        # Time Span in Months
        date_span_days = max((df["date"].max() - df["date"].min()).days, 30)
        months_span = max(date_span_days / 30.0, 1.0)

        avg_monthly_inflow = round(total_credits / months_span, 2)
        avg_monthly_outflow = round(total_debits / months_span, 2)
        net_monthly_cashflow = round(avg_monthly_inflow - avg_monthly_outflow, 2)

        # Average Daily Balance (ADB) & Minimum Balance Floor
        adb = round(float(df["running_balance"].mean()), 2)
        min_balance_floor = round(float(df["running_balance"].min()), 2)

        # Category Breakdowns
        cat_sums = df.groupby("category")["amount"].sum().to_dict()
        salary_inflow_total = cat_sums.get("SALARY_CREDIT", 0.0) + cat_sums.get("BUSINESS_INFLOW", 0.0)
        fixed_emi_total = cat_sums.get("NACH_EMI_DEBIT", 0.0)
        rent_utility_total = cat_sums.get("RENT_UTILITY", 0.0)
        discretionary_total = cat_sums.get("DISCRETIONARY_EXPENSE", 0.0)
        bounce_penalties_count = int(df[df["category"] == "BOUNCE_PENALTY"].shape[0])

        # 1. Income Volatility Index (CV = std / mean of monthly inflows)
        df["year_month"] = df["date"].dt.to_period("M")
        monthly_inflows = df[df["type"].str.upper() == "CREDIT"].groupby("year_month")["amount"].sum()
        
        if len(monthly_inflows) > 1:
            inflow_std = float(monthly_inflows.std())
            inflow_mean = float(monthly_inflows.mean())
            income_volatility_index = round(float(np.clip(inflow_std / max(inflow_mean, 1.0), 0.0, 1.0)), 3)
        else:
            income_volatility_index = 0.05

        # 2. NACH Mandate Presentation & Bounce Ratio
        total_nach_presentations = int(df[df["category"].isin(["NACH_EMI_DEBIT", "BOUNCE_PENALTY"])].shape[0])
        bounce_ratio = round(float(bounce_penalties_count / max(total_nach_presentations, 1)), 3) if total_nach_presentations > 0 else 0.0

        # 3. Cashflow Debt Service Coverage Ratio (CF-DSCR)
        # CF-DSCR = (Net Monthly Inflow - Living Costs) / Requested Monthly Loan EMI
        disposable_operating_cashflow = max(net_monthly_cashflow, 0.0)
        safe_req_emi = max(requested_loan_emi, 100.0)
        cf_dscr = round(float(disposable_operating_cashflow / safe_req_emi), 2)

        # 4. Discretionary Spending Ratio
        discretionary_spend_ratio = round(float(discretionary_total / max(total_debits, 1.0)), 3)

        # 5. Account Aggregator Alternative Credit Score (Scale: 300 to 900)
        # Base Score starts at 650
        aa_score = 650.0
        # + CF-DSCR impact (+/- up to 100 pts)
        aa_score += np.clip((cf_dscr - 1.25) * 80.0, -100.0, 100.0)
        # + Income Stability impact (+/- up to 70 pts)
        aa_score += np.clip((0.15 - income_volatility_index) * 300.0, -70.0, 70.0)
        # - NACH Bounce Penalty (up to -150 pts)
        aa_score -= (bounce_penalties_count * 55.0)
        # + Average Daily Balance Buffer (up to +50 pts)
        adb_ratio = adb / max(avg_monthly_inflow, 1.0)
        aa_score += np.clip((adb_ratio - 0.5) * 60.0, -30.0, 50.0)
        
        aa_credit_score = int(np.clip(aa_score, 300, 900))

        # Risk Quality Tier & Decision Flags
        flags = []
        if bounce_penalties_count > 0:
            flags.append(f"HIGH_ALERT: {bounce_penalties_count} E-Mandate / NACH insufficient funds bounces recorded in past 6 months.")
        if income_volatility_index > 0.35:
            flags.append("ELEVATED_VOLATILITY: Irregular or variable monthly income arrival pattern detected.")
        if min_balance_floor < 50.0:
            flags.append("LIQUIDITY_DIP: End-of-month account balance breached critical safety threshold ($50).")
        if cf_dscr >= 2.0 and bounce_penalties_count == 0:
            flags.append("EXEMPLARY_CASHFLOW: Robust free cashflow covers requested loan EMI by >2.0x.")

        if aa_credit_score >= 740 and bounce_penalties_count == 0:
            quality_tier = "PRIME_CASHFLOW"
            model_uplift = +0.07  # +7% uplift to standard ML probability
        elif aa_credit_score >= 640 and bounce_penalties_count <= 1:
            quality_tier = "STABLE_CASHFLOW"
            model_uplift = +0.02
        else:
            quality_tier = "STRESSED_CASHFLOW"
            model_uplift = -0.10  # -10% penalty

        return {
            "analysis_period_months": round(months_span, 1),
            "total_transactions_analyzed": int(df.shape[0]),
            "account_aggregator_score": aa_credit_score,
            "cashflow_quality_tier": quality_tier,
            "cashflow_probability_uplift": round(model_uplift, 3),
            "liquidity_metrics": {
                "avg_monthly_inflow": avg_monthly_inflow,
                "avg_monthly_outflow": avg_monthly_outflow,
                "net_monthly_cashflow": net_monthly_cashflow,
                "average_daily_balance": adb,
                "minimum_balance_floor": min_balance_floor
            },
            "volatility_indices": {
                "income_volatility_index": income_volatility_index,
                "nach_mandate_bounce_count": bounce_penalties_count,
                "nach_bounce_ratio": bounce_ratio,
                "cashflow_dscr": cf_dscr,
                "discretionary_spend_ratio": discretionary_spend_ratio
            },
            "spending_breakdown": {
                "total_salary_inflows": round(salary_inflow_total, 2),
                "total_loan_emi_debits": round(fixed_emi_total, 2),
                "total_rent_utilities": round(rent_utility_total, 2),
                "total_discretionary": round(discretionary_total, 2)
            },
            "underwriting_flags": flags
        }
