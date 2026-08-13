import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Sliders, RefreshCcw, Sparkles, PieChart, Layers, Gauge,
  TrendingUp, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';

const SANDBOX_PRESETS = [
  {
    label: "Prime Baseline",
    params: { cibil_score: 760, applicant_income: 90000, coapplicant_income: 15000, loan_amount: 30000, loan_tenure_months: 36, existing_debts: 5000, credit_card_utilization: 0.20, delinquent_lines_2yrs: 0, credit_history_years: 7.0 }
  },
  {
    label: "Test CIBIL Tipping Point",
    params: { cibil_score: 670, applicant_income: 65000, coapplicant_income: 0, loan_amount: 25000, loan_tenure_months: 36, existing_debts: 9000, credit_card_utilization: 0.40, delinquent_lines_2yrs: 0, credit_history_years: 4.5 }
  },
  {
    label: "High DTI Stress",
    params: { cibil_score: 710, applicant_income: 50000, coapplicant_income: 0, loan_amount: 40000, loan_tenure_months: 24, existing_debts: 22000, credit_card_utilization: 0.75, delinquent_lines_2yrs: 1, credit_history_years: 3.0 }
  },
  {
    label: "Co-Applicant Leverage Boost",
    params: { cibil_score: 680, applicant_income: 55000, coapplicant_income: 45000, loan_amount: 35000, loan_tenure_months: 48, existing_debts: 8000, credit_card_utilization: 0.30, delinquent_lines_2yrs: 0, credit_history_years: 5.5 }
  }
];

export default function Sandbox() {
  const [params, setParams] = useState(SANDBOX_PRESETS[0].params);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const debounceRef = useRef(null);

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
    }, 150);
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
            <span>● REAL-TIME XAI SENSITIVITY & RECOURSE SANDBOX</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Interactive <span className="text-[#d2ff00]">Recourse Simulator</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
            Adjust parametric sliders to observe real-time recalculations of decision boundary shifts, local SHAP trajectories, and multi-lender Pareto frontier movements.
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 font-mono-tech text-xs bg-[#121824] px-3.5 py-1.5 rounded-lg border border-[#1e2a3d]">
          <Zap className="w-3.5 h-3.5 text-[#d2ff00]" />
          <span className="text-slate-400">Execution:</span>
          <span className="text-[#d2ff00] font-bold">&lt; 15ms In-Memory</span>
        </div>
      </div>

      {/* Quick Sensitivity Presets */}
      <div className="bg-[#121824] border border-[#1e2a3d] p-3 rounded-2xl">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[11px] font-mono-tech text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d2ff00]" /> QUICK SENSITIVITY PRESETS:
          </span>
          <span className="text-[10px] font-mono-tech text-[#d2ff00]">ONE-TOUCH PARAMETRIC INITIALIZATION</span>
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
              <span className="text-xs font-bold text-white group-hover:text-[#d2ff00] transition-colors block">{p.label}</span>
              <span className="text-[10px] font-mono-tech text-slate-400 mt-0.5 block">
                CIBIL {p.params.cibil_score} | ${p.params.loan_amount.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Area (6 columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d2ff00]" /> Parametric Input Matrix
              </h3>
              <span className="text-[10px] font-mono-tech text-[#d2ff00]">CONTINUOUS PERTURBATION</span>
            </div>

            {/* CIBIL */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">CIBIL Credit Score</span>
                <span className="text-[#d2ff00] font-bold text-sm">{params.cibil_score}</span>
              </div>
              <input
                type="range" min="300" max="850"
                value={params.cibil_score}
                onChange={(e) => handleSliderChange('cibil_score', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
              <div className="flex justify-between text-[10px] font-mono-tech text-slate-500 mt-1">
                <span>300 (High Default)</span>
                <span>850 (Prime)</span>
              </div>
            </div>

            {/* Income */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Applicant Annual Income</span>
                <span className="text-[#d2ff00] font-bold">${params.applicant_income?.toLocaleString()}</span>
              </div>
              <input
                type="range" min="15000" max="250000" step="2500"
                value={params.applicant_income}
                onChange={(e) => handleSliderChange('applicant_income', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Co-Applicant Income */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Co-Applicant Income</span>
                <span className="text-[#d2ff00] font-bold">${params.coapplicant_income?.toLocaleString()}</span>
              </div>
              <input
                type="range" min="0" max="100000" step="2500"
                value={params.coapplicant_income}
                onChange={(e) => handleSliderChange('coapplicant_income', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Requested Loan Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Requested Loan Amount</span>
                <span className="text-[#d2ff00] font-bold">${params.loan_amount?.toLocaleString()}</span>
              </div>
              <input
                type="range" min="2000" max="150000" step="1000"
                value={params.loan_amount}
                onChange={(e) => handleSliderChange('loan_amount', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Tenure */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Loan Tenure</span>
                <span className="text-[#d2ff00] font-bold">{params.loan_tenure_months} Months ({(params.loan_tenure_months / 12).toFixed(1)} yrs)</span>
              </div>
              <input
                type="range" min="12" max="120" step="12"
                value={params.loan_tenure_months}
                onChange={(e) => handleSliderChange('loan_tenure_months', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Existing Debts */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Existing Debts (Annual)</span>
                <span className="text-[#d2ff00] font-bold">${params.existing_debts?.toLocaleString()}</span>
              </div>
              <input
                type="range" min="0" max="40000" step="1000"
                value={params.existing_debts}
                onChange={(e) => handleSliderChange('existing_debts', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Credit Card Utilization */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Credit Card Utilization</span>
                <span className="text-[#d2ff00] font-bold">{(params.credit_card_utilization * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.02"
                value={params.credit_card_utilization}
                onChange={(e) => handleSliderChange('credit_card_utilization', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Delinquent Lines */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Delinquent Lines (Past 2 Years)</span>
                <span className={`font-bold ${params.delinquent_lines_2yrs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {params.delinquent_lines_2yrs}
                </span>
              </div>
              <input
                type="range" min="0" max="5" step="1"
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
              <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase tracking-widest">
                REAL-TIME SIMULATED PROBABILITY
              </span>
              {loading && <RefreshCcw className="w-4 h-4 text-[#d2ff00] animate-spin" />}
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-6xl font-black text-white tracking-tight">
                {simResult ? `${(simResult.approval_probability * 100).toFixed(1)}%` : '78.5%'}
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
                  (simResult?.approval_probability || 0.78) >= 0.7 ? 'bg-[#d2ff00] shadow-[0_0_20px_rgba(210,255,0,0.5)]' :
                  (simResult?.approval_probability || 0.78) >= 0.4 ? 'bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]' :
                  'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                }`}
                style={{ width: `${((simResult?.approval_probability || 0.78) * 100).toFixed(1)}%` }}
              />
            </div>
          </div>

          {/* Dynamic SHAP Trajectory Bar Chart */}
          {simResult && (
            <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#d2ff00]" /> Dynamic SHAP Feature Trajectory
                </h4>
                <span className="text-[10px] font-mono-tech text-slate-500">REAL-TIME ATTRIBUTION</span>
              </div>

              <div className="space-y-3">
                {simResult.shap_explanation?.top_features?.map((feat, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-mono-tech">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{feat.feature}</span>
                      <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {feat.impact === 'POSITIVE' ? '+' : ''}{feat.shap_value} ({feat.impact})
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0a0e17] rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(Math.abs(feat.shap_value) * 120, 100)}%` }}
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
                  <Layers className="w-4 h-4 text-[#d2ff00]" /> Dynamic Lender Pareto Match
                </h4>
                <span className="text-[10px] font-mono-tech text-slate-500">PARETO FRONTIER</span>
              </div>

              <div className="space-y-2">
                {simResult.bank_recommendations.map((b, i) => (
                  <div key={i} className="p-3 bg-[#0a0e17] rounded-xl border border-[#1e2a3d] flex items-center justify-between text-xs font-mono-tech">
                    <div>
                      <span className="text-white font-bold block">{b.bank_name}</span>
                      <span className="text-slate-400 text-[11px]">Rate: {b.base_interest_rate}% | Est. EMI: ${b.estimated_monthly_emi}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
