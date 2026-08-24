import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Sliders, RefreshCcw, Sparkles, PieChart, Layers, Gauge,
  TrendingUp, ArrowRight, ShieldCheck, Zap, Landmark, CheckCircle2, AlertTriangle
} from 'lucide-react';

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

const SANDBOX_PRESETS = [
  {
    label: "SBI Prime Baseline",
    badge: "INSTANT STP",
    params: { cibil_score: 785, applicant_income: 1500000, coapplicant_income: 360000, loan_amount: 1200000, loan_tenure_months: 48, existing_debts: 180000, credit_card_utilization: 0.18, delinquent_lines_2yrs: 0, credit_history_years: 8.5 }
  },
  {
    label: "HDFC Near-Prime IT Pro",
    badge: "NEAR PRIME",
    params: { cibil_score: 715, applicant_income: 960000, coapplicant_income: 0, loan_amount: 650000, loan_tenure_months: 36, existing_debts: 144000, credit_card_utilization: 0.28, delinquent_lines_2yrs: 0, credit_history_years: 5.0 }
  },
  {
    label: "Bajaj Finserv MSME Trader",
    badge: "NBFC BORDERLINE",
    params: { cibil_score: 660, applicant_income: 720000, coapplicant_income: 0, loan_amount: 800000, loan_tenure_months: 48, existing_debts: 216000, credit_card_utilization: 0.42, delinquent_lines_2yrs: 0, credit_history_years: 4.0 }
  },
  {
    label: "High FOIR Overleveraged",
    badge: "CRITICAL REJECT",
    params: { cibil_score: 580, applicant_income: 420000, coapplicant_income: 0, loan_amount: 1200000, loan_tenure_months: 36, existing_debts: 240000, credit_card_utilization: 0.82, delinquent_lines_2yrs: 2, credit_history_years: 2.5 }
  }
];

export default function Sandbox() {
  const [params, setParams] = useState(SANDBOX_PRESETS[0].params);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const debounceRef = useRef(null);

  // Derived live financial ratios
  const monthlyIncome = Math.max((params.applicant_income + params.coapplicant_income) / 12, 1);
  const monthlyDebts = params.existing_debts / 12;
  
  // Benchmark EMI at ~10.5% APR
  const r = 10.5 / (12 * 100);
  const n = params.loan_tenure_months || 36;
  const factor = Math.pow(1 + r, n);
  const estimatedEMI = factor > 1 ? (params.loan_amount * r * factor) / (factor - 1) : params.loan_amount / n;
  
  const totalObligations = monthlyDebts + estimatedEMI;
  const foirPct = Math.round((totalObligations / monthlyIncome) * 100);

  const runSimulation = async (updatedParams) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/customer/sandbox', {
        ...updatedParams,
        employment_status: 'Salaried',
        education: 'Graduate',
        home_ownership: 'RENT',
        loan_purpose: 'Personal'
      });
      setSimResult(res.data);
    } catch (err) {
      console.error("Sandbox simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (name, value) => {
    const updated = { ...params, [name]: value };
    setParams(updated);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation(updated);
    }, 120);
  };

  useEffect(() => {
    runSimulation(params);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20"
    >
      
      {/* Header */}
      <div className="border-b border-[#1e2a3d] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>● REAL-TIME INDIAN BANKING XAI SENSITIVITY & RECOURSE SANDBOX</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Interactive <span className="text-[#d2ff00]">Recourse Simulator</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
            Adjust parametric sliders to observe instant recalculations of decision boundary shifts, local SHAP trajectories, and Indian multi-lender Pareto matches (SBI, HDFC, ICICI, Axis, Bajaj Finserv).
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 font-mono-tech text-xs bg-[#121824] px-3.5 py-1.5 rounded-lg border border-[#1e2a3d]">
          <Zap className="w-3.5 h-3.5 text-[#d2ff00]" />
          <span className="text-slate-400">Execution:</span>
          <span className="text-[#d2ff00] font-bold">&lt; 15ms XGBoost In-Memory</span>
        </div>
      </div>

      {/* Quick Sensitivity Presets */}
      <div className="bg-[#121824] border border-[#1e2a3d] p-3 rounded-2xl">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[11px] font-mono-tech text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d2ff00]" /> QUICK SENSITIVITY PRESETS (INDIAN PROFILES):
          </span>
          <span className="text-[10px] font-mono-tech text-[#d2ff00]">1-TOUCH PARAMETRIC INITIALIZATION</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SANDBOX_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setParams(p.params);
                runSimulation(p.params);
              }}
              className="bg-[#0a0e17] hover:bg-[#162030] p-2.5 rounded-xl border border-[#1e2a3d] hover:border-[#d2ff00]/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#d2ff00] transition-colors">{p.label}</span>
                <span className="text-[9px] font-mono-tech text-[#d2ff00] bg-[#d2ff00]/10 px-1.5 py-0.5 rounded border border-[#d2ff00]/20">{p.badge}</span>
              </div>
              <span className="text-[10px] font-mono-tech text-slate-400 mt-1 block">
                CIBIL {p.params.cibil_score} | Loan {formatINR(p.params.loan_amount)} ({p.params.loan_tenure_months}m)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Financial Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121824] p-3.5 rounded-xl border border-[#1e2a3d]">
          <span className="text-[10px] font-mono-tech text-slate-400 block uppercase">Net Monthly Income</span>
          <span className="text-base font-bold text-white font-mono-tech">{formatMonthlyINR(params.applicant_income + params.coapplicant_income)}</span>
          <span className="text-[10px] font-mono-tech text-slate-500 block">Annual: {formatINR(params.applicant_income + params.coapplicant_income)}</span>
        </div>

        <div className="bg-[#121824] p-3.5 rounded-xl border border-[#1e2a3d]">
          <span className="text-[10px] font-mono-tech text-slate-400 block uppercase">Est. Proposed Loan EMI</span>
          <span className="text-base font-bold text-[#d2ff00] font-mono-tech">₹{Math.round(estimatedEMI).toLocaleString('en-IN')}/mo</span>
          <span className="text-[10px] font-mono-tech text-slate-500 block">At Benchmark 10.5% Rate</span>
        </div>

        <div className="bg-[#121824] p-3.5 rounded-xl border border-[#1e2a3d]">
          <span className="text-[10px] font-mono-tech text-slate-400 block uppercase">FOIR / Debt Burden</span>
          <span className={`text-base font-bold font-mono-tech ${foirPct <= 45 ? 'text-emerald-400' : foirPct <= 55 ? 'text-amber-400' : 'text-rose-400'}`}>
            {foirPct}%
          </span>
          <span className="text-[10px] font-mono-tech text-slate-500 block">
            {foirPct <= 45 ? '🟢 Prime (<45%)' : foirPct <= 55 ? '🟡 Moderate (45-55%)' : '🔴 RBI Cap Exceeded (>55%)'}
          </span>
        </div>

        <div className="bg-[#121824] p-3.5 rounded-xl border border-[#1e2a3d]">
          <span className="text-[10px] font-mono-tech text-slate-400 block uppercase">CIBIL Health Band</span>
          <span className={`text-base font-bold font-mono-tech ${params.cibil_score >= 750 ? 'text-emerald-400' : params.cibil_score >= 680 ? 'text-amber-400' : 'text-rose-400'}`}>
            {params.cibil_score} / 850
          </span>
          <span className="text-[10px] font-mono-tech text-slate-500 block">
            {params.cibil_score >= 750 ? 'Prime (SBI/HDFC STP)' : params.cibil_score >= 680 ? 'Near-Prime (ICICI/Axis)' : 'Subprime / Recourse'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Area (6 columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d2ff00]" /> Parametric Input Matrix (INR)
              </h3>
              <span className="text-[10px] font-mono-tech text-[#d2ff00]">LIVE PERTURBATION</span>
            </div>

            {/* CIBIL */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">CIBIL Credit Score</span>
                <span className="text-[#d2ff00] font-bold text-sm">{params.cibil_score}</span>
              </div>
              <input
                type="range" min="300" max="850" step="5"
                value={params.cibil_score}
                onChange={(e) => handleSliderChange('cibil_score', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>300 (Subprime / Defaulter)</span>
                <span>700 (Good)</span>
                <span>750+ (Prime)</span>
                <span>850 (Max)</span>
              </div>
            </div>

            {/* Income */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Applicant Annual CTC / Income</span>
                <span className="text-[#d2ff00] font-bold">{formatINR(params.applicant_income)} ({formatMonthlyINR(params.applicant_income)})</span>
              </div>
              <input
                type="range" min="200000" max="4000000" step="25000"
                value={params.applicant_income}
                onChange={(e) => handleSliderChange('applicant_income', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>₹2 Lakhs (₹16.6k/mo)</span>
                <span>₹15 Lakhs (₹1.25L/mo)</span>
                <span>₹40 Lakhs (₹3.33L/mo)</span>
              </div>
            </div>

            {/* Co-Applicant Income */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Co-Applicant Income</span>
                <span className="text-[#d2ff00] font-bold">{formatINR(params.coapplicant_income)} ({formatMonthlyINR(params.coapplicant_income)})</span>
              </div>
              <input
                type="range" min="0" max="2000000" step="20000"
                value={params.coapplicant_income}
                onChange={(e) => handleSliderChange('coapplicant_income', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Requested Loan Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Requested Loan Amount</span>
                <span className="text-[#d2ff00] font-bold text-sm">{formatINR(params.loan_amount)}</span>
              </div>
              <input
                type="range" min="50000" max="10000000" step="50000"
                value={params.loan_amount}
                onChange={(e) => handleSliderChange('loan_amount', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>₹50,000 (Micro)</span>
                <span>₹10 Lakhs (Personal)</span>
                <span>₹50 Lakhs (Home)</span>
                <span>₹1 Crore</span>
              </div>
            </div>

            {/* Tenure */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Loan Tenure</span>
                <span className="text-[#d2ff00] font-bold">{params.loan_tenure_months} Months ({(params.loan_tenure_months / 12).toFixed(1)} yrs)</span>
              </div>
              <input
                type="range" min="12" max="240" step="12"
                value={params.loan_tenure_months}
                onChange={(e) => handleSliderChange('loan_tenure_months', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>12 Months (1 yr)</span>
                <span>60 Months (5 yrs)</span>
                <span>240 Months (20 yrs Home Loan)</span>
              </div>
            </div>

            {/* Existing Debts */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Existing Debts / Active EMIs (Annual)</span>
                <span className="text-[#d2ff00] font-bold">{formatINR(params.existing_debts)} ({formatMonthlyINR(params.existing_debts)})</span>
              </div>
              <input
                type="range" min="0" max="600000" step="12000"
                value={params.existing_debts}
                onChange={(e) => handleSliderChange('existing_debts', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Credit Card Utilization */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Credit Card Revolving Utilization</span>
                <span className="text-[#d2ff00] font-bold">{(params.credit_card_utilization * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.05" max="0.95" step="0.02"
                value={params.credit_card_utilization}
                onChange={(e) => handleSliderChange('credit_card_utilization', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>&lt; 25% (Ideal)</span>
                <span>50% (Average)</span>
                <span>&gt; 75% (Overleveraged)</span>
              </div>
            </div>

            {/* Delinquent Lines */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Delinquencies / 30+ DPD Overdue (Past 2 Years)</span>
                <span className={`font-bold ${params.delinquent_lines_2yrs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {params.delinquent_lines_2yrs} Instances
                </span>
              </div>
              <input
                type="range" min="0" max="4" step="1"
                value={params.delinquent_lines_2yrs}
                onChange={(e) => handleSliderChange('delinquent_lines_2yrs', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

          </div>
        </div>

        {/* Live Simulation Output (6 columns) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Main Simulated Probability Card */}
          <div className="cyber-card-glow p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> REAL-TIME SIMULATED UNDERWRITING PROBABILITY
              </span>
              {loading && <RefreshCcw className="w-4 h-4 text-[#d2ff00] animate-spin" />}
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-6xl font-black text-white tracking-tight font-mono-tech">
                {simResult ? `${(simResult.approval_probability * 100).toFixed(1)}%` : '85.0%'}
              </div>
              <span className={`px-3 py-1 rounded-md text-xs font-mono-tech font-bold border ${
                simResult?.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                simResult?.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {simResult?.risk_tier || 'LOW_RISK'} — {simResult?.status || 'APPROVED'}
              </span>
            </div>

            <div className="h-3 bg-[#0a0e17] rounded-full overflow-hidden p-0.5 border border-[#1e2a3d]">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  (simResult?.approval_probability || 0.85) >= 0.70 ? 'bg-[#d2ff00] shadow-[0_0_20px_rgba(210,255,0,0.5)]' :
                  (simResult?.approval_probability || 0.85) >= 0.45 ? 'bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
                  'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                }`}
                style={{ width: `${((simResult?.approval_probability || 0.85) * 100).toFixed(1)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400 pt-1">
              <span>0% (Reject)</span>
              <span>45% (NBFC Threshold)</span>
              <span>70% (Prime Bank Threshold)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Dynamic SHAP Trajectory Bar Chart */}
          {simResult && (
            <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#d2ff00]" /> Dynamic SHAP Feature Attribution
                </h4>
                <span className="text-[10px] font-mono-tech text-slate-500">LIVE IMPACT SHIFTS</span>
              </div>

              <div className="space-y-3">
                {simResult.shap_explanation?.top_features?.slice(0, 6).map((feat, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-mono-tech">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{feat.feature.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {feat.impact === 'POSITIVE' ? '+' : ''}{feat.shap_value} ({feat.impact})
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0a0e17] rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(Math.abs(feat.shap_value) * 100, 100)}%` }}
                        className={`h-full rounded-full ${feat.impact === 'POSITIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Multi-Bank Pareto Match Preview */}
          {simResult?.bank_recommendations && (
            <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#d2ff00]" /> Indian Lender Pareto Match
                </h4>
                <span className="text-[10px] font-mono-tech text-[#d2ff00]">TOP MATCHES</span>
              </div>

              <div className="space-y-2.5">
                {simResult.bank_recommendations.slice(0, 4).map((b, i) => (
                  <div key={i} className="p-3 bg-[#0a0e17] rounded-xl border border-[#1e2a3d] flex items-center justify-between text-xs font-mono-tech hover:border-[#d2ff00]/30 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-[#d2ff00]" />
                        <span className="text-white font-bold">{b.bank_name}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Base Rate: <span className="text-emerald-400 font-bold">{b.base_interest_rate}%</span> | Est. EMI: <span className="text-white font-bold">₹{b.estimated_monthly_emi.toLocaleString('en-IN')}/mo</span>
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      b.status === 'RECOMMENDED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.match_score}% Match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
