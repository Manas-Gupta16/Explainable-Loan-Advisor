import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, ShieldCheck, AlertTriangle, CheckCircle, ArrowUpRight, 
  HelpCircle, RefreshCw, Layers, MapPin, DollarSign, PieChart, Sparkles 
} from 'lucide-react';

export default function CustomerPortal() {
  const [formData, setFormData] = useState({
    cibil_score: 710,
    applicant_income: 65000,
    coapplicant_income: 15000,
    loan_amount: 25000,
    loan_tenure_months: 36,
    existing_debts: 8000,
    credit_card_utilization: 0.25,
    delinquent_lines_2yrs: 0,
    credit_history_years: 6.5,
    employment_status: 'Salaried',
    education: 'Graduate',
    home_ownership: 'RENT',
    loan_purpose: 'Personal'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/v1/customer/apply', formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze loan application. Make sure backend server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-16"
    >
      
      {/* Page Header */}
      <div className="border-b border-[#1e2a3d] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
          <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
          <span>● CUSTOMER RECOURSE PORTAL</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Loan Evaluation & <span className="text-[#d2ff00]">Actionable Recourse</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
          Enter your financial parameters to estimate approval probability across major lenders, receive SHAP explainability insights, and generate DiCE counterfactual approval roadmaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form (5 columns) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <form onSubmit={handleSubmit} className="cyber-card space-y-5 bg-[#121824] border-[#1e2a3d]">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d2ff00]" /> Application Inputs
              </h3>
              <span className="text-[10px] font-mono-tech text-slate-500">PARAM METRICS</span>
            </div>

            {/* CIBIL Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">CIBIL Credit Score</label>
                <span className="font-mono-tech font-bold text-[#d2ff00]">{formData.cibil_score}</span>
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
                <span>300 (Poor)</span>
                <span>850 (Excellent)</span>
              </div>
            </div>

            {/* Income & Debts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Annual Income ($)</label>
                <input
                  type="number"
                  name="applicant_income"
                  value={formData.applicant_income}
                  onChange={handleChange}
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Co-Applicant Income ($)</label>
                <input
                  type="number"
                  name="coapplicant_income"
                  value={formData.coapplicant_income}
                  onChange={handleChange}
                  className="cyber-input"
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
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tenure (Months)</label>
                <select
                  name="loan_tenure_months"
                  value={formData.loan_tenure_months}
                  onChange={handleChange}
                  className="cyber-input"
                >
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                  <option value={48}>48 Months</option>
                  <option value={60}>60 Months</option>
                  <option value={120}>120 Months</option>
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
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Credit Utilization</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  name="credit_card_utilization"
                  value={formData.credit_card_utilization}
                  onChange={handleChange}
                  className="cyber-input"
                />
              </div>
            </div>

            {/* Categoricals */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Employment</label>
                <select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleChange}
                  className="cyber-input"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Business">Business Owner</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Home Ownership</label>
                <select
                  name="home_ownership"
                  value={formData.home_ownership}
                  onChange={handleChange}
                  className="cyber-input"
                >
                  <option value="OWN">Owned</option>
                  <option value="RENT">Rented</option>
                  <option value="MORTGAGE">Mortgage</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(210,255,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-lime w-full justify-center py-3.5 mt-4 text-sm font-extrabold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> ANALYZING XAI ENGINE...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> EVALUATE APPLICATION
                </span>
              )}
            </motion.button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs"
              >
                {error}
              </motion.div>
            )}

          </form>
        </motion.div>

        {/* Right Output Area (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {!result ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="cyber-card p-12 text-center bg-[#121824] border-[#1e2a3d] flex flex-col items-center justify-center min-h-[440px]"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#d2ff00]/10 text-[#d2ff00] border border-[#d2ff00]/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(210,255,0,0.1)]">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Ready for Application Evaluation</h3>
              <p className="text-slate-400 text-xs max-w-sm mt-2 font-light leading-relaxed">
                Fill in your details on the left and click "Evaluate Application" to run XGBoost inference, multi-bank matching, and SHAP/DiCE explainability workflows.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              
              {/* Approval Probability Banner */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="cyber-card-glow p-6 relative overflow-hidden shadow-2xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono-tech text-[#d2ff00] uppercase tracking-widest block mb-1">
                      ESTIMATED APPROVAL PROBABILITY
                    </span>
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-6xl font-black text-white tracking-tight"
                    >
                      {(result.approval_probability * 100).toFixed(1)}%
                    </motion.div>
                  </div>

                  <div className="text-right">
                    <span className={`tech-badge-lime font-bold ${
                      result.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      result.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {result.risk_tier} — {result.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 h-3 bg-[#0a0e17] rounded-full overflow-hidden p-0.5 border border-[#1e2a3d]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.approval_probability * 100).toFixed(1)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-[#d2ff00] rounded-full shadow-[0_0_20px_rgba(210,255,0,0.5)]"
                  />
                </div>
              </motion.div>

              {/* Multi-Bank Recommendations */}
              <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#d2ff00]" /> Multi-Bank Recommended Matches
                  </h4>
                  <span className="text-[10px] font-mono-tech text-slate-500">PARETO MATCH ENGINE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.bank_recommendations?.map((bank, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      whileHover={{ y: -3, borderColor: 'rgba(210, 255, 0, 0.4)' }}
                      className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-white">{bank.bank_name}</div>
                        <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded font-bold ${
                          bank.status === 'RECOMMENDED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {bank.match_score}% Match
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-400 pt-1 font-mono-tech">
                        <span>Interest Rate: <strong className="text-white">{bank.base_interest_rate}%</strong></span>
                        <span>Est. EMI: <strong className="text-[#d2ff00]">${bank.estimated_monthly_emi}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-light italic">
                        {bank.reason}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* SHAP Feature Importance */}
              <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#d2ff00]" /> SHAP Key Decision Factors
                  </h4>
                  <span className="text-[10px] font-mono-tech text-slate-500">LOCAL FEATURE IMPORTANCE</span>
                </div>

                <div className="space-y-3.5">
                  {result.shap_explanation?.top_features?.slice(0, 5).map((feat, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono-tech">
                        <span className="text-slate-300">{feat.feature}</span>
                        <span className={feat.impact === 'POSITIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {feat.impact === 'POSITIVE' ? '+' : ''}{feat.shap_value}
                        </span>
                      </div>

                      <div className="h-2 w-full bg-[#0a0e17] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Math.abs(feat.shap_value) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={feat.impact === 'POSITIVE' ? 'feature-bar-positive' : 'feature-bar-negative'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DiCE Counterfactual Phased Approval Roadmap */}
              {result.dice_roadmap?.roadmap_steps?.length > 0 && (
                <div className="cyber-card p-6 bg-[#121824] border-[#d2ff00]/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
                    <h4 className="font-bold text-[#d2ff00] text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#d2ff00]" /> DiCE Phased Approval Roadmap
                    </h4>
                    <span className="text-[10px] font-mono-tech text-slate-500">ACTIONABLE RECOURSE</span>
                  </div>

                  <div className="space-y-3">
                    {result.dice_roadmap.roadmap_steps[0]?.changes?.map((change, cIdx) => (
                      <motion.div 
                        key={cIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: cIdx * 0.1 }}
                        className="bg-[#0a0e17] p-3.5 rounded-lg border border-[#1e2a3d] flex items-center justify-between text-xs font-mono-tech"
                      >
                        <span className="text-slate-300">{change.feature || change.action}</span>
                        {change.target_value && (
                          <span className="text-[#d2ff00] font-bold">
                            {change.original_value} → {change.target_value}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
