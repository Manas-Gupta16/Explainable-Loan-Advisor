import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Send, ShieldCheck, AlertTriangle, CheckCircle,
  RefreshCw, Layers, MapPin, PieChart, Sparkles,
  FileText, Download, Play, Pause, Volume2, Landmark,
  TrendingDown, Gauge, FileCheck, BrainCircuit, GitCommit, UserCheck
} from 'lucide-react';

const PRESETS = [
  {
    name: "Prime Tier-1 Applicant",
    badge: "INSTANT APPROVAL",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    data: {
      cibil_score: 790,
      applicant_income: 110000,
      coapplicant_income: 25000,
      loan_amount: 35000,
      loan_tenure_months: 36,
      existing_debts: 4000,
      credit_card_utilization: 0.15,
      delinquent_lines_2yrs: 0,
      credit_history_years: 8.5,
      employment_status: 'Salaried',
      education: 'Graduate',
      home_ownership: 'OWN',
      loan_purpose: 'Personal'
    }
  },
  {
    name: "Subprime Gig Economy Worker",
    badge: "ACTIONABLE RECOURSE",
    badgeColor: "text-[#d2ff00] bg-[#d2ff00]/10 border-[#d2ff00]/30",
    data: {
      cibil_score: 640,
      applicant_income: 48000,
      coapplicant_income: 0,
      loan_amount: 22000,
      loan_tenure_months: 48,
      existing_debts: 12000,
      credit_card_utilization: 0.55,
      delinquent_lines_2yrs: 1,
      credit_history_years: 3.5,
      employment_status: 'Self-Employed',
      education: 'Graduate',
      home_ownership: 'RENT',
      loan_purpose: 'Personal'
    }
  },
  {
    name: "Borderline Recourse Applicant",
    badge: "PARETO SHIFT",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    data: {
      cibil_score: 695,
      applicant_income: 62000,
      coapplicant_income: 10000,
      loan_amount: 28000,
      loan_tenure_months: 36,
      existing_debts: 9500,
      credit_card_utilization: 0.38,
      delinquent_lines_2yrs: 0,
      credit_history_years: 5.0,
      employment_status: 'Salaried',
      education: 'Graduate',
      home_ownership: 'MORTGAGE',
      loan_purpose: 'Home'
    }
  },
  {
    name: "Overleveraged DTI Rejection",
    badge: "HIGH RISK DEFAULTER",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    data: {
      cibil_score: 560,
      applicant_income: 38000,
      coapplicant_income: 0,
      loan_amount: 45000,
      loan_tenure_months: 24,
      existing_debts: 26000,
      credit_card_utilization: 0.88,
      delinquent_lines_2yrs: 3,
      credit_history_years: 2.0,
      employment_status: 'Salaried',
      education: 'High School',
      home_ownership: 'RENT',
      loan_purpose: 'Debt Consolidation'
    }
  }
];

export default function CustomerPortal() {
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // AI Coach state
  const [coachLanguage, setCoachLanguage] = useState('English');
  const [coachData, setCoachData] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // OCR state
  const [docType, setDocType] = useState('PAY_SLIP');
  const [docFileName, setDocFileName] = useState('Google_Paystub_Nov2026.pdf');
  const [declaredIncome, setDeclaredIncome] = useState(formData.applicant_income / 12);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Open Banking state
  const [selectedBank, setSelectedBank] = useState('Chase Bank');
  const [openBankingResult, setOpenBankingResult] = useState(null);
  const [openBankingLoading, setOpenBankingLoading] = useState(false);

  // Stress Test state
  const [stressScenario, setStressScenario] = useState('COMBINED_STAGFLATION');
  const [rateHike, setRateHike] = useState(2.5);
  const [inflationCost, setInflationCost] = useState(5.0);
  const [incomeShock, setIncomeShock] = useState(10.0);
  const [stressResult, setStressResult] = useState(null);
  const [stressLoading, setStressLoading] = useState(false);

  // Conformal state
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [conformalResult, setConformalResult] = useState(null);

  // Causal state
  const [causalResult, setCausalResult] = useState(null);
  const [causalLoading, setCausalLoading] = useState(false);

  // PDF Dossier state
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData(preset.data);
    setDeclaredIncome(preset.data.applicant_income / 12);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/v1/customer/apply', formData);
      setResult(response.data);
      // Auto trigger coach & conformal preview
      fetchCoachAdvice(response.data);
      fetchConformal(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze loan application. Make sure backend server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch AI Coach
  const fetchCoachAdvice = async (customResult) => {
    const curResult = customResult || result;
    setCoachLoading(true);
    try {
      const payload = {
        applicant_name: "Valued Applicant",
        language: coachLanguage,
        application_id: curResult?.application_id || null,
        loan_input: formData,
        shap_data: curResult?.shap_explanation || null,
        dice_data: curResult?.dice_roadmap || null
      };
      const res = await axios.post('/api/v1/customer/coach-advice', payload);
      setCoachData(res.data);
    } catch (err) {
      console.error("Error fetching AI Coach advice:", err);
    } finally {
      setCoachLoading(false);
    }
  };

  // 2. Play TTS Audio Simulation
  const handleToggleSpeech = () => {
    if (!coachData?.audio_narration_script) return;

    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(coachData.audio_narration_script);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  // 3. OCR Document Upload Simulation
  const handleUploadDocument = async () => {
    setOcrLoading(true);
    try {
      const appId = result?.application_id || 1;
      const res = await axios.post(`/api/v1/customer/upload-documents/${appId}`, {
        document_type: docType,
        file_name: docFileName,
        declared_monthly_income: declaredIncome || formData.applicant_income / 12,
        raw_text_content: `Employer: Meta Platforms Inc. Monthly Base Pay: $${Math.round((formData.applicant_income / 12) * 0.95)}. Tax ID: 94-2819281. YTD Earnings: $${formData.applicant_income}. Verified through ADP Payroll System.`
      });
      setOcrResult(res.data);
    } catch (err) {
      console.error("OCR Document verification error:", err);
    } finally {
      setOcrLoading(false);
    }
  };

  // 4. Connect Open Banking
  const handleConnectOpenBanking = async () => {
    setOpenBankingLoading(true);
    try {
      const appId = result?.application_id || 1;
      const res = await axios.post('/api/v1/customer/open-banking/connect', {
        application_id: appId,
        monthly_net_salary: formData.applicant_income / 12,
        existing_monthly_emi: formData.existing_debts / 12
      });
      setOpenBankingResult(res.data);
    } catch (err) {
      console.error("Open banking connection error:", err);
    } finally {
      setOpenBankingLoading(false);
    }
  };

  // 5. Macro Stress Test
  const handleRunStressTest = async () => {
    setStressLoading(true);
    try {
      const res = await axios.post('/api/v1/customer/stress-test', {
        application_id: result?.application_id || null,
        loan_input: formData,
        scenario: stressScenario,
        interest_rate_delta_pct: rateHike,
        inflation_cost_delta_pct: inflationCost,
        income_shock_pct: incomeShock
      });
      setStressResult(res.data);
    } catch (err) {
      console.error("Macro stress test error:", err);
    } finally {
      setStressLoading(false);
    }
  };

  // 6. Conformal Prediction
  const fetchConformal = async (customResult) => {
    try {
      const res = await axios.post('/api/v1/customer/conformal-predict', {
        application_id: customResult?.application_id || result?.application_id || null,
        loan_input: formData,
        confidence_level: confidenceLevel
      });
      setConformalResult(res.data);
    } catch (err) {
      console.error("Conformal prediction error:", err);
    }
  };

  // 7. Causal Recourse
  const handleRunCausalRecourse = async () => {
    setCausalLoading(true);
    try {
      const res = await axios.post('/api/v1/customer/causal-recourse', {
        loan_input: formData,
        target_probability: 0.80,
        max_horizon_days: 180
      });
      setCausalResult(res.data);
    } catch (err) {
      console.error("Causal recourse error:", err);
    } finally {
      setCausalLoading(false);
    }
  };

  // 8. Download Adverse Action PDF Dossier
  const handleDownloadPdf = async () => {
    const appId = result?.application_id || 1;
    setPdfDownloading(true);
    try {
      const response = await axios.get(`/api/v1/customer/applications/${appId}/dossier-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Decision_Dossier_App_${appId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading PDF dossier:", err);
      alert("Failed to download PDF dossier. Please ensure backend is running.");
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20"
    >
      
      {/* Page Header */}
      <div className="border-b border-[#1e2a3d] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>● CUSTOMER RECOURSE & XAI INTELLIGENCE PORTAL</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Loan Evaluation & <span className="text-[#d2ff00]">Actionable Recourse</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
            AI-driven credit assessment with multi-lender Pareto optimization, DiCE actionable counterfactuals, SHAP local importance, and full regulatory transparency.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {result && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="btn-lime text-xs font-bold py-2.5 px-4 shadow-[0_0_15px_rgba(210,255,0,0.25)] cursor-pointer"
            >
              {pdfDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>EXPORT ADVERSE ACTION PDF</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Demo Preset Selector Bar */}
      <div className="bg-[#121824] border border-[#1e2a3d] p-3 rounded-2xl">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[11px] font-mono-tech text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d2ff00]" /> DEMO PROFILES (1-CLICK QUICK LOAD):
          </span>
          <span className="text-[10px] font-mono-tech text-[#d2ff00]">PRE-CONFIGURED UNDERWRITING MATRICES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="bg-[#0a0e17] hover:bg-[#162030] p-2.5 rounded-xl border border-[#1e2a3d] hover:border-[#d2ff00]/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#d2ff00] transition-colors">{p.name}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono-tech text-slate-400">Score: {p.data.cibil_score} | ${p.data.loan_amount.toLocaleString()}</span>
                <span className={`text-[9px] font-mono-tech px-1.5 py-0.5 rounded border ${p.badgeColor}`}>{p.badge}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Parameter Inputs (5 columns) */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 space-y-4"
        >
          <form onSubmit={handleSubmit} className="cyber-card space-y-4 bg-[#121824] border-[#1e2a3d]">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#d2ff00]" /> Underwriting Parameters
              </h3>
              <span className="text-[10px] font-mono-tech text-slate-500">XGBOOST FEATURE VECTOR</span>
            </div>

            {/* CIBIL Score Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">CIBIL Credit Score</label>
                <span className="font-mono-tech font-bold text-[#d2ff00] text-sm">{formData.cibil_score}</span>
              </div>
              <input
                type="range"
                min="300"
                max="850"
                name="cibil_score"
                value={formData.cibil_score}
                onChange={handleChange}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>300 (Subprime)</span>
                <span>750 (Prime)</span>
                <span>850 (Super Prime)</span>
              </div>
            </div>

            {/* Incomes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Applicant Income ($/yr)</label>
                <input
                  type="number"
                  name="applicant_income"
                  value={formData.applicant_income}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Co-Applicant Income ($)</label>
                <input
                  type="number"
                  name="coapplicant_income"
                  value={formData.coapplicant_income}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>
            </div>

            {/* Loan Amount & Tenure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Requested Loan ($)</label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tenure (Months)</label>
                <select
                  name="loan_tenure_months"
                  value={formData.loan_tenure_months}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value={12}>12 Months (1 yr)</option>
                  <option value={24}>24 Months (2 yrs)</option>
                  <option value={36}>36 Months (3 yrs)</option>
                  <option value={48}>48 Months (4 yrs)</option>
                  <option value={60}>60 Months (5 yrs)</option>
                  <option value={120}>120 Months (10 yrs)</option>
                </select>
              </div>
            </div>

            {/* Existing Debts & Utilization */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Existing Debts ($)</label>
                <input
                  type="number"
                  name="existing_debts"
                  value={formData.existing_debts}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Card Utilization</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  name="credit_card_utilization"
                  value={formData.credit_card_utilization}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>
            </div>

            {/* Delinquencies & History */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Delinquent Lines (2yr)</label>
                <input
                  type="number"
                  name="delinquent_lines_2yrs"
                  value={formData.delinquent_lines_2yrs}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Credit History (Yrs)</label>
                <input
                  type="number"
                  step="0.5"
                  name="credit_history_years"
                  value={formData.credit_history_years}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>
            </div>

            {/* Categoricals */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Employment</label>
                <select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleChange}
                  className="cyber-input text-xs p-1.5"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Business">Business</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Home Ownership</label>
                <select
                  name="home_ownership"
                  value={formData.home_ownership}
                  onChange={handleChange}
                  className="cyber-input text-xs p-1.5"
                >
                  <option value="OWN">Owned</option>
                  <option value="RENT">Rented</option>
                  <option value="MORTGAGE">Mortgage</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Loan Purpose</label>
                <select
                  name="loan_purpose"
                  value={formData.loan_purpose}
                  onChange={handleChange}
                  className="cyber-input text-xs p-1.5"
                >
                  <option value="Personal">Personal</option>
                  <option value="Home">Home</option>
                  <option value="Auto">Auto</option>
                  <option value="Debt Consolidation">Consolidation</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(210,255,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-lime w-full justify-center py-3 mt-2 text-xs font-black tracking-wide cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> RUNNING XGBOOST & XAI PIPELINE...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> EVALUATE ELIGIBILITY & RECOURSE
                </span>
              )}
            </motion.button>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

          </form>
        </motion.div>

        {/* Right Area: Results & Deep Feature Sub-Views (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {!result ? (
            <div className="cyber-card p-12 text-center bg-[#121824] border-[#1e2a3d] flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-20 h-20 rounded-2xl bg-[#d2ff00]/10 text-[#d2ff00] border border-[#d2ff00]/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(210,255,0,0.15)]">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white">XAI Underwriting Engine Ready</h3>
              <p className="text-slate-400 text-xs max-w-md mt-2 font-light leading-relaxed">
                Select a demo profile above or customize parameters on the left, then click <strong className="text-white">"Evaluate Eligibility & Recourse"</strong> to generate real-time SHAP attributions, DiCE approval roadmaps, and full audit logs.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-mono-tech text-slate-500">
                <span className="px-2.5 py-1 rounded bg-[#0a0e17] border border-[#1e2a3d]">XGBOOST 0.9658 AUC</span>
                <span className="px-2.5 py-1 rounded bg-[#0a0e17] border border-[#1e2a3d]">SHAP TREE EXPLAINER</span>
                <span className="px-2.5 py-1 rounded bg-[#0a0e17] border border-[#1e2a3d]">DiCE COUNTERFACTUALS</span>
                <span className="px-2.5 py-1 rounded bg-[#0a0e17] border border-[#1e2a3d]">CONFORMAL QUANTIFICATION</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Approval Probability Hero Banner */}
              <div className="cyber-card-glow p-6 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase tracking-widest block mb-1">
                      ESTIMATED APPROVAL PROBABILITY
                    </span>
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                      {(result.approval_probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs font-mono-tech text-slate-400 mt-1">
                      Target Lender: <strong className="text-white">{result.bank_recommendations?.[0]?.bank_name || 'Apex National Bank'}</strong>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-2">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono-tech font-bold border ${
                        result.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        result.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {result.risk_tier} — {result.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono-tech text-slate-400">
                      Application ID: <strong className="text-[#d2ff00]">#{result.application_id}</strong>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-5 h-3 bg-[#0a0e17] rounded-full overflow-hidden p-0.5 border border-[#1e2a3d]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.approval_probability * 100).toFixed(1)}%` }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-lg ${
                      result.approval_probability >= 0.7 ? 'bg-[#d2ff00] shadow-[0_0_20px_rgba(210,255,0,0.5)]' :
                      result.approval_probability >= 0.4 ? 'bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
                      'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                    }`}
                  />
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1e2a3d] text-xs font-mono-tech">
                {[
                  { id: 'overview', label: 'PARETO & SHAP', icon: Layers },
                  { id: 'coach', label: 'AI COACH & TTS', icon: Sparkles },
                  { id: 'ocr', label: 'OCR FRAUD RADAR', icon: FileCheck },
                  { id: 'openbanking', label: 'OPEN BANKING', icon: Landmark },
                  { id: 'stresstest', label: 'MACRO STRESS', icon: TrendingDown },
                  { id: 'conformal', label: 'CONFORMAL BOUNDS', icon: Gauge },
                  { id: 'causal', label: 'CAUSAL DAG', icon: GitCommit },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'stresstest' && !stressResult) handleRunStressTest();
                        if (tab.id === 'causal' && !causalResult) handleRunCausalRecourse();
                        if (tab.id === 'conformal' && !conformalResult) fetchConformal();
                      }}
                      className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.2)]'
                          : 'bg-[#121824] text-slate-400 border border-[#1e2a3d] hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Multi-Bank Pareto & SHAP / DiCE */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  
                  {/* Multi-Bank Recommendations */}
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#d2ff00]" /> Multi-Lender Pareto Approval Frontier
                      </h4>
                      <span className="text-[10px] font-mono-tech text-slate-500">ML-PAF ENGINE</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {result.bank_recommendations?.map((bank, i) => (
                        <div 
                          key={i}
                          className="bg-[#0a0e17] p-3.5 rounded-xl border border-[#1e2a3d] hover:border-[#d2ff00]/40 transition-all space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-xs text-white">{bank.bank_name}</div>
                            <span className={`text-[9px] font-mono-tech px-1.5 py-0.5 rounded font-bold ${
                              bank.status === 'RECOMMENDED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {bank.match_score}% Match
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 space-y-1 font-mono-tech">
                            <div className="flex justify-between">
                              <span>Interest Rate:</span>
                              <strong className="text-white">{bank.base_interest_rate}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Est. Monthly EMI:</span>
                              <strong className="text-[#d2ff00]">${bank.estimated_monthly_emi}</strong>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 font-light border-t border-[#1e2a3d] pt-1.5">
                            {bank.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SHAP Feature Importance */}
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-[#d2ff00]" /> Local SHAP Attribution Analysis
                      </h4>
                      <span className="text-[10px] font-mono-tech text-slate-500">TREE EXPLAINER</span>
                    </div>

                    <div className="space-y-3">
                      {result.shap_explanation?.top_features?.map((feat, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-mono-tech">
                            <span className="text-slate-300 font-medium">{feat.feature}</span>
                            <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {feat.impact === 'POSITIVE' ? '+' : ''}{feat.shap_value} ({feat.impact})
                            </span>
                          </div>

                          <div className="h-2 w-full bg-[#0a0e17] rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${Math.min(Math.abs(feat.shap_value) * 120, 100)}%` }}
                              className={`h-full rounded-full ${feat.impact === 'POSITIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DiCE Counterfactual Phased Approval Roadmap */}
                  {result.dice_roadmap?.roadmap_steps?.length > 0 && (
                    <div className="cyber-card p-5 bg-[#121824] border-[#d2ff00]/40 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                        <h4 className="font-bold text-[#d2ff00] text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#d2ff00]" /> DiCE Feasible Counterfactual Recourse
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">AFRO-DICE OPTIMIZER</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {result.dice_roadmap.roadmap_steps[0]?.changes?.map((change, cIdx) => (
                          <div 
                            key={cIdx}
                            className="bg-[#0a0e17] p-3 rounded-lg border border-[#1e2a3d] text-xs font-mono-tech flex flex-col justify-between"
                          >
                            <span className="text-slate-400 text-[11px] uppercase">{change.feature || change.action}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-slate-500">Current: {change.original_value}</span>
                              <span className="text-[#d2ff00] font-bold">Target: {change.target_value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Tab 2: AI Financial Coach (LLM) */}
              {activeTab === 'coach' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    {/* Header & Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-[#d2ff00]" /> Conversational AI Financial Coach
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">LLM-POWERED EXPLAINABILITY ENGINE</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <select
                          value={coachLanguage}
                          onChange={(e) => {
                            setCoachLanguage(e.target.value);
                            fetchCoachAdvice();
                          }}
                          className="cyber-input text-xs py-1 px-2.5 w-auto"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish (Español)</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="French">French (Français)</option>
                          <option value="German">German (Deutsch)</option>
                        </select>

                        {/* Regenerate Button */}
                        <button
                          onClick={() => fetchCoachAdvice()}
                          disabled={coachLoading}
                          className="btn-dark-outline text-xs py-1 px-2.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${coachLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {coachLoading ? (
                      <div className="p-8 text-center text-slate-400 font-mono-tech text-xs flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#d2ff00]" /> Synthesizing personalized financial roadmap...
                      </div>
                    ) : coachData ? (
                      <div className="space-y-4">
                        
                        {/* Executive Summary Card */}
                        <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2">
                          <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase">EXECUTIVE ADVISOR SUMMARY</span>
                          <p className="text-sm text-slate-200 leading-relaxed font-sans">
                            {coachData.executive_summary}
                          </p>
                        </div>

                        {/* Interactive TTS Audio Player Bar */}
                        <div className="bg-[#101926] p-3.5 rounded-xl border border-[#d2ff00]/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleToggleSpeech}
                              className="w-9 h-9 rounded-full bg-[#d2ff00] text-black flex items-center justify-center font-bold shadow-[0_0_12px_rgba(210,255,0,0.3)] cursor-pointer"
                            >
                              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </motion.button>
                            <div>
                              <span className="text-xs font-bold text-white block">AI Voice Narration Script</span>
                              <span className="text-[10px] font-mono-tech text-slate-400">
                                {isPlayingAudio ? "Speaking via Web Speech synthesis..." : "Click play to listen to conversational audio walkthrough"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPlayingAudio && (
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-3 bg-[#d2ff00] animate-pulse rounded-full" />
                                <span className="w-1 h-5 bg-[#d2ff00] animate-pulse delay-100 rounded-full" />
                                <span className="w-1 h-2 bg-[#d2ff00] animate-pulse delay-200 rounded-full" />
                              </div>
                            )}
                            <Volume2 className="w-4 h-4 text-[#d2ff00]" />
                          </div>
                        </div>

                        {/* Strengths & Bottlenecks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-[#0a0e17] p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
                            <span className="text-[10px] font-mono-tech text-emerald-400 font-bold flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" /> KEY FINANCIAL STRENGTHS
                            </span>
                            <ul className="text-xs text-slate-300 space-y-1 font-light list-disc list-inside">
                              {coachData.key_strengths?.map((str, idx) => (
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-[#0a0e17] p-3.5 rounded-xl border border-rose-500/20 space-y-2">
                            <span className="text-[10px] font-mono-tech text-rose-400 font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> IDENTIFIED RISK BOTTLENECKS
                            </span>
                            <ul className="text-xs text-slate-300 space-y-1 font-light list-disc list-inside">
                              {coachData.risk_bottlenecks?.map((bot, idx) => (
                                <li key={idx}>{bot}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 30-90-180 Day Phased Milestones */}
                        <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                          <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase">30-90-180 DAY ACTION ROADMAP</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-tech">
                            <div className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d]">
                              <span className="text-[#d2ff00] font-bold block mb-1">Phase 1 (Day 1-30)</span>
                              <p className="text-slate-300 text-[11px] font-sans font-light">{coachData.action_milestones?.phase_1_30_days}</p>
                            </div>
                            <div className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d]">
                              <span className="text-[#d2ff00] font-bold block mb-1">Phase 2 (Day 31-90)</span>
                              <p className="text-slate-300 text-[11px] font-sans font-light">{coachData.action_milestones?.phase_2_90_days}</p>
                            </div>
                            <div className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d]">
                              <span className="text-[#d2ff00] font-bold block mb-1">Phase 3 (Day 91-180)</span>
                              <p className="text-slate-300 text-[11px] font-sans font-light">{coachData.action_milestones?.phase_3_180_days}</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 font-mono-tech text-xs">
                        Click "Regenerate" to generate AI coach advice.
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 3: OCR Document Verification & Fraud Radar */}
              {activeTab === 'ocr' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-[#d2ff00]" /> OCR Document Income & Fraud Radar
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">PAYSTUB & TAX FORM DISCREPANCY VERIFIER</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">OPTICAL EXTRACTION</span>
                    </div>

                    {/* Upload / Test Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Document Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="cyber-input text-xs"
                        >
                          <option value="PAY_SLIP">Pay Slip / Salary Slip</option>
                          <option value="TAX_FORM_16">Tax Form 16 / W-2</option>
                          <option value="BANK_STATEMENT">Bank Statement</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Sample Document</label>
                        <select
                          value={docFileName}
                          onChange={(e) => setDocFileName(e.target.value)}
                          className="cyber-input text-xs"
                        >
                          <option value="Google_Paystub_Nov2026.pdf">Google LLC Paystub (Verified)</option>
                          <option value="Freelance_1099_Audit.pdf">1099 Freelance Form (Minor Delta)</option>
                          <option value="Altered_Fabricated_Stub.pdf">Altered Paystub (Fraud Suspect)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Declared Monthly ($)</label>
                        <input
                          type="number"
                          value={declaredIncome}
                          onChange={(e) => setDeclaredIncome(parseFloat(e.target.value) || 0)}
                          className="cyber-input text-xs"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUploadDocument}
                      disabled={ocrLoading}
                      className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                    >
                      {ocrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      RUN OCR EXTRACTION & FRAUD AUDIT
                    </motion.button>

                    {/* OCR Output */}
                    {ocrResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">VERIFICATION RESULTS</span>
                          <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold border ${
                            ocrResult.verification_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            ocrResult.verification_status === 'SUSPECT_MISMATCH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {ocrResult.verification_status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">DECLARED MONTHLY</span>
                            <span className="text-white font-bold">${ocrResult.declared_monthly_income?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">OCR EXTRACTED</span>
                            <span className="text-[#d2ff00] font-bold">${ocrResult.extracted_monthly_income?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">DISCREPANCY</span>
                            <span className={`font-bold ${ocrResult.discrepancy_ratio > 0.1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {ocrResult.discrepancy_percentage}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">FRAUD RISK SCORE</span>
                            <span className="text-amber-400 font-bold">{Math.round(ocrResult.fraud_risk_score * 100)} / 100</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 font-light border-t border-[#1e2a3d] pt-2">
                          <strong className="text-slate-300 font-mono-tech">Audit Notes:</strong> {ocrResult.audit_notes}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 4: Open Banking / Plaid Real-Time Cashflow */}
              {activeTab === 'openbanking' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-[#d2ff00]" /> Open Banking Real-Time Cashflow Intelligence
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">DIRECT API FINANCIAL FEED & DSCR METRICS</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">SECURE PLAID LINK</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Select Financial Institution</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="cyber-input text-xs"
                        >
                          <option value="Chase Bank">JPMorgan Chase Bank, N.A.</option>
                          <option value="Bank of America">Bank of America</option>
                          <option value="Wells Fargo">Wells Fargo</option>
                          <option value="Barclays">Barclays Financial</option>
                          <option value="HDFC Bank">HDFC Bank Global</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConnectOpenBanking}
                          disabled={openBankingLoading}
                          className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                        >
                          {openBankingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                          CONNECT LIVE BANK FEED
                        </motion.button>
                      </div>
                    </div>

                    {openBankingResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">
                            FEED: {selectedBank} ({openBankingResult.account_number_mask})
                          </span>
                          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            GRADE: {openBankingResult.cashflow_quality_grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">AVG MONTHLY INFLOW</span>
                            <span className="text-emerald-400 font-bold">${openBankingResult.avg_monthly_inflow?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">AVG MONTHLY OUTFLOW</span>
                            <span className="text-rose-400 font-bold">${openBankingResult.avg_monthly_outflow?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">FREE CASH FLOW</span>
                            <span className="text-[#d2ff00] font-bold">${openBankingResult.monthly_free_cashflow?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">DSCR COVERAGE</span>
                            <span className="text-white font-bold">{openBankingResult.debt_service_coverage_ratio}x</span>
                          </div>
                        </div>

                        <div className="bg-[#121824] p-3 rounded-lg border border-[#1e2a3d] flex items-center justify-between text-xs font-mono-tech">
                          <span className="text-slate-400">Salary Credit Stability Index:</span>
                          <span className="text-[#d2ff00] font-bold">{(openBankingResult.salary_credit_stability_index * 100).toFixed(1)}% ({openBankingResult.salary_credit_stability_index} / 1.0) — Consistent Deposit History</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 5: Macroeconomic Stress Testing */}
              {activeTab === 'stresstest' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-[#d2ff00]" /> Macroeconomic Shock & Portfolio Resilience
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">INTEREST RATE, INFLATION & RECESSION SIMULATOR</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-amber-400">SHOCK DYNAMICS</span>
                    </div>

                    {/* Scenario Selector & Custom Sliders */}
                    <div className="space-y-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Pre-Packaged Macro Shock Scenario</label>
                        <select
                          value={stressScenario}
                          onChange={(e) => {
                            const sc = e.target.value;
                            setStressScenario(sc);
                            if (sc === 'RATE_HIKE_200BPS') { setRateHike(2.0); setInflationCost(1.0); setIncomeShock(0.0); }
                            if (sc === 'INFLATION_SURGE_500BPS') { setRateHike(1.0); setInflationCost(5.0); setIncomeShock(5.0); }
                            if (sc === 'INCOME_SHOCK_15PCT') { setRateHike(0.0); setInflationCost(2.0); setIncomeShock(15.0); }
                            if (sc === 'COMBINED_STAGFLATION') { setRateHike(3.0); setInflationCost(8.0); setIncomeShock(10.0); }
                          }}
                          className="cyber-input text-xs"
                        >
                          <option value="COMBINED_STAGFLATION">Severe Stagflation (+3% Rate, +8% Inflation, -10% Income)</option>
                          <option value="RATE_HIKE_200BPS">Central Bank Rate Hike (+200 bps / +2.0%)</option>
                          <option value="INFLATION_SURGE_500BPS">Cost-of-Living Surge (+500 bps / +5.0%)</option>
                          <option value="INCOME_SHOCK_15PCT">Disposable Income Contraction (-15%)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs font-mono-tech pt-1">
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Rate Delta</span>
                            <span className="text-[#d2ff00]">+{rateHike}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="8" step="0.5" 
                            value={rateHike} 
                            onChange={(e) => setRateHike(parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-[#121824] rounded cursor-pointer accent-[#d2ff00]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Inflation Delta</span>
                            <span className="text-[#d2ff00]">+{inflationCost}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="15" step="0.5" 
                            value={inflationCost} 
                            onChange={(e) => setInflationCost(parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-[#121824] rounded cursor-pointer accent-[#d2ff00]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Income Shock</span>
                            <span className="text-[#d2ff00]">-{incomeShock}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="30" step="1" 
                            value={incomeShock} 
                            onChange={(e) => setIncomeShock(parseFloat(e.target.value))} 
                            className="w-full h-1.5 bg-[#121824] rounded cursor-pointer accent-[#d2ff00]"
                          />
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRunStressTest}
                      disabled={stressLoading}
                      className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                    >
                      {stressLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                      SIMULATE MACROECONOMIC SHOCK
                    </motion.button>

                    {stressResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">STRESSED OUTCOME SUMMARY</span>
                          <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold border ${
                            stressResult.resilience_grade === 'HIGHLY_RESILIENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            stressResult.resilience_grade === 'MODERATE_VULNERABILITY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {stressResult.resilience_grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">BASELINE PROBABILITY</span>
                            <span className="text-white font-bold">{Math.round(stressResult.baseline_approval_probability * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">STRESSED PROBABILITY</span>
                            <span className="text-amber-400 font-bold">{Math.round(stressResult.stressed_approval_probability * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">STRESSED DTI</span>
                            <span className="text-rose-400 font-bold">{Math.round(stressResult.stressed_dti * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">BUFFER MARGIN</span>
                            <span className="text-[#d2ff00] font-bold">${stressResult.buffer_margin_monthly?.toLocaleString()}/mo</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 6: Conformal Prediction & Epistemic Uncertainty */}
              {activeTab === 'conformal' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-[#d2ff00]" /> Conformal Uncertainty Quantification
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">FINITE-SAMPLE COVERAGE GUARANTEES (\Gamma^\alpha)</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">NON-PARAMETRIC</span>
                    </div>

                    {/* Confidence Slider */}
                    <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2">
                      <div className="flex justify-between text-xs font-mono-tech">
                        <span className="text-slate-300 font-medium">Confidence Level (1 - \alpha)</span>
                        <span className="text-[#d2ff00] font-bold">{(confidenceLevel * 100).toFixed(0)}% Certainty Guarantee</span>
                      </div>
                      <input 
                        type="range" min="0.80" max="0.99" step="0.01" 
                        value={confidenceLevel} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setConfidenceLevel(val);
                          fetchConformal();
                        }}
                        className="w-full h-2 bg-[#121824] rounded-lg cursor-pointer accent-[#d2ff00]"
                      />
                      <div className="flex justify-between text-[10px] font-mono-tech text-slate-500">
                        <span>80% Confidence</span>
                        <span>90% Standard</span>
                        <span>95% High (Basel III)</span>
                        <span>99% Maximum</span>
                      </div>
                    </div>

                    {conformalResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">PREDICTION SET: \Gamma^{Math.round(confidenceLevel * 100)}</span>
                          <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold border ${
                            conformalResult.epistemic_uncertainty === 'LOW_UNCERTAINTY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            conformalResult.epistemic_uncertainty === 'MODERATE_AMBIGUITY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {conformalResult.epistemic_uncertainty}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">PREDICTION SET SIZE</span>
                            <span className="text-white font-bold">{conformalResult.prediction_set_size} ({conformalResult.prediction_set?.join(', ')})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">CALIBRATED COVERAGE</span>
                            <span className="text-[#d2ff00] font-bold">{(conformalResult.coverage_guarantee * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">NONCONFORMITY SCORE</span>
                            <span className="text-slate-300 font-bold">{conformalResult.nonconformity_score}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">DECISION RELIABILITY</span>
                            <span className="text-emerald-400 font-bold">{conformalResult.decision_reliability}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 font-light border-t border-[#1e2a3d] pt-2">
                          <strong className="text-slate-300 font-mono-tech">Mathematical Guarantee:</strong> Under exchangeability, the true label lies inside \Gamma^\alpha with probability at least {(confidenceLevel * 100).toFixed(0)}%.
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 7: Causal Recourse & Structural DAG */}
              {activeTab === 'causal' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-[#d2ff00]" /> Causal Recourse along Structural DAG
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">TEMPORAL LAG & ENDOGENOUS FEATURE PROPAGATION</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">CAUSAL SCM</span>
                    </div>

                    <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono-tech">STRUCTURAL MECHANISM CASCADE</span>
                        <span className="text-[10px] font-mono-tech text-slate-400">Max Horizon: 180 Days</span>
                      </div>

                      {causalLoading ? (
                        <div className="p-8 text-center text-slate-400 font-mono-tech text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#d2ff00]" />
                          Traversing causal DAG pathways...
                        </div>
                      ) : causalResult ? (
                        <div className="space-y-3">
                          {causalResult.phases?.map((ph, idx) => (
                            <div key={idx} className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d] space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-[#d2ff00] font-mono-tech">
                                  {ph.phase_name} ({ph.time_window_days} Days)
                                </span>
                                <span className="text-[10px] font-mono-tech text-emerald-400 font-bold">
                                  Projected Approval: {(ph.projected_approval_prob * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-light font-sans">{ph.description}</p>
                              <div className="text-[11px] font-mono-tech text-slate-400 bg-[#0a0e17] p-2 rounded border border-[#1e2a3d]">
                                Action: <strong className="text-white">{ph.action_item}</strong> (Lag: {ph.bureau_reporting_lag_days} days)
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button onClick={handleRunCausalRecourse} className="btn-dark-outline text-xs w-full justify-center cursor-pointer">
                          Generate Causal DAG Recourse Trajectory
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
