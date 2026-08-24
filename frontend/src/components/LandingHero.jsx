import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Layers, Lock, BarChart3, ChevronRight, Activity, Cpu, Sparkles, Landmark, Scale, FileText } from 'lucide-react';

export default function LandingHero({ onGetStarted }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#d2ff00]/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative pt-12 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        
        {/* Left Headline */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
          
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121824] border border-[#d2ff00]/30 text-xs font-mono-tech text-[#d2ff00] shadow-[0_0_15px_rgba(210,255,0,0.1)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>INDIAN BANKING XAI PROTOCOL V2.4</span>
            <Sparkles className="w-3.5 h-3.5 ml-1 text-[#d2ff00]" />
          </motion.div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white leading-[1.03]">
            Explainable <br />
            <motion.span 
              initial={{ backgroundPosition: '0% 50%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="text-[#d2ff00] inline-block drop-shadow-[0_0_25px_rgba(210,255,0,0.25)]"
            >
              Loan Underwriting.
            </motion.span>
          </h1>

          <p className="text-slate-400 text-base max-w-lg font-light leading-relaxed">
            AI-powered retail credit advisor & underwriting engine for Indian Banks (SBI, HDFC, ICICI, Axis). Compliant with RBI Digital Lending Directives, CIBIL bureau scoring, and actionable DiCE counterfactual recourse.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(210,255,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted} 
              className="btn-lime text-sm px-7 py-3.5 font-extrabold flex items-center gap-2"
            >
              LAUNCH LOAN EVALUATION <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.a 
              whileHover={{ scale: 1.03 }}
              href="https://github.com/Pra26nav/Explainable-Loan-Advisor" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-dark-outline text-sm px-6 py-3.5"
            >
              PROJECT DOCS
            </motion.a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1e2a3d]/80 text-xs font-mono-tech">
            <div>
              <span className="text-slate-500 block text-[10px]">MODEL ACCURACY</span>
              <span className="text-white font-bold text-base">95.05%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ROC-AUC</span>
              <span className="text-[#d2ff00] font-bold text-base">0.9918</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">XAI LATENCY</span>
              <span className="text-emerald-400 font-bold text-base">&lt; 15ms</span>
            </div>
          </div>

        </motion.div>

        {/* Right Real-time Telemetry Card */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="cyber-card p-6 relative overflow-hidden bg-[#121824]/90 backdrop-blur-xl border-[#1e2a3d] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400 mb-6">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#d2ff00]" /> INDIAN BANKING TELEMETRY
              </span>
              <span className="text-[#d2ff00] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
                RBI LIVE
              </span>
            </div>

            {/* Interactive Graph Box */}
            <div className="my-6 relative">
              <div className="w-full h-52 bg-[#0a0e17] rounded-xl border border-[#1e2a3d] p-5 flex flex-col justify-between relative overflow-hidden">
                
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e2a3d_1px,transparent_1px),linear-gradient(to_bottom,#1e2a3d_1px,transparent_1px)] bg-[size:16px_16px]" />

                <div className="flex justify-between items-start z-10">
                  <div className="text-[10px] font-mono-tech text-slate-500 uppercase tracking-widest">
                    STATE BANK OF INDIA (SBI) STP
                  </div>
                  <div className="text-xs font-mono-tech text-[#d2ff00] bg-[#d2ff00]/10 px-2.5 py-1 rounded border border-[#d2ff00]/30 font-bold">
                    CIBIL 790 | 8.50% APR
                  </div>
                </div>

                {/* Floating Metric Badge */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="absolute top-10 right-6 bg-[#161f2e] border border-[#d2ff00]/40 rounded-xl p-4 shadow-[0_0_30px_rgba(210,255,0,0.15)] z-20"
                >
                  <div className="text-[10px] font-mono-tech text-[#d2ff00] tracking-wider uppercase flex items-center gap-1">
                    <Activity className="w-3 h-3" /> APPROVAL ODDS
                  </div>
                  <div className="text-3xl font-black text-white mt-0.5 font-mono-tech">98.5%</div>
                </motion.div>

                {/* Dynamic Wave Progress */}
                <div className="space-y-2.5 z-10 mt-auto pt-6">
                  <div className="flex justify-between text-[10px] font-mono-tech text-slate-400">
                    <span>XGBoost Confidence</span>
                    <span className="text-[#d2ff00]">98.5% (Prime Tier)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98.5%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-[#d2ff00] rounded-full shadow-[0_0_12px_rgba(210,255,0,0.5)]"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Status Pills */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono-tech">
              <div className="bg-[#0a0e17] p-3 rounded-lg border border-[#1e2a3d]">
                <div className="text-slate-500 text-[10px]">SHAP TREE EXPLAINER</div>
                <div className="text-white font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ACTIVE
                </div>
              </div>
              <div className="bg-[#0a0e17] p-3 rounded-lg border border-[#1e2a3d]">
                <div className="text-slate-500 text-[10px]">DiCE & AFRO RECOURSE</div>
                <div className="text-[#d2ff00] font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d2ff00]" /> ENABLED
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>

      </motion.section>

      {/* Infrastructure Architecture Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div>
          <div className="text-xs font-mono-tech text-[#d2ff00] mb-1">● DEEP TECH ARCHITECTURE</div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Indian Retail Banking Architecture
          </h2>
          <p className="text-slate-400 text-sm font-mono-tech mt-1">
            Modular components designed for Indian retail lenders, Account Aggregators, and regulatory compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Multi-Bank Card */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(210, 255, 0, 0.4)' }}
            className="cyber-card p-6 bg-[#121824] flex flex-col justify-between h-72 border-[#1e2a3d] group transition-all"
          >
            <div>
              <div className="text-[11px] font-mono-tech text-slate-400 uppercase tracking-widest flex justify-between items-center">
                <span>INDIAN LENDERS</span>
                <span className="text-[#d2ff00] font-bold text-xs">01</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-2">Multi-Bank Matching</h3>
              <p className="text-slate-400 text-xs mt-1">Ranks loan eligibility across State Bank of India (SBI), HDFC Bank, ICICI Bank, Axis Bank, and Bajaj Finserv.</p>
            </div>

            <div className="flex items-end gap-2 h-28 pt-4">
              <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} transition={{ duration: 0.8 }} className="flex-1 bg-[#1a2336] rounded-t group-hover:bg-[#d2ff00]/40 transition-all" />
              <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} transition={{ duration: 0.9 }} className="flex-1 bg-[#1a2336] rounded-t group-hover:bg-[#d2ff00]/60 transition-all" />
              <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} transition={{ duration: 1.0 }} className="flex-1 bg-[#1a2336] rounded-t group-hover:bg-[#d2ff00]/80 transition-all" />
              <motion.div initial={{ height: 0 }} animate={{ height: '95%' }} transition={{ duration: 1.1 }} className="flex-1 bg-[#d2ff00] rounded-t shadow-[0_0_20px_rgba(210,255,0,0.35)]" />
              <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} transition={{ duration: 1.2 }} className="flex-1 bg-[#d2ff00]/80 rounded-t" />
            </div>
          </motion.div>

          {/* Dynamic Risk Scoring */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(210, 255, 0, 0.4)' }}
            className="cyber-card p-6 bg-[#121824] flex flex-col justify-between h-72 border-[#1e2a3d] group transition-all"
          >
            <div>
              <div className="text-[11px] font-mono-tech text-slate-400 uppercase tracking-widest flex justify-between items-center">
                <span>UNDERWRITING CORE</span>
                <span className="text-[#d2ff00] font-bold text-xs">02</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-2">FOIR & CIBIL Engine</h3>
              <p className="text-slate-400 text-xs mt-1">Real-time XGBoost inference incorporating FOIR debt limits and TransUnion CIBIL 300-850 scores.</p>
            </div>

            <div className="space-y-2.5 pt-4">
              <div className="bg-[#1a2336] p-3 rounded-lg text-xs font-mono-tech flex justify-between items-center text-slate-300">
                <span>FOIR Constraint Engine</span>
                <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-pulse" />
              </div>
              <div className="bg-[#1a2336] p-3 rounded-lg text-xs font-mono-tech flex justify-between items-center text-slate-300">
                <span>Calibrated XGBoost</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="bg-[#1a2336] p-3 rounded-lg text-xs font-mono-tech flex justify-between items-center text-slate-300">
                <span>Local SHAP Attribution</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
            </div>
          </motion.div>

          {/* Performance & Compliance */}
          <div className="space-y-4 flex flex-col justify-between h-72">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="cyber-card p-5 bg-[#121824] border-[#1e2a3d] flex-1 flex items-center"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#d2ff00]/10 border border-[#d2ff00]/30 flex items-center justify-center text-[#d2ff00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono-tech text-slate-400 uppercase">RBI COMPLIANCE</div>
                  <div className="text-xs text-slate-200 font-semibold mt-0.5">Automated Digital Lending Master Directions Audit Dossiers.</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: '0 0 35px rgba(210,255,0,0.3)' }}
              className="cyber-card p-6 bg-[#d2ff00] text-black border-none rounded-2xl flex flex-col justify-between h-36"
            >
              <div className="flex justify-between items-center">
                <Zap className="w-6 h-6 text-black" />
                <span className="text-[11px] font-mono-tech font-bold uppercase tracking-wider">PERFORMANCE</span>
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight font-mono-tech">Sub-15ms Latency</div>
                <div className="text-xs font-medium text-black/80 mt-0.5">Real-time Indian credit decisioning pipeline</div>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.section>

      {/* Deployment Methodology */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl"
      >
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-block text-xs font-mono-tech font-bold text-slate-600 bg-slate-300 px-3 py-1 rounded-full">
            UNDERWRITING PIPELINE
          </div>
          <h2 className="text-4xl font-black tracking-tight text-black">
            Academic & Capstone Implementation
          </h2>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-black text-white font-mono-tech font-bold flex items-center justify-center text-sm shrink-0">
                01
              </div>
              <div>
                <h4 className="font-bold text-black text-base">Two-Sided FinTech Platform</h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Borrowers get tailored bank recommendations and actionable recourse roadmaps; Bank underwriters audit risk, conformal bounds, and fairness across applications.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-black text-white font-mono-tech font-bold flex items-center justify-center text-sm shrink-0">
                02
              </div>
              <div>
                <h4 className="font-bold text-black text-base">Mathematical Recourse & Calibration</h4>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  SHAP feature attribution, DiCE counterfactual optimization, and Conformal Inductive Prediction with 95% guaranteed coverage bounds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white p-7 rounded-2xl shadow-xl border border-slate-300 space-y-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-[#d2ff00] font-black flex items-center justify-center text-base">
                ⚡
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Explainable Loan Advisor (LoanIQ)</div>
                <div className="text-xs font-mono-tech text-slate-500">Department of Computer Science & Engineering</div>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed italic border-t border-slate-100 pt-3">
              "Integrating Explainable AI (XAI) into retail credit scoring bridges the transparency gap between borrowers and Indian banking institutions, preventing black-box rejections and ensuring regulatory compliance."
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Bottom CTA Banner */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="cyber-card p-8 bg-[#121824] border-[#1e2a3d] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d2ff00]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 font-mono-tech text-[#d2ff00] text-xs mb-1">
            <Sparkles className="w-4 h-4" /> LOANIQ INDIAN BANKING PROTOCOL
          </div>
          <h3 className="text-2xl font-black text-white">Experience the Explainable Underwriting Advisor</h3>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(210,255,0,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetStarted} 
          className="btn-lime px-8 py-3.5 text-base font-extrabold flex items-center gap-2"
        >
          START EVALUATION <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

    </div>
  );
}
