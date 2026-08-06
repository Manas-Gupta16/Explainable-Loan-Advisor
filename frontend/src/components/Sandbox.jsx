import React, { useState } from 'react';
import axios from 'axios';
import { Sliders, RefreshCcw, Sparkles, PieChart } from 'lucide-react';

export default function Sandbox() {
  const [params, setParams] = useState({
    cibil_score: 720,
    applicant_income: 70000,
    coapplicant_income: 0,
    loan_amount: 30000,
    loan_tenure_months: 36,
    existing_debts: 6000,
    credit_card_utilization: 0.20,
    delinquent_lines_2yrs: 0,
    credit_history_years: 8.0,
    employment_status: 'Salaried',
    education: 'Graduate',
    home_ownership: 'OWN',
    loan_purpose: 'Personal'
  });

  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const handleSlider = async (name, value) => {
    const updated = { ...params, [name]: value };
    setParams(updated);

    // Live backend sandbox simulation request
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/customer/sandbox', updated);
      setSimResult(res.data);
    } catch (err) {
      console.error("Sandbox simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="border-b border-[#1e2a3d] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
          <span>● REAL-TIME XAI SENSITIVITY SIMULATOR</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Interactive <span className="text-[#d2ff00]">Recourse Sandbox</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
          Drag parameter sliders to dynamically test decision boundary shifts, observing real-time recalculations of approval probability and SHAP feature trajectories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Area (6 columns) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d2ff00]" /> Parametric Control Sliders
              </h3>
              <span className="text-[10px] font-mono-tech text-[#d2ff00]">LIVE SIMULATION</span>
            </div>

            {/* CIBIL */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">CIBIL Score</span>
                <span className="text-[#d2ff00] font-bold">{params.cibil_score}</span>
              </div>
              <input
                type="range"
                min="300"
                max="850"
                value={params.cibil_score}
                onChange={(e) => handleSlider('cibil_score', parseInt(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Loan Amount */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Loan Amount ($)</span>
                <span className="text-[#d2ff00] font-bold">${params.loan_amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="200000"
                step="1000"
                value={params.loan_amount}
                onChange={(e) => handleSlider('loan_amount', parseFloat(e.target.value))}
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
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.credit_card_utilization}
                onChange={(e) => handleSlider('credit_card_utilization', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

            {/* Existing Debts */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono-tech">
                <span className="text-slate-300">Existing Debts ($)</span>
                <span className="text-[#d2ff00] font-bold">${params.existing_debts.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="500"
                value={params.existing_debts}
                onChange={(e) => handleSlider('existing_debts', parseFloat(e.target.value))}
                className="w-full h-2 bg-[#0a0e17] rounded-lg cursor-pointer accent-[#d2ff00]"
              />
            </div>

          </div>
        </div>

        {/* Live Simulation Output (6 columns) */}
        <div className="lg:col-span-6 space-y-5">
          
          <div className="cyber-card-glow p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase tracking-widest">
                REAL-TIME SIMULATED PROBABILITY
              </span>
              {loading && <RefreshCcw className="w-4 h-4 text-[#d2ff00] animate-spin" />}
            </div>

            <div className="text-6xl font-black text-white">
              {simResult ? `${(simResult.approval_probability * 100).toFixed(1)}%` : '78.5%'}
            </div>

            <div className="h-3 bg-[#0a0e17] rounded-full overflow-hidden p-0.5 border border-[#1e2a3d]">
              <div 
                className="h-full bg-[#d2ff00] rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(210,255,0,0.4)]"
                style={{ width: simResult ? `${(simResult.approval_probability * 100).toFixed(1)}%` : '78.5%' }}
              />
            </div>

          </div>

          {/* Top SHAP Drivers */}
          {simResult && (
            <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#d2ff00]" /> Dynamic SHAP Trajectory
                </h4>
                <span className="text-[10px] font-mono-tech text-slate-500">LIVE IMPACT</span>
              </div>

              <div className="space-y-3">
                {simResult.shap_explanation?.top_features?.slice(0, 4).map((feat, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-mono-tech">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{feat.feature}</span>
                      <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {feat.shap_value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
