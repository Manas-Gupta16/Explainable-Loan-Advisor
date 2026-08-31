import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Send, ShieldCheck, AlertTriangle, CheckCircle,
  RefreshCw, Layers, MapPin, PieChart, Sparkles,
  FileText, Download, Play, Pause, Volume2, Landmark,
  TrendingDown, Gauge, FileCheck, BrainCircuit, GitCommit, UserCheck, CheckCircle2,
  Wheat, Edit3, ChevronDown, ChevronUp, Radio, HelpCircle, ArrowRight, Sliders, Globe, User
} from 'lucide-react';
import BorrowerProfileModal from './BorrowerProfileModal';
import VoiceGuideModal from './VoiceGuideModal';
import { TRANSLATIONS } from '../utils/i18n';


const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const formatMonthlyINR = (annualVal) => {
  const monthly = Math.round((annualVal || 0) / 12);
  return `₹${monthly.toLocaleString('en-IN')}/mo`;
};

const DEFAULT_INITIAL_LOAN = {
  cibil_score: 710,
  applicant_income: 456000, // ₹38k/mo
  coapplicant_income: 0,
  loan_amount: 250000, // ₹2.5 Lakhs
  loan_tenure_months: 24,
  existing_debts: 48000, // ₹4.0k/mo
  credit_card_utilization: 0.18,
  delinquent_lines_2yrs: 0,
  credit_history_years: 4.0,
  employment_status: 'Farmer / Agriculture',
  education: 'Undergraduate',
  home_ownership: 'OWN',
  loan_purpose: 'Kisan Agri Crop / Seeds',
  repayment_cycle: 'HARVEST_BIANNUAL_BULLET'
};

export default function CustomerPortal({ currentUser, onOpenProfile }) {
  const [formData, setFormData] = useState(DEFAULT_INITIAL_LOAN);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Single-Language Pure Mode state (hi, mr, en, gu)
  const [uiLang, setUiLang] = useState('hi');
  const t = TRANSLATIONS[uiLang] || TRANSLATIONS.hi;

  // Profile Persistence & Voice Guide Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [userProfile, setUserProfile] = useState({
    full_name: currentUser?.full_name || (uiLang === 'hi' ? "नया आवेदक / किसान" : "New Applicant / Farmer"),
    monthly_income: currentUser?.monthly_income || 35000,
    employment_type: currentUser?.employment_type || "Farmer / Agriculture",
    agri_land_acres: currentUser?.agri_land_acres || 3.0,
    kcc_holder: true,
    coapplicant_income: 0,
    existing_debts_monthly: 4500,
    cibil_score: 700,
    home_ownership: "Owned - Ancestral / Pucca",
    preferred_language: currentUser?.preferred_language || "hi",
    phone_number: currentUser?.phone_number || ""
  });

  // AI Coach state
  const [coachLanguage, setCoachLanguage] = useState('Hindi');


  const [coachData, setCoachData] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // OCR state
  const [docType, setDocType] = useState('PAY_SLIP');
  const [docFileName, setDocFileName] = useState('TCS_Salary_Slip_Form16.pdf');
  const [declaredIncome, setDeclaredIncome] = useState(formData.applicant_income / 12);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFile, setOcrFile] = useState(null);

  // Account Aggregator (AA) state
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');
  const [openBankingResult, setOpenBankingResult] = useState(null);
  const [openBankingLoading, setOpenBankingLoading] = useState(false);

  // Stress Test state
  const [stressScenario, setStressScenario] = useState('COMBINED_STAGFLATION');
  const [rateHike, setRateHike] = useState(2.0);
  const [inflationCost, setInflationCost] = useState(6.0);
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

  // Derived live calculations for real-time form feedback
  const monthlyApplicantIncome = Math.max(formData.applicant_income / 12, 1);
  const totalMonthlyIncome = Math.max((formData.applicant_income + formData.coapplicant_income) / 12, 1);
  const existingMonthlyEMI = formData.existing_debts / 12;

  // Benchmark EMI at 10.5% rate
  const benchmarkRate = 10.5 / (12 * 100);
  const tenureN = formData.loan_tenure_months || 36;
  const factorN = Math.pow(1 + benchmarkRate, tenureN);
  const estimatedProposedEMI = factorN > 1 ? (formData.loan_amount * benchmarkRate * factorN) / (factorN - 1) : formData.loan_amount / tenureN;
  const liveTotalObligations = existingMonthlyEMI + estimatedProposedEMI;
  const liveFOIR = Math.round((liveTotalObligations / totalMonthlyIncome) * 100);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const evaluateApplication = async (dataToSubmit = formData, isRetry = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/v1/customer/apply', dataToSubmit);
      setResult(response.data);
      // Auto trigger coach & conformal preview
      fetchCoachAdvice(response.data, dataToSubmit);
      fetchConformal(response.data, dataToSubmit);
    } catch (err) {
      console.error("Evaluation error:", err);
      if (!isRetry) {
        setTimeout(() => {
          evaluateApplication(dataToSubmit, true);
        }, 1500);
      } else {
        const detail = err.response?.data?.detail || err.message || 'Network connection failed';
        setError(`Evaluation failed: ${detail}. Ensure backend is running at http://127.0.0.1:8000.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    evaluateApplication(formData);
  };

  // Update profile and form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserProfile(prev => ({
        ...prev,
        full_name: currentUser.full_name || prev.full_name,
        monthly_income: currentUser.monthly_income || prev.monthly_income,
        employment_type: currentUser.employment_type || prev.employment_type,
        agri_land_acres: currentUser.agri_land_acres !== undefined ? currentUser.agri_land_acres : prev.agri_land_acres,
        preferred_language: currentUser.preferred_language || prev.preferred_language
      }));
      setFormData(prev => ({
        ...prev,
        applicant_income: (currentUser.monthly_income || 38000) * 12,
        employment_status: currentUser.employment_type || prev.employment_status,
      }));
    }
  }, [currentUser]);

  // Initial mount auto-evaluation & conditional profile fetch
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('loaniq_token');
      if (token && currentUser) {
        try {
          const res = await axios.get('/api/v1/auth/profile');
          if (res.data) {
            setUserProfile(res.data);
            setFormData(prev => ({
              ...prev,
              cibil_score: res.data.cibil_score,
              applicant_income: res.data.monthly_income * 12,
              coapplicant_income: (res.data.coapplicant_income || 0) * 12,
              existing_debts: (res.data.existing_debts_monthly || 0) * 12,
              employment_status: res.data.employment_type
            }));
          }
        } catch (err) {
          console.log("Profile fetch notice:", err.message);
        }
      }
    };
    fetchProfile();
    evaluateApplication(DEFAULT_INITIAL_LOAN);
  }, [currentUser]);

  const handleSaveProfile = (newProfile) => {
    setUserProfile(newProfile);
    const updated = {
      ...formData,
      cibil_score: newProfile.cibil_score,
      applicant_income: newProfile.monthly_income * 12,
      coapplicant_income: (newProfile.coapplicant_income || 0) * 12,
      existing_debts: (newProfile.existing_debts_monthly || 0) * 12,
      employment_status: newProfile.employment_type,
      home_ownership: newProfile.home_ownership?.includes('Pucca') || newProfile.home_ownership?.includes('Owned') ? 'OWN' : 'RENT'
    };
    setFormData(updated);
    evaluateApplication(updated);
  };

  // 1. Fetch AI Coach
  const fetchCoachAdvice = async (customResult, currentForm = formData) => {
    const curResult = customResult || result;
    setCoachLoading(true);
    try {
      const langCodeMap = {
        'Hindi': 'hi',
        'Marathi': 'mr',
        'Gujarati': 'gu',
        'Bengali': 'bn',
        'Tamil': 'ta',
        'Telugu': 'te',
        'English': 'en',
        'Hinglish': 'hinglish'
      };
      const payload = {
        applicant_name: userProfile?.full_name || "Valued Borrower",
        language: langCodeMap[coachLanguage] || 'hi',
        application_id: curResult?.application_id || null,
        loan_input: currentForm,
        shap_data: curResult?.shap_explanation || null,
        dice_data: curResult?.dice_roadmap || null,
        bank_recommendations: curResult?.bank_recommendations || null,
        approval_probability: curResult?.approval_probability || null,
        risk_tier: curResult?.risk_tier || null,
        status: curResult?.status || null
      };
      const res = await axios.post('/api/v1/customer/coach-advice', payload);
      setCoachData(res.data);
    } catch (err) {
      console.error("Error fetching AI Coach advice:", err);

    } finally {
      setCoachLoading(false);
    }
  };

  const coachAudioRef = useRef(null);

  // 2. Play Coach Voice Audio using backend gTTS stream
  const handleToggleSpeech = async () => {
    if (!coachData?.conversational_audio_script) return;

    if (isPlayingAudio) {
      if (coachAudioRef.current) {
        coachAudioRef.current.pause();
        coachAudioRef.current.src = "";
        coachAudioRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      const langCodeMap = {
        'Hindi': 'hi',
        'Marathi': 'mr',
        'Gujarati': 'gu',
        'Bengali': 'bn',
        'Tamil': 'ta',
        'Telugu': 'te',
        'English': 'en',
        'Hinglish': 'hinglish'
      };
      const code = langCodeMap[coachLanguage] || 'hi';

      try {
        const res = await axios.post('/api/v1/customer/voice-audio', {
          text: coachData.conversational_audio_script,
          lang: code
        }, {
          responseType: 'blob',
          timeout: 15000
        });

        const blobUrl = URL.createObjectURL(res.data);
        const audio = new Audio(blobUrl);
        coachAudioRef.current = audio;

        audio.onplaying = () => setIsPlayingAudio(true);
        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(blobUrl);
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(blobUrl);
        };

        await audio.play();
      } catch (err) {
        console.warn("Coach audio error:", err);
        setIsPlayingAudio(false);
      }
    }
  };



  // 3. OCR Document Upload Simulation -> Real OCR
  const handleUploadDocument = async () => {
    if (!ocrFile) {
      alert("Please upload an image (PNG/JPG) of the document first.");
      return;
    }
    
    setOcrLoading(true);
    try {
      const appId = result?.application_id || 1;
      const formDataUpload = new FormData();
      formDataUpload.append('document_type', docType);
      formDataUpload.append('file', ocrFile);

      const res = await axios.post(`/api/v1/customer/upload-document-image/${appId}`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setOcrResult(res.data);
    } catch (err) {
      console.error("OCR Document verification error:", err);
      alert("Error processing document. Ensure backend is running and EasyOCR models are downloaded.");
    } finally {
      setOcrLoading(false);
    }
  };

  // 4. Connect Account Aggregator
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
      console.error("Account Aggregator connection error:", err);
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
  const fetchConformal = async (customResult, currentForm = formData) => {
    try {
      const res = await axios.post('/api/v1/customer/conformal-predict', {
        application_id: customResult?.application_id || result?.application_id || null,
        loan_input: currentForm,
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

  // 8. Download RBI Compliance PDF Dossier
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
      link.setAttribute('download', `LoanIQ_RBI_Compliance_Dossier_App_${appId}.pdf`);
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
            <span>● {t.badge}</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {t.title_main} <span className="text-[#d2ff00]">{t.title_highlight}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
            {t.subtitle}
          </p>
        </div>

        {/* Action Controls: Language Switcher, Voice Guide & PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher (Single-Language Pure Mode) */}
          <div className="flex items-center gap-1 bg-[#121824] border border-[#1e2a3d] p-1 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono-tech pl-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#d2ff00]" />
            </span>
            {[
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' },
              { code: 'gu', label: 'ગુજરાતી' },
              { code: 'bn', label: 'বাংলা' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'te', label: 'తెలుగు' },
              { code: 'en', label: 'English' }
            ].map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setUiLang(code);
                  setUserProfile(prev => ({ ...prev, preferred_language: code }));
                  const map = {
                    hi: 'Hindi',
                    mr: 'Marathi',
                    gu: 'Gujarati',
                    bn: 'Bengali',
                    ta: 'Tamil',
                    te: 'Telugu',
                    en: 'English'
                  };
                  setCoachLanguage(map[code] || 'Hindi');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-tech font-bold transition-all cursor-pointer ${
                  uiLang === code
                    ? 'bg-[#d2ff00] text-black shadow-[0_0_10px_rgba(210,255,0,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>


          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsVoiceGuideOpen(true)}
            className="bg-[#121824] hover:bg-[#1a2336] text-[#d2ff00] border border-[#d2ff00]/40 text-xs font-bold py-2 px-3 rounded-xl shadow-[0_0_15px_rgba(210,255,0,0.15)] cursor-pointer flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-[#d2ff00] animate-pulse" />
            <span>{t.voice_guide_btn}</span>
          </motion.button>

          {result && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="btn-lime text-xs font-bold py-2 px-3.5 shadow-[0_0_15px_rgba(210,255,0,0.25)] cursor-pointer flex items-center gap-2"
            >
              {pdfDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{t.export_pdf}</span>
            </motion.button>
          )}
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
            
            {/* Verified Borrower Profile Banner (Eliminates redundant inputs) */}
            <div className="bg-[#0a0e17] p-3.5 rounded-xl border border-[#1e2a3d] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#d2ff00]/10 text-[#d2ff00] border border-[#d2ff00]/30 flex items-center justify-center text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {userProfile.full_name}
                      <span className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {userProfile.employment_type}
                      </span>
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProfile ? onOpenProfile() : setIsProfileModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#162030] hover:bg-[#1f2c42] text-[#d2ff00] text-[10px] font-mono-tech font-bold border border-[#d2ff00]/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> {t.edit_profile}
                </button>
              </div>

              {/* Profile Details Pills */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-tech bg-[#121824] p-2 rounded-lg border border-[#1e2a3d]/60">
                <div>
                  <span className="text-slate-400 block text-[9px]">{t.income}</span>
                  <span className="text-white font-bold">{formatINR(userProfile.monthly_income)}/mo</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">{t.cibil}</span>
                  <span className="text-[#d2ff00] font-bold">{formData.cibil_score}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">{t.land_kcc}</span>
                  <span className="text-emerald-400 font-bold">{userProfile.agri_land_acres} Ac ({t.kcc_sub_pill})</span>
                </div>
              </div>
            </div>

            {/* Live Affordability Banner */}
            <div className="bg-[#0a0e17] p-3 rounded-xl border border-[#1e2a3d] grid grid-cols-2 gap-2 text-xs font-mono-tech">
              <div>
                <span className="text-slate-400 text-[10px] block">{t.est_repayment}</span>
                <span className="text-[#d2ff00] font-bold">
                  ₹{Math.round(estimatedProposedEMI).toLocaleString('en-IN')}/mo
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {formData.repayment_cycle === 'HARVEST_BIANNUAL_BULLET' ? t.post_harvest_note : t.monthly_emi_note}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{t.proposed_foir}</span>
                <span className={`font-bold ${liveFOIR <= 45 ? 'text-emerald-400' : liveFOIR <= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {liveFOIR}% {liveFOIR <= 45 ? t.prime_tier : liveFOIR <= 60 ? t.kcc_eligible_tier : t.high_risk_tier}
                </span>
              </div>
            </div>

            {/* 1. Loan Purpose (Single-Language Pure Mode) */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                {t.loan_purpose_label}
              </label>
              <select
                name="loan_purpose"
                value={formData.loan_purpose}
                onChange={handleChange}
                className="cyber-input text-xs"
              >
                <option value="Kisan Agri Crop / Seeds">{t.purposes["Kisan Agri Crop / Seeds"]}</option>
                <option value="Tractor & Farm Equipment">{t.purposes["Tractor & Farm Equipment"]}</option>
                <option value="Dairy & Livestock">{t.purposes["Dairy & Livestock"]}</option>
                <option value="Village Kirana / Rural MSME">{t.purposes["Village Kirana / Rural MSME"]}</option>
                <option value="Rural Housing (PMAY-G)">{t.purposes["Rural Housing (PMAY-G)"]}</option>
                <option value="Informal Moneylender Debt-Swap">{t.purposes["Informal Moneylender Debt-Swap"]}</option>
                <option value="Personal">{t.purposes["Personal"]}</option>
              </select>
            </div>

            {/* 2. Requested Loan Amount (INR) with Quick Select Chips */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="text-slate-300 font-bold">{t.requested_loan_label}</label>
                <span className="font-mono-tech text-[#d2ff00] font-bold">{formatINR(formData.loan_amount)}</span>
              </div>
              <input
                type="number"
                name="loan_amount"
                step="10000"
                value={formData.loan_amount}
                onChange={handleChange}
                className="cyber-input text-xs font-bold"
                required
              />

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[50000, 150000, 300000, 600000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, loan_amount: amt }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-tech transition-all cursor-pointer border ${
                      formData.loan_amount === amt 
                        ? 'bg-[#d2ff00] text-black font-bold border-[#d2ff00]' 
                        : 'bg-[#0a0e17] text-slate-400 border-[#1e2a3d] hover:border-slate-500'
                    }`}
                  >
                    {formatINR(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tenure & Repayment Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">{t.tenure_label}</label>
                <select
                  name="loan_tenure_months"
                  value={formData.loan_tenure_months}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value={12}>{t.tenures[12]}</option>
                  <option value={24}>{t.tenures[24]}</option>
                  <option value={36}>{t.tenures[36]}</option>
                  <option value={60}>{t.tenures[60]}</option>
                  <option value={84}>{t.tenures[84]}</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">{t.repayment_schedule_label}</label>
                <select
                  name="repayment_cycle"
                  value={formData.repayment_cycle || 'MONTHLY_EMI'}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold text-[#d2ff00]"
                >
                  <option value="MONTHLY_EMI">{t.schedules["MONTHLY_EMI"]}</option>
                  <option value="HARVEST_BIANNUAL_BULLET">{t.schedules["HARVEST_BIANNUAL_BULLET"]}</option>
                </select>
              </div>
            </div>

            {/* 4. Advanced Financial Overrides (Expandable Accordion) */}
            <div className="border border-[#1e2a3d] rounded-xl overflow-hidden bg-[#0a0e17]">
              <button
                type="button"
                onClick={() => setShowOverrides(!showOverrides)}
                className="w-full p-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-white font-mono-tech transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#d2ff00]" /> {t.advanced_overrides}
                </span>
                {showOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOverrides && (
                <div className="p-3 border-t border-[#1e2a3d] space-y-3">
                  {/* CIBIL Slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t.cibil}</span>
                      <span className="text-[#d2ff00] font-bold">{formData.cibil_score}</span>
                    </div>
                    <input
                      type="range"
                      min="300"
                      max="850"
                      step="5"
                      name="cibil_score"
                      value={formData.cibil_score}
                      onChange={handleChange}
                      className="w-full h-1.5 bg-[#121824] rounded-lg cursor-pointer accent-[#d2ff00]"
                    />
                  </div>

                  {/* Card Utilization & Delinquencies */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">{t.card_utilization}</span>
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
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">{t.delinquent_lines}</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        name="delinquent_lines_2yrs"
                        value={formData.delinquent_lines_2yrs}
                        onChange={handleChange}
                        className="cyber-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(210,255,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-lime w-full justify-center py-3 mt-2 text-xs font-black tracking-wide cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t.evaluating_button}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> {t.eval_button}
                </span>
              )}
            </motion.button>


            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => evaluateApplication(formData, true)}
                  className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono-tech text-[10px] font-bold cursor-pointer shrink-0"
                >
                  RETRY
                </button>
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
                Evaluating application with authentic Indian banking underwriting rules...
              </p>
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
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono-tech">
                      {(result.approval_probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs font-mono-tech text-slate-300 mt-1">
                      Recommended Lender: <strong className="text-[#d2ff00]">{result.bank_recommendations?.[0]?.bank_name || 'State Bank of India (SBI)'}</strong>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-2">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono-tech font-bold border ${
                        result.fraud_flag ? 'bg-rose-900/40 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' :
                        result.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        result.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {result.fraud_flag ? "CRITICAL FRAUD ANOMALY" : `${result.risk_tier} — ${result.status}`}
                      </span>
                    </div>
                    {result.climate_risk_data && result.climate_risk_data.climate_risk_penalty > 0 && (
                      <div className="text-[10px] font-mono-tech px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block">
                        CLIMATE PENALTY APPLIED: {result.climate_risk_data.condition}
                      </div>
                    )}
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
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-lg ${
                      result.approval_probability >= 0.7 ? 'bg-[#d2ff00] shadow-[0_0_20px_rgba(210,255,0,0.5)]' :
                      result.approval_probability >= 0.45 ? 'bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
                      'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                    }`}
                  />
                </div>

                {/* Instant Top Matched Lenders Quick Grid (Visible directly at the top with NO scrolling!) */}
                {result.bank_recommendations && result.bank_recommendations.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#1e2a3d]/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono-tech text-[#d2ff00] font-bold flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" /> TOP MATCHED LENDERS (INSTANT OFFERS):
                      </span>
                      <span className="text-[10px] font-mono-tech text-slate-400">
                        {result.bank_recommendations.length} Schemes Evaluated
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {result.bank_recommendations.slice(0, 3).map((bank, idx) => (
                        <div 
                          key={idx}
                          className="bg-[#0a0e17] p-3 rounded-xl border border-[#1e2a3d] hover:border-[#d2ff00]/40 transition-all space-y-1"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate" title={bank.bank_name}>
                              {bank.bank_name.split('(')[0]}
                            </span>
                            <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                              {bank.match_score}%
                            </span>
                          </div>
                          <div className="text-[11px] font-mono-tech flex justify-between text-slate-300">
                            <span className="text-slate-400">Rate:</span>
                            <strong className="text-emerald-400">{bank.base_interest_rate}% APR</strong>
                          </div>
                          <div className="text-[11px] font-mono-tech flex justify-between text-slate-300">
                            <span className="text-slate-400">Monthly EMI:</span>
                            <strong className="text-[#d2ff00]">₹{Math.round(bank.estimated_monthly_emi).toLocaleString('en-IN')}/mo</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#1e2a3d] text-xs font-mono-tech">
                {[
                  { id: 'overview', label: t.tabs?.banks || 'INDIAN BANKS & SHAP', icon: Layers },
                  { id: 'coach', label: t.tabs?.coach || 'AI VOICE COACH', icon: Sparkles },
                  { id: 'ocr', label: t.tabs?.ocr || 'DOC OCR & KYC', icon: FileCheck },
                  { id: 'openbanking', label: t.tabs?.aa || 'ACCOUNT AGGREGATOR', icon: Landmark },
                  { id: 'stresstest', label: t.tabs?.stress || 'RBI STRESS TEST', icon: TrendingDown },
                  { id: 'conformal', label: 'CONFORMAL BOUNDS', icon: Gauge },
                  { id: 'causal', label: 'CAUSAL RECOURSE', icon: GitCommit },
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
                        <Landmark className="w-4 h-4 text-[#d2ff00]" /> Indian Banks & NBFCs Underwriting Match
                      </h4>
                      <span className="text-[10px] font-mono-tech text-slate-500">PARETO FRONTIER</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              <span>Base Interest Rate:</span>
                              <strong className="text-emerald-400">{bank.base_interest_rate}% APR</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated Monthly EMI:</span>
                              <strong className="text-[#d2ff00]">₹{bank.estimated_monthly_emi.toLocaleString('en-IN')}/mo</strong>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 font-light border-t border-[#1e2a3d] pt-1.5">
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
                            <span className="text-slate-300 font-medium">{feat.feature.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {feat.impact === 'POSITIVE' ? '+' : ''}{feat.shap_value} ({feat.impact})
                            </span>
                          </div>

                          <div className="h-2 w-full bg-[#0a0e17] rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${Math.min(Math.abs(feat.shap_value) * 100, 100)}%` }}
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
                        <span className="text-[10px] font-mono-tech text-slate-500">ACTIONABLE RECOURSE</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {result.dice_roadmap.roadmap_steps[0]?.changes?.map((change, cIdx) => (
                          <div 
                            key={cIdx}
                            className="bg-[#0a0e17] p-3 rounded-lg border border-[#1e2a3d] text-xs font-mono-tech flex flex-col justify-between"
                          >
                            <span className="text-slate-400 text-[11px] uppercase">{change.feature || change.action}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-slate-500">Current: {change.original_value !== undefined ? change.original_value : 'N/A'}</span>
                              <span className="text-[#d2ff00] font-bold">Target: {change.target_value !== undefined ? change.target_value : 'Recommended'}</span>
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
                        <span className="text-[10px] font-mono-tech text-slate-500">MULTI-LINGUAL RECOURSE ENGINE</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <select
                          value={coachLanguage}
                          onChange={(e) => {
                            setCoachLanguage(e.target.value);
                            fetchCoachAdvice();
                          }}
                          className="cyber-input text-xs py-1 px-2.5 w-auto font-mono-tech"
                        >
                          <option value="Hindi">हिंदी (Hindi)</option>
                          <option value="Marathi">मराठी (Marathi)</option>
                          <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                          <option value="Bengali">বাংলা (Bengali)</option>
                          <option value="Tamil">தமிழ் (Tamil)</option>
                          <option value="Telugu">తెలుగు (Telugu)</option>
                          <option value="English">English</option>
                          <option value="Hinglish">Hinglish</option>
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
                        <RefreshCw className="w-4 h-4 animate-spin text-[#d2ff00]" /> Synthesizing personalized Indian financial coaching roadmap...
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

                        {/* Strengths & Vulnerabilities */}
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
                              <AlertTriangle className="w-3.5 h-3.5" /> KEY VULNERABILITIES
                            </span>
                            <ul className="text-xs text-slate-300 space-y-1 font-light list-disc list-inside">
                              {coachData.key_vulnerabilities?.map((bot, idx) => (
                                <li key={idx}>{bot}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 30-90-180 Day Phased Milestones */}
                        {coachData.actionable_milestones && (
                          <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                            <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase">30-90-180 DAY ACTION ROADMAP</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-tech">
                              {coachData.actionable_milestones.map((m, idx) => (
                                <div key={idx} className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d] space-y-1">
                                  <span className="text-[#d2ff00] font-bold block">{m.phase.replace('_', ' ')}</span>
                                  <span className="text-white text-[11px] block font-bold">{m.target_metric}</span>
                                  <p className="text-slate-300 text-[11px] font-sans font-light">{m.action_instruction}</p>
                                  <span className="text-emerald-400 text-[10px] block font-bold pt-1">{m.impact_boost}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ) : null}

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
                          <FileCheck className="w-4 h-4 text-[#d2ff00]" /> Indian Document OCR & PAN Verification
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">SALARY SLIP, FORM 16 & DISCREPANCY DETECTOR</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">RBI DIGITAL LENDING AUDIT</span>
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
                          <option value="PAY_SLIP">EPFO Pay Slip / Salary Slip</option>
                          <option value="TAX_FORM_16">Form 16 / ITR-V</option>
                          <option value="BANK_STATEMENT">Bank Statement (6 Months)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Upload Document Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setOcrFile(e.target.files[0])}
                          className="cyber-input text-xs w-full cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#d2ff00] file:text-black hover:file:bg-[#b5db00]"
                        />
                        {ocrFile && <span className="text-[10px] text-emerald-400 mt-1 block truncate">Selected: {ocrFile.name}</span>}
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Declared Monthly (₹)</label>
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
                      className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer flex items-center gap-2"
                    >
                      {ocrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      RUN OCR EXTRACTION & PAN FRAUD AUDIT
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
                            <span className="text-white font-bold">₹{ocrResult.declared_monthly_income?.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">OCR EXTRACTED</span>
                            <span className="text-[#d2ff00] font-bold">₹{ocrResult.extracted_monthly_income?.toLocaleString('en-IN')}</span>
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

              {/* Tab 4: Account Aggregator (AA) Real-Time Cashflow */}
              {activeTab === 'openbanking' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-[#d2ff00]" /> RBI Sahamati Account Aggregator (AA) Telemetry
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">LIVE BANK STATEMENT ANALYZER & NACH BOUNCE DETECTOR</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">AA FRAMEWORK</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Select Financial Entity (FIP)</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="cyber-input text-xs"
                        >
                          <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                          <option value="HDFC Bank">HDFC Bank Ltd</option>
                          <option value="ICICI Bank">ICICI Bank Ltd</option>
                          <option value="Axis Bank">Axis Bank Ltd</option>
                          <option value="Bank of Baroda">Bank of Baroda</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConnectOpenBanking}
                          disabled={openBankingLoading}
                          className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer flex items-center gap-2"
                        >
                          {openBankingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                          FETCH AA STATEMENT TELEMETRY
                        </motion.button>
                      </div>
                    </div>

                    {openBankingResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-4">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">
                            FIP: {selectedBank} ({openBankingResult.account_number_mask})
                          </span>
                          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            GRADE: {openBankingResult.cashflow_quality_grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">AVG MONTHLY INFLOW</span>
                            <span className="text-emerald-400 font-bold">₹{openBankingResult.avg_monthly_inflow?.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">AVG MONTHLY OUTFLOW</span>
                            <span className="text-rose-400 font-bold">₹{openBankingResult.avg_monthly_outflow?.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">MONTHLY FREE CASHFLOW</span>
                            <span className="text-[#d2ff00] font-bold">₹{openBankingResult.monthly_free_cashflow?.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">CASHFLOW DSCR</span>
                            <span className="text-white font-bold">{openBankingResult.debt_service_coverage_ratio}x</span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d] text-xs font-mono-tech text-slate-300">
                          {openBankingResult.summary_insight}
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
                          <TrendingDown className="w-4 h-4 text-[#d2ff00]" /> RBI Macroeconomic Stress Shock Simulator
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">REPO RATE HIKES, CPI INFLATION & STAGFLATION</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">RESILIENCE RADAR</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Shock Scenario</label>
                        <select
                          value={stressScenario}
                          onChange={(e) => setStressScenario(e.target.value)}
                          className="cyber-input text-xs"
                        >
                          <option value="COMBINED_STAGFLATION">RBI Stagflation (Rate Hike + CPI Surge)</option>
                          <option value="RATE_HIKE">RBI Repo Rate Spike (+250 bps)</option>
                          <option value="INFLATION_SURGE">CPI Living Cost Inflation Surge</option>
                          <option value="INCOME_SHOCK">Macro Job Market / Salary Shock</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Repo Rate Hike (+%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={rateHike}
                          onChange={(e) => setRateHike(parseFloat(e.target.value) || 0)}
                          className="cyber-input text-xs"
                        />
                      </div>

                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleRunStressTest}
                          disabled={stressLoading}
                          className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer flex items-center gap-2"
                        >
                          {stressLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                          SIMULATE STRESS SHOCK
                        </motion.button>
                      </div>
                    </div>

                    {stressResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">STRESS SIMULATION OUTPUT</span>
                          <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold border ${
                            stressResult.resilience_grade === 'HIGHLY_RESILIENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            stressResult.resilience_grade === 'MODERATELY_VULNERABLE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {stressResult.resilience_grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">BASELINE PROB</span>
                            <span className="text-emerald-400 font-bold">{(stressResult.baseline_approval_probability * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">STRESSED PROB</span>
                            <span className="text-rose-400 font-bold">{(stressResult.stressed_approval_probability * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">PROBABILITY DROP</span>
                            <span className="text-amber-400 font-bold">-{stressResult.probability_drop_pct}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">STRESSED FOIR</span>
                            <span className="text-white font-bold">{Math.round(stressResult.stressed_dti * 100)}%</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 font-light border-t border-[#1e2a3d] pt-2 font-mono-tech">
                          {stressResult.stress_verdict_notes}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 6: Conformal Prediction */}
              {activeTab === 'conformal' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-[#d2ff00]" /> Conformal Uncertainty Bounds (ICP 95%)
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">GUARANTEED COVERAGE INTERVALS</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">EU AI ACT & RBI ALIGNED</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Target Coverage Confidence</label>
                        <select
                          value={confidenceLevel}
                          onChange={(e) => {
                            setConfidenceLevel(parseFloat(e.target.value));
                            fetchConformal();
                          }}
                          className="cyber-input text-xs"
                        >
                          <option value={0.90}>90% Confidence (Narrow Band)</option>
                          <option value={0.95}>95% Standard Statutory Confidence</option>
                          <option value={0.99}>99% Ultra-Conservative Prime Coverage</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fetchConformal()}
                          className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                        >
                          RECALCULATE CONFORMAL INTERVAL
                        </motion.button>
                      </div>
                    </div>

                    {conformalResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech">
                          <div>
                            <span className="text-slate-500 block text-[10px]">POINT PROBABILITY</span>
                            <span className="text-[#d2ff00] font-bold">{(conformalResult.point_probability * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">CONFORMAL BOUNDS</span>
                            <span className="text-white font-bold">
                              [{conformalResult.calibrated_interval?.lower_bound?.toFixed(2)}, {conformalResult.calibrated_interval?.upper_bound?.toFixed(2)}]
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">EPISTEMIC UNCERTAINTY</span>
                            <span className="text-emerald-400 font-bold">{conformalResult.metrics?.epistemic_uncertainty_score}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">TRIAGE ACTION</span>
                            <span className="text-white font-bold">{conformalResult.triage?.category}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 font-light border-t border-[#1e2a3d] pt-2 font-mono-tech">
                          {conformalResult.triage?.recommendation}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Tab 7: Causal Recourse */}
              {activeTab === 'causal' && (
                <div className="space-y-4">
                  <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-[#d2ff00]" /> Structural Causal Recourse Optimization
                        </h4>
                        <span className="text-[10px] font-mono-tech text-slate-500">DAG-CONSTRAINED ACTION PATHWAYS</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#d2ff00]">AFRO BUDGET OPTIMIZER</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRunCausalRecourse}
                      disabled={causalLoading}
                      className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer flex items-center gap-2"
                    >
                      {causalLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
                      EXECUTE CAUSAL RECOURSE OPTIMIZATION
                    </motion.button>

                    {causalResult && (
                      <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                        <div className="flex justify-between items-center border-b border-[#1e2a3d] pb-2">
                          <span className="text-xs font-bold text-white font-mono-tech">CAUSAL RECOURSE PATHWAYS</span>
                          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            FEASIBILITY: {causalResult.feasibility_grade}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {causalResult.interventions?.map((step, idx) => (
                            <div key={idx} className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d] text-xs font-mono-tech flex justify-between items-center">
                              <div>
                                <span className="text-white font-bold block">{step.target_feature}</span>
                                <span className="text-slate-400 text-[11px]">{step.action_description}</span>
                              </div>
                              <span className="text-[#d2ff00] font-bold">{step.estimated_timeframe_days} Days</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Borrower Profile Modal (Permanent Baseline Details) */}
      <BorrowerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={handleSaveProfile}
        currentLanguage={uiLang}
      />

      {/* Multi-Lingual Regional Voice Guide Modal (100% Real-Time Data Driven) */}
      <VoiceGuideModal
        isOpen={isVoiceGuideOpen}
        onClose={() => {
          setIsVoiceGuideOpen(false);
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        }}
        applicationResult={result}
        formData={formData}
        userProfile={userProfile}
        coachData={coachData}
        defaultLanguage={uiLang || userProfile?.preferred_language || 'hi'}
        onLanguageSelect={(selected) => {
          setUiLang(selected);
          setUserProfile(prev => ({ ...prev, preferred_language: selected }));
        }}
      />


    </motion.div>
  );
}

