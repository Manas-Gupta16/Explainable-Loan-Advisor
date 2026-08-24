import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple

class AccountAggregatorEngine:
    """
    Real-Time RBI Sahamati Account Aggregator (AA) & Open Banking Cashflow Volatility Engine.
    Processes granular Indian bank statement transaction streams to extract liquidity patterns,
    NACH e-mandate bounce penalty ratios, UPI cashflow volatility indices, and alternative credit scores.
    """

    TRANSACTION_CATEGORIES = {
        "SALARY_CREDIT": ["SALARY", "PAYROLL", "NEFT SALARY", "DIR DEP", "WAGES", "INFOSYS SAL", "TCS SAL"],
        "BUSINESS_INFLOW": ["INVOICE", "CLIENT PAYMENT", "SETTLEMENT", "MERCHANT", "UPI CREDIT", "RAZORPAY", "PHONEPE BIZ", "PAYTM BIZ"],
        "NACH_EMI_DEBIT": ["NACH", "ACH DEBIT", "LOAN EMI", "MANDATE", "HDFC LOAN", "BAJAJ FIN", "SBI LOAN", "ICICI EMI"],
        "RENT_UTILITY": ["RENT", "ELECTRICITY", "BESCOM", "WATER", "BROADBAND", "GAS", "AIRTEL", "JIO", "MAINTENANCE"],
        "DISCRETIONARY_EXPENSE": ["AMAZON", "SWIGGY", "ZOMATO", "UBER", "OLA", "BLINKIT", "ZEPTO", "NETFLIX", "MYNTRA", "STARBUCKS", "DINING"],
        "INVESTMENTS_SAVINGS": ["MUTUAL FUND", "SIP", "ZERODHA", "GROWW", "COIN", "FD DEPOSIT", "PPF", "NPS"],
        "BOUNCE_PENALTY": ["BOUNCE CHARGE", "INSUFFICIENT FUNDS", "RETURN PENALTY", "ECS REVERSAL", "UNPAID MANDATE", "NACH RETURN"]
    }

    @classmethod
    def categorize_transaction(cls, description: str, amount: float, txn_type: str) -> str:
        """Categorizes transaction by parsing Indian payment descriptors and narration text."""
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
        monthly_salary: float = 65000.0,
        months: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic 6-month daily Indian bank statement transaction streams for testing and evaluation.
        """
        transactions = []
        base_date = datetime.now(timezone.utc) - timedelta(days=months * 30)
        running_balance = monthly_salary * 1.5

        for m in range(months):
            month_start = base_date + timedelta(days=m * 30)

            # 1. Salary / Primary Inflow (Around 1st - 5th of each month)
            if account_type == "GIG_VOLATILE":
                # Multiple irregular UPI / Freelance inflows with variance
                inflows = [monthly_salary * np.random.uniform(0.25, 0.65) for _ in range(3)]
                for i, inflow_amt in enumerate(inflows):
                    txn_date = month_start + timedelta(days=int(np.random.choice([2, 10, 20])))
                    running_balance += inflow_amt
                    transactions.append({
                        "date": txn_date.strftime("%Y-%m-%d"),
                        "description": f"UPI Credit / Client Payment Ref-{np.random.randint(100000, 999999)}",
                        "amount": round(inflow_amt, 2),
                        "type": "CREDIT",
                        "category": "BUSINESS_INFLOW",
                        "running_balance": round(running_balance, 2)
                    })
            else:
                salary_date = month_start + timedelta(days=1)
                running_balance += monthly_salary
                transactions.append({
                    "date": salary_date.strftime("%Y-%m-%d"),
                    "description": f"NEFT SALARY / TCS CORP PAYROLL #{np.random.randint(1000, 9999)}",
                    "amount": round(monthly_salary, 2),
                    "type": "CREDIT",
                    "category": "SALARY_CREDIT",
                    "running_balance": round(running_balance, 2)
                })

            # 2. Fixed Obligations: Rent / Utilities (Around 3rd - 7th)
            rent_amt = monthly_salary * 0.28
            running_balance -= rent_amt
            transactions.append({
                "date": (month_start + timedelta(days=3)).strftime("%Y-%m-%d"),
                "description": "UPI / Monthly Apartment Rent Transfer",
                "amount": round(rent_amt, 2),
                "type": "DEBIT",
                "category": "RENT_UTILITY",
                "running_balance": round(running_balance, 2)
            })

            # 3. NACH Loan EMI Mandates (Around 5th - 10th)
            emi_amt = monthly_salary * 0.18
            if account_type == "BOUNCE_STRESSED" and m in [1, 3, 4]:
                # Simulate NACH mandate bounce due to insufficient funds
                bounce_fee = 450.0  # Standard Indian bank bounce charge
                running_balance -= bounce_fee
                transactions.append({
                    "date": (month_start + timedelta(days=5)).strftime("%Y-%m-%d"),
                    "description": "NACH MANDATE BOUNCE CHARGE - INSUFFICIENT FUNDS",
                    "amount": bounce_fee,
                    "type": "DEBIT",
                    "category": "BOUNCE_PENALTY",
                    "running_balance": round(running_balance, 2)
                })
            else:
                running_balance -= emi_amt
                transactions.append({
                    "date": (month_start + timedelta(days=5)).strftime("%Y-%m-%d"),
                    "description": "NACH EMI DEBIT / HDFC BANK LOAN #{np.random.randint(10000, 99999)}",
                    "amount": round(emi_amt, 2),
                    "type": "DEBIT",
                    "category": "NACH_EMI_DEBIT",
                    "running_balance": round(running_balance, 2)
                })

            # 4. Systematic Investment Plan (SIP) (Around 10th)
            if account_type == "SALARIED_PRIME":
                sip_amt = monthly_salary * 0.12
                running_balance -= sip_amt
                transactions.append({
                    "date": (month_start + timedelta(days=10)).strftime("%Y-%m-%d"),
                    "description": "BSE NSDL / ZERODHA MF SIP INVESTMENT",
                    "amount": round(sip_amt, 2),
                    "type": "DEBIT",
                    "category": "INVESTMENTS_SAVINGS",
                    "running_balance": round(running_balance, 2)
                })

            # 5. Discretionary UPI & Living Expenses throughout the month
            discretionary_vendors = [
                "SWIGGY BANGALORE IN",
                "ZOMATO FOOD ORDER",
                "BLINKIT QUICK GROCERY",
                "AMAZON INDIA PAYMENTS",
                "AIRTEL BROADBAND BILL",
                "UBER INDIA RIDES"
            ]
            for day in [8, 12, 16, 21, 25, 28]:
                vendor = discretionary_vendors[np.random.choice(len(discretionary_vendors))]
                amt = (monthly_salary * 0.025) * np.random.uniform(0.8, 1.2)
                running_balance = max(running_balance - amt, 500.0)
                transactions.append({
                    "date": (month_start + timedelta(days=day)).strftime("%Y-%m-%d"),
                    "description": f"UPI / {vendor}",
                    "amount": round(amt, 2),
                    "type": "DEBIT",
                    "category": "DISCRETIONARY_EXPENSE",
                    "running_balance": round(running_balance, 2)
                })


        return transactions

    @classmethod
    def analyze_transaction_stream(
        cls,
        transactions: List[Dict[str, Any]],
        requested_loan_emi: float = 12000.0
    ) -> Dict[str, Any]:
        """
        Analyzes 6-month transaction stream under RBI Account Aggregator guidelines.
        Computes cashflow DSCR, NACH bounce penalties, income volatility, and alternative credit score.
        """
        if not transactions:
            return cls._empty_analysis()

        df = pd.DataFrame(transactions)
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
        
        # Monthly aggregates
        credits = df[df['type'].str.upper() == 'CREDIT']
        debits = df[df['type'].str.upper() == 'DEBIT']
        bounces = df[df['category'] == 'BOUNCE_PENALTY']

        total_inflow = float(credits['amount'].sum())
        total_outflow = float(debits['amount'].sum())
        
        # Estimate number of months in data
        num_months = max(len(set(df['date'].str.slice(0, 7))), 1)
        avg_monthly_inflow = round(total_inflow / num_months, 2)
        avg_monthly_outflow = round(total_outflow / num_months, 2)
        net_monthly_cashflow = round(avg_monthly_inflow - avg_monthly_outflow, 2)

        # Monthly Inflow Volatility (Coefficient of Variation)
        monthly_inflows = credits.groupby(credits['date'].str.slice(0, 7))['amount'].sum()
        if len(monthly_inflows) > 1 and monthly_inflows.mean() > 0:
            income_volatility = float(monthly_inflows.std() / monthly_inflows.mean())
        else:
            income_volatility = 0.05
        income_volatility = round(min(income_volatility, 1.0), 3)

        # NACH Mandate Bounces
        bounce_count = len(bounces)
        bounce_penalty_ratio = min(bounce_count * 0.15, 0.60)

        # Debt Service Coverage Ratio (DSCR): Free Cashflow / Proposed EMI
        disposable_surplus = max(net_monthly_cashflow, 0.0)
        dscr = round(disposable_surplus / max(requested_loan_emi, 100.0), 2) if requested_loan_emi > 0 else 2.5

        # Account Aggregator Alternative Credit Score (300 to 900)
        base_aa_score = 650.0
        # Cashflow capacity adjustment
        if dscr >= 2.0:
            base_aa_score += 80.0
        elif dscr >= 1.2:
            base_aa_score += 40.0
        else:
            base_aa_score -= 60.0

        # Income stability adjustment
        if income_volatility <= 0.10:
            base_aa_score += 60.0
        elif income_volatility <= 0.25:
            base_aa_score += 20.0
        else:
            base_aa_score -= 50.0

        # Bounce penalty
        base_aa_score -= (bounce_count * 55.0)

        aa_score = int(np.clip(round(base_aa_score), 300, 850))

        # Cashflow Quality Tier
        if aa_score >= 740 and bounce_count == 0 and dscr >= 1.5:
            quality_tier = "PRIME_CASHFLOW"
            prob_uplift = +0.12
        elif aa_score >= 640 and bounce_count <= 1:
            quality_tier = "STABLE_CASHFLOW"
            prob_uplift = +0.03
        else:
            quality_tier = "VOLATILE_OR_STRESSED"
            prob_uplift = -0.15

        # Spending Breakdown
        salary_credits = float(df[df['category'] == 'SALARY_CREDIT']['amount'].sum())
        emi_debits = float(df[df['category'] == 'NACH_EMI_DEBIT']['amount'].sum())
        rent_debits = float(df[df['category'] == 'RENT_UTILITY']['amount'].sum())
        disc_debits = float(df[df['category'] == 'DISCRETIONARY_EXPENSE']['amount'].sum())
        
        discretionary_ratio = round(disc_debits / max(total_outflow, 1.0), 3)

        # Balances
        balances = df['running_balance'].values if 'running_balance' in df.columns else [5000.0]
        avg_daily_bal = round(float(np.mean(balances)), 2)
        min_bal_floor = round(float(np.min(balances)), 2)

        # Underwriting flags
        flags = []
        if bounce_count > 0:
            flags.append(f"FLAG_NACH_BOUNCE: {bounce_count} e-mandate bounce incident(s) detected in past 6 months.")
        if dscr < 1.2:
            flags.append(f"FLAG_TIGHT_DSCR: Cashflow DSCR {dscr}x indicates limited surplus after EMI.")
        if income_volatility > 0.25:
            flags.append("FLAG_VOLATILE_INCOME: Substantial monthly variance in credit inflows.")
        if not flags:
            flags.append("CLEAR_AA_TELEMETRY: Zero mandate bounces, consistent salary inflows.")

        return {
            "analysis_period_months": float(num_months),
            "total_transactions_analyzed": len(transactions),
            "account_aggregator_score": aa_score,
            "cashflow_quality_tier": quality_tier,
            "cashflow_probability_uplift": prob_uplift,
            "liquidity_metrics": {
                "avg_monthly_inflow": avg_monthly_inflow,
                "avg_monthly_outflow": avg_monthly_outflow,
                "net_monthly_cashflow": net_monthly_cashflow,
                "average_daily_balance": avg_daily_bal,
                "minimum_balance_floor": min_bal_floor,
                "months_analyzed": num_months
            },
            "volatility_indices": {
                "income_volatility_index": income_volatility,
                "nach_mandate_bounce_count": bounce_count,
                "nach_bounce_ratio": round(bounce_penalty_ratio, 3),
                "cashflow_dscr": dscr,
                "discretionary_spend_ratio": discretionary_ratio
            },
            "spending_breakdown": {
                "total_salary_inflows": round(salary_credits, 2),
                "total_loan_emi_debits": round(emi_debits, 2),
                "total_rent_utilities": round(rent_debits, 2),
                "total_discretionary": round(disc_debits, 2)
            },
            "underwriting_flags": flags
        }

    @classmethod
    def _empty_analysis(cls) -> Dict[str, Any]:
        return {
            "analysis_period_months": 6.0,
            "total_transactions_analyzed": 0,
            "account_aggregator_score": 600,
            "cashflow_quality_tier": "STABLE_CASHFLOW",
            "cashflow_probability_uplift": 0.0,
            "liquidity_metrics": {
                "avg_monthly_inflow": 50000.0,
                "avg_monthly_outflow": 35000.0,
                "net_monthly_cashflow": 15000.0,
                "average_daily_balance": 12000.0,
                "minimum_balance_floor": 2000.0,
                "months_analyzed": 6
            },
            "volatility_indices": {
                "income_volatility_index": 0.12,
                "nach_mandate_bounce_count": 0,
                "nach_bounce_ratio": 0.0,
                "cashflow_dscr": 1.5,
                "discretionary_spend_ratio": 0.35
            },
            "spending_breakdown": {
                "total_salary_inflows": 300000.0,
                "total_loan_emi_debits": 45000.0,
                "total_rent_utilities": 90000.0,
                "total_discretionary": 75000.0
            },
            "underwriting_flags": ["CLEAR_AA_TELEMETRY: Simulated profile baseline."]
        }

