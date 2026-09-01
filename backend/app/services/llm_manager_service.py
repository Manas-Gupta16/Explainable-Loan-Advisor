import os
import json
from typing import Dict, Any

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMManagerService:
    """
    Agentic LLM Service that reads XAI data (SHAP, DiCE) and generates
    human-readable Executive Credit Memos for Bank Managers.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = None
        self.is_configured = False

        if HAS_GEMINI and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Using Gemini 1.5 Flash for fast textual reasoning
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.is_configured = True
                print("LLM Manager Service: Gemini initialized successfully.")
            except Exception as e:
                print(f"LLM Manager Service: Initialization error - {e}")
        else:
            print("LLM Manager Service: Gemini not configured (missing API key or package). Operating in fallback mode.")

    def generate_credit_memo(self, application_data: Dict[str, Any]) -> str:
        """
        Takes raw loan application data, ML approval probability, and SHAP features
        and returns a 1-page professional Executive Summary in Markdown.
        """
        # If Gemini is not set up, return a highly structured fallback memo
        if not self.is_configured or not self.model:
            return self._generate_fallback_memo(application_data)

        try:
            # Construct a highly structured prompt to act as an AI Credit Underwriter
            prompt = self._build_underwriter_prompt(application_data)
            
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return response.text
            else:
                return self._generate_fallback_memo(application_data)
                
        except Exception as e:
            print(f"LLM Inference Error: {e}")
            return self._generate_fallback_memo(application_data)

    def _build_underwriter_prompt(self, data: Dict[str, Any]) -> str:
        # Extract basic metrics
        loan_amount = data.get('loan_amount', 'N/A')
        purpose = data.get('loan_purpose', 'N/A')
        prob = data.get('approval_probability', 0.0) * 100
        status = data.get('status', 'PENDING')
        
        # Extract SHAP top features
        shap_data = data.get('shap_explanation', {}).get('top_features', [])
        shap_summary = ", ".join([f"{f['feature']} ({f['impact']})" for f in shap_data]) if shap_data else "No SHAP data available."

        prompt = f"""
        You are an elite, highly experienced Senior Credit Risk Officer at a top-tier Indian Agricultural Bank.
        Your job is to read the raw data from our Machine Learning Underwriting Engine and write a clear, 
        concise, and professional "Executive Credit Memo".

        This memo will be read by human branch managers to help them understand WHY the AI made its decision.

        --- APPLICANT RAW DATA ---
        Loan Amount Requested: ₹{loan_amount}
        Purpose: {purpose}
        ML Approval Probability: {prob:.1f}%
        System Recommendation: {status}
        Top XAI Drivers (SHAP): {shap_summary}

        --- INSTRUCTIONS ---
        Write a 3-paragraph executive summary formatted in Markdown (no `#` headers, just bold text `**` where appropriate).
        
        Paragraph 1: State the loan request, the ML probability, and the final system recommendation.
        Paragraph 2: Explain the primary drivers behind this decision (translate the SHAP drivers into human financial logic. For example, if 'cibil_score (POSITIVE)' is a driver, explain that their strong credit history is a major positive factor).
        Paragraph 3: Give a final underwriter verdict or recommendation for the human loan officer (e.g., "Proceed with standard KYC", or "Request additional collateral due to elevated FOIR").

        Keep the tone extremely professional, objective, and analytical. Do not invent any financial numbers not provided above.
        """
        return prompt

    def _generate_fallback_memo(self, data: Dict[str, Any]) -> str:
        """Fallback memo when API key is missing."""
        prob = data.get('approval_probability', 0.0) * 100
        status = data.get('status', 'PENDING')
        
        return f"""**Executive Summary (Automated Fallback)**

The applicant has requested a loan with a system-calculated approval probability of **{prob:.1f}%**. Based on the multi-factor machine learning evaluation, the system recommendation is **{status}**.

The primary drivers of this decision include the applicant's CIBIL score, Debt-to-Income (FOIR) ratio, and existing credit history. The SHAP (Shapley Additive Explanations) analysis confirms that the decision heavily weights these parameters in alignment with standard banking regulations.

**Underwriter Recommendation:** Please review the attached SHAP attribution charts and demographic fairness metrics below to finalize the manual underwriting process. *(Note: Full AI-generated memo is disabled due to missing LLM API Key).*"""

llm_manager_service = LLMManagerService()
