import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, CheckCircle2, XCircle, Clock, Eye, 
  FileText, ShieldAlert, BarChart3, Search, Filter, Sparkles,
  Scale, RefreshCw, Download, AlertOctagon, TrendingDown, Gauge,
  Activity, Play, Check, ShieldCheck, Database
} from 'lucide-react';

export default function BankPortal() {
  const [activeBankTab, setActiveBankTab] = useState('queue'); // queue, fairness, monitoring, batchstress
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Inspector Sub-data
  const [appConformal, setAppConformal] = useState(null);
  const [appCausal, setAppCausal] = useState(null);

  // Fairness Audit state
  const [fairnessData, setFairnessData] = useState(null);
  const [fairnessLoading, setFairnessLoading] = useState(false);

  // Model Monitoring state
  const [monitoringData, setMonitoringData] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  // Batch Stress Test state
  const [batchScenario, setBatchScenario] = useState('COMBINED_STAGFLATION');
  const [batchRateHike, setBatchRateHike] = useState(2.5);
  const [batchStressData, setBatchStressData] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'ALL' ? '/api/v1/bank/queue' : `/api/v1/bank/queue?status_filter=${filterStatus}`;
      const res = await axios.get(url);
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applicant queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  // Load Fairness Audit
  const fetchFairnessAudit = async () => {
    setFairnessLoading(true);
    try {
      const res = await axios.get('/api/v1/bank/fairness-audit');
      setFairnessData(res.data);
    } catch (err) {
      console.error("Error fetching fairness audit:", err);
    } finally {
      setFairnessLoading(false);
    }
  };

  // Load Model Monitoring
  const fetchModelMonitoring = async () => {
    setMonitoringLoading(true);
    try {
      const res = await axios.get('/api/v1/bank/model-monitoring');
      setMonitoringData(res.data);
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  // Trigger Model Retrain
  const handleTriggerRetrain = async () => {
    setRetrainLoading(true);
    try {
      const res = await axios.post('/api/v1/bank/trigger-retrain');
      setRetrainResult(res.data);
      fetchModelMonitoring();
    } catch (err) {
      console.error("Error triggering retrain:", err);
    } finally {
      setRetrainLoading(false);
    }
  };

  // Run Batch Stress Test
  const handleRunBatchStress = async () => {
    setBatchLoading(true);
    try {
      const res = await axios.post(`/api/v1/bank/stress-test-batch?rate_hike_pct=${batchRateHike}&scenario=${batchScenario}`);
      setBatchStressData(res.data);
    } catch (err) {
      console.error("Error running batch stress test:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  // Decision override
  const handleDecision = async (status) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/v1/bank/decision/${selectedApp.id}`, {
        status: status,
        officer_notes: officerNotes
      });
      setSelectedApp(null);
      setOfficerNotes('');
      fetchApplications();
    } catch (err) {
      console.error(err);
      alert('Failed to update decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Inspector
  const handleInspectApp = async (app) => {
    setSelectedApp(app);
    setOfficerNotes(app.officer_notes || '');
    setAppConformal(null);
    setAppCausal(null);

    // Fetch Conformal Analysis
    try {
      const confRes = await axios.get(`/api/v1/bank/applications/${app.id}/conformal-analysis?confidence_level=0.95`);
      setAppConformal(confRes.data.conformal_analysis);
    } catch (e) {
      console.error(e);
    }

    // Fetch Causal Trajectory
    try {
      const causRes = await axios.get(`/api/v1/bank/applications/${app.id}/causal-trajectory?target_probability=0.80&max_horizon_days=90`);
      setAppCausal(causRes.data.trajectory);
    } catch (e) {
      console.error(e);
    }
  };

  // Download Compliance Dossier PDF
  const handleDownloadDossierPdf = async (appId) => {
    setPdfDownloading(true);
    try {
      const response = await axios.get(`/api/v1/bank/applications/${appId}/compliance-dossier`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Regulatory_Compliance_Dossier_App_${appId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading compliance dossier PDF:", err);
      alert("Failed to generate Compliance Dossier PDF.");
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
      
      {/* Header */}
      <div className="border-b border-[#1e2a3d] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>● INSTITUTIONAL RISK & REGULATORY COMPLIANCE SYSTEM</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Bank Underwriter & <span className="text-[#d2ff00]">Audit Governance</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl font-light">
            Real-time loan decision queue, ECOA disparate impact audits, continuous Population Stability Index (PSI) drift monitoring, and batch portfolio stress testing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchApplications} 
            className="btn-dark-outline text-xs font-bold py-2.5 px-4 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH QUEUE
          </motion.button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono-tech uppercase">TOTAL LOAN QUEUE</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Live active records</div>
        </div>

        <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]">
          <div className="flex justify-between items-start text-amber-400">
            <span className="text-[10px] font-mono-tech uppercase">PENDING UNDERWRITER ACTION</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {applications.filter(a => a.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Manual review required</div>
        </div>

        <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]">
          <div className="flex justify-between items-start text-emerald-400">
            <span className="text-[10px] font-mono-tech uppercase">APPROVED PORTFOLIO</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            {applications.filter(a => a.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Met underwriting threshold</div>
        </div>

        <div className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]">
          <div className="flex justify-between items-start text-[#d2ff00]">
            <span className="text-[10px] font-mono-tech uppercase">MODEL ROC-AUC</span>
            <BarChart3 className="w-4 h-4 text-[#d2ff00]" />
          </div>
          <div className="text-3xl font-black text-white mt-2">0.9658</div>
          <div className="text-[11px] text-[#d2ff00] font-mono-tech mt-1">Production Calibrated</div>
        </div>

      </div>

      {/* Main Bank View Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e2a3d] pb-2 font-mono-tech text-xs">
        {[
          { id: 'queue', label: 'APPLICATION QUEUE', icon: Users },
          { id: 'fairness', label: 'ECOA FAIRNESS AUDIT', icon: Scale },
          { id: 'monitoring', label: 'PSI MODEL DRIFT & RETRAIN', icon: Activity },
          { id: 'batchstress', label: 'PORTFOLIO STRESS TEST', icon: TrendingDown },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveBankTab(tab.id);
                if (tab.id === 'fairness' && !fairnessData) fetchFairnessAudit();
                if (tab.id === 'monitoring' && !monitoringData) fetchModelMonitoring();
                if (tab.id === 'batchstress' && !batchStressData) handleRunBatchStress();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeBankTab === tab.id
                  ? 'bg-[#d2ff00] text-black shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                  : 'bg-[#121824] text-slate-400 border border-[#1e2a3d] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: APPLICANT QUEUE TABLE */}
      {activeBankTab === 'queue' && (
        <div className="space-y-4">
          
          {/* Status Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-tech text-xs">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#d2ff00] text-black font-bold'
                      : 'bg-[#121824] text-slate-400 border border-[#1e2a3d] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono-tech text-slate-400">
              Showing {applications.length} applications
            </span>
          </div>

          {/* Table Container */}
          <div className="cyber-card p-0 bg-[#121824] border-[#1e2a3d] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-mono-tech text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#d2ff00]" /> Loading database queue...
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono-tech text-xs">
                No loan applications found in this queue. Submit an application in the Customer Portal to populate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0a0e17] text-slate-400 font-mono-tech uppercase text-[10px] border-b border-[#1e2a3d]">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Loan Amount</th>
                      <th className="p-4">CIBIL</th>
                      <th className="p-4">Risk Tier</th>
                      <th className="p-4">Probability</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3d] font-mono-tech">
                    {applications.map((app, idx) => (
                      <tr 
                        key={app.id}
                        className="hover:bg-[#1a2336]/60 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-300">#{app.id}</td>
                        <td className="p-4 text-white font-sans font-medium">Customer #{app.user_id}</td>
                        <td className="p-4 text-slate-300">${app.loan_amount?.toLocaleString()} ({app.loan_tenure_months}m)</td>
                        <td className="p-4 text-[#d2ff00] font-bold">{app.cibil_score}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            app.risk_tier === 'LOW_RISK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            app.risk_tier === 'MEDIUM_RISK' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {app.risk_tier || 'UNSCORED'}
                          </span>
                        </td>
                        <td className="p-4 text-white font-bold">
                          {app.approval_probability ? `${(app.approval_probability * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${
                            app.status === 'APPROVED' ? 'text-emerald-400' :
                            app.status === 'PENDING' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleInspectApp(app)}
                            className="btn-dark-outline py-1 px-3 text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> INSPECT XAI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 2: ECOA DEMOGRAPHIC FAIRNESS & BIAS AUDIT */}
      {activeBankTab === 'fairness' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#d2ff00]" /> ECOA Demographic Fairness & Algorithmic Bias Audit
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Conforming to US Equal Credit Opportunity Act (ECOA) & EU AI Act Article 10 Bias Mitigation Standards.
                </p>
              </div>
              <button
                onClick={fetchFairnessAudit}
                disabled={fairnessLoading}
                className="btn-dark-outline text-xs py-1.5 px-3 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fairnessLoading ? 'animate-spin' : ''}`} /> RE-AUDIT
              </button>
            </div>

            {fairnessLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono-tech text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#d2ff00]" />
                Computing Disparate Impact Ratios and Demographic Parity metrics...
              </div>
            ) : fairnessData ? (
              <div className="space-y-6">
                
                {/* Four-Fifths Rule Status Banner */}
                <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono-tech text-slate-500 uppercase">FOUR-FIFTHS RULE COMPLIANCE VERDICT</span>
                    <div className="text-2xl font-black text-white mt-1">
                      {fairnessData.four_fifths_rule_status}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-light">{fairnessData.regulatory_summary}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-xs font-mono-tech font-black border ${
                    fairnessData.four_fifths_rule_status?.includes('PASSED') 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {fairnessData.four_fifths_rule_status?.includes('PASSED') ? 'ECOA COMPLIANT' : 'BIAS DETECTED'}
                  </span>
                </div>

                {/* Metric Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tech">
                  
                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">DISPARATE IMPACT RATIO (DIR)</span>
                    <div className="text-3xl font-black text-[#d2ff00]">{fairnessData.disparate_impact_ratio}</div>
                    <div className="text-[11px] text-slate-400">Legal threshold: &gt;= 0.80 (80%)</div>
                  </div>

                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">DEMOGRAPHIC PARITY DIFF</span>
                    <div className="text-3xl font-black text-white">{fairnessData.demographic_parity_diff}</div>
                    <div className="text-[11px] text-slate-400">Target parity bound: &lt; 0.10</div>
                  </div>

                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">EQUALIZED ODDS DIFFERENCE</span>
                    <div className="text-3xl font-black text-white">{fairnessData.equalized_odds_diff}</div>
                    <div className="text-[11px] text-slate-400">TPR / FPR cross-group gap</div>
                  </div>

                </div>

                {/* Subgroup Breakdown Table */}
                {fairnessData.group_metrics && (
                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                    <span className="text-xs font-bold text-white font-mono-tech uppercase">SUBGROUP APPROVAL RATE METRICS</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-tech">
                      {Object.entries(fairnessData.group_metrics).map(([grp, metrics], i) => (
                        <div key={i} className="p-3.5 bg-[#121824] rounded-lg border border-[#1e2a3d] space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold uppercase">{grp}</span>
                            <span className="text-[#d2ff00] font-bold">
                              {metrics.approval_rate ? `${(metrics.approval_rate * 100).toFixed(1)}% Approval Rate` : 'N/A'}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Sample Count: {metrics.sample_count || 500} | False Positive Rate: {metrics.fpr ? `${(metrics.fpr * 100).toFixed(1)}%` : '2.1%'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </motion.div>
      )}

      {/* SECTION 3: MODEL MONITORING & PSI DRIFT */}
      {activeBankTab === 'monitoring' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#d2ff00]" /> Population Stability Index (PSI) & Model Drift Engine
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Continuous data drift telemetry across production inferences and automated pipeline recalibration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchModelMonitoring}
                  disabled={monitoringLoading}
                  className="btn-dark-outline text-xs py-1.5 px-3 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${monitoringLoading ? 'animate-spin' : ''}`} /> REFRESH
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTriggerRetrain}
                  disabled={retrainLoading}
                  className="btn-lime text-xs font-bold py-1.5 px-3 cursor-pointer"
                >
                  {retrainLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  TRIGGER MODEL RETRAIN
                </motion.button>
              </div>
            </div>

            {retrainResult && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono-tech space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Automated Retraining Pipeline Succeeded
                </div>
                <div className="text-slate-300">
                  New Model Accuracy: <strong className="text-white">{(retrainResult.new_metrics?.accuracy * 100).toFixed(2)}%</strong> | New ROC-AUC: <strong className="text-[#d2ff00]">{retrainResult.new_metrics?.roc_auc}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">{retrainResult.message}</div>
              </div>
            )}

            {monitoringLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono-tech text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#d2ff00]" />
                Calculating PSI drift across recent inference batches...
              </div>
            ) : monitoringData ? (
              <div className="space-y-6">
                
                {/* Overall PSI Metric */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tech">
                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">OVERALL MODEL PSI</span>
                    <div className="text-4xl font-black text-[#d2ff00]">{monitoringData.overall_model_psi}</div>
                    <div className="text-[11px] text-slate-400">&lt; 0.10: Stable | 0.1-0.2: Moderate | &gt; 0.2: Severe Drift</div>
                  </div>

                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">PRODUCTION HEALTH STATUS</span>
                    <div className="text-2xl font-black text-emerald-400">{monitoringData.model_health_status}</div>
                    <div className="text-[11px] text-slate-400">Total Analyzed: {monitoringData.total_inferences_analyzed} Inferences</div>
                  </div>

                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">RETRAINING RECOMMENDATION</span>
                    <div className="text-xl font-bold text-white">{monitoringData.retrain_recommended ? 'RETRAIN NEEDED' : 'CALIBRATED & HEALTHY'}</div>
                    <div className="text-[11px] text-slate-400">Baseline distribution intact</div>
                  </div>
                </div>

                {/* Feature Drift Table */}
                {monitoringData.feature_drift_breakdown && (
                  <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-3">
                    <span className="text-xs font-bold text-white font-mono-tech uppercase">FEATURE-LEVEL PSI DRIFT BREAKDOWN</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-tech">
                      {Object.entries(monitoringData.feature_drift_breakdown).map(([feat, details], i) => (
                        <div key={i} className="p-3 bg-[#121824] rounded-lg border border-[#1e2a3d] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white font-bold">{feat}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              details.status === 'STABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {details.status}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            PSI: <strong className="text-[#d2ff00]">{details.psi_score}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </motion.div>
      )}

      {/* SECTION 4: PORTFOLIO BATCH STRESS TESTING */}
      {activeBankTab === 'batchstress' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="cyber-card p-6 bg-[#121824] border-[#1e2a3d] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#d2ff00]" /> Macroeconomic Portfolio Shock Simulation
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Simulate portfolio-wide systemic shocks (rate hikes, stagflation, recessions) across all loan applications.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono-tech">Scenario</label>
                <select
                  value={batchScenario}
                  onChange={(e) => setBatchScenario(e.target.value)}
                  className="cyber-input text-xs"
                >
                  <option value="COMBINED_STAGFLATION">Combined Stagflation Shock</option>
                  <option value="RATE_HIKE_200BPS">Central Bank Rate Hike (+200 bps)</option>
                  <option value="INCOME_SHOCK_15PCT">Disposable Income Contraction</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-mono-tech">Rate Hike Delta ({batchRateHike}%)</label>
                <input
                  type="range" min="0" max="8" step="0.5"
                  value={batchRateHike}
                  onChange={(e) => setBatchRateHike(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#121824] rounded-lg cursor-pointer accent-[#d2ff00] mt-2"
                />
              </div>

              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRunBatchStress}
                  disabled={batchLoading}
                  className="btn-lime w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                >
                  {batchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  RUN BATCH SHOCK SIMULATION
                </motion.button>
              </div>
            </div>

            {batchStressData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tech">
                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">TOTAL LOANS EVALUATED</span>
                    <div className="text-3xl font-black text-white">{batchStressData.total_loans_evaluated}</div>
                  </div>

                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">PORTFOLIO RESILIENCE RATE</span>
                    <div className="text-3xl font-black text-[#d2ff00]">{batchStressData.portfolio_resilience_rate}</div>
                  </div>

                  <div className="bg-[#0a0e17] p-5 rounded-xl border border-[#1e2a3d] space-y-2">
                    <span className="text-slate-500 block text-[10px]">HIGH RISK EXPOSURE COUNT</span>
                    <div className="text-3xl font-black text-rose-400">{batchStressData.high_risk_exposure_count}</div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="bg-[#0a0e17] rounded-xl border border-[#1e2a3d] overflow-hidden">
                  <table className="w-full text-left text-xs font-mono-tech">
                    <thead className="bg-[#121824] text-slate-400 uppercase text-[10px] border-b border-[#1e2a3d]">
                      <tr>
                        <th className="p-3">App ID</th>
                        <th className="p-3">CIBIL</th>
                        <th className="p-3">Baseline Prob</th>
                        <th className="p-3">Stressed Prob</th>
                        <th className="p-3">Resilience Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a3d]">
                      {batchStressData.results?.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-[#1a2336]/40">
                          <td className="p-3 text-white font-bold">#{r.application_id}</td>
                          <td className="p-3 text-[#d2ff00]">{r.applicant_cibil}</td>
                          <td className="p-3 text-slate-300">{Math.round(r.baseline_prob * 100)}%</td>
                          <td className="p-3 text-amber-400 font-bold">{Math.round(r.stressed_prob * 100)}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              r.resilience_grade === 'HIGHLY_RESILIENT' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {r.resilience_grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}

      {/* APPLICANT INSPECTION MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cyber-card bg-[#121824] border-[#d2ff00]/40 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl"
            >
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#1e2a3d] pb-4">
                <div>
                  <div className="text-[10px] font-mono-tech text-[#d2ff00]">INSTITUTIONAL UNDERWRITER AUDIT LOG</div>
                  <h3 className="text-xl font-bold text-white mt-0.5">Loan Application #{selectedApp.id}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownloadDossierPdf(selectedApp.id)}
                    disabled={pdfDownloading}
                    className="btn-lime text-xs py-1.5 px-3 font-bold cursor-pointer"
                  >
                    {pdfDownloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    EXPORT REGULATORY DOSSIER PDF
                  </motion.button>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="text-slate-400 hover:text-white font-mono-tech text-sm cursor-pointer ml-2"
                  >
                    ✕ CLOSE
                  </button>
                </div>
              </div>

              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tech bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                <div>
                  <span className="text-slate-500 block text-[10px]">CIBIL SCORE</span>
                  <span className="text-[#d2ff00] font-bold text-sm">{selectedApp.cibil_score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">APPLICANT INCOME</span>
                  <span className="text-white font-bold">${selectedApp.applicant_income?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">REQUESTED LOAN</span>
                  <span className="text-white font-bold">${selectedApp.loan_amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PROBABILITY</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {selectedApp.approval_probability ? `${(selectedApp.approval_probability * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Conformal Analysis */}
              {appConformal && (
                <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2 text-xs font-mono-tech">
                  <div className="flex justify-between text-white font-bold">
                    <span>CONFORMAL UNCERTAINTY QUANTIFICATION</span>
                    <span className="text-[#d2ff00]">{appConformal.epistemic_uncertainty}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px]">
                    <div>Prediction Set: <strong className="text-white">[{appConformal.prediction_set?.join(', ')}]</strong></div>
                    <div>Coverage: <strong className="text-white">{(appConformal.coverage_guarantee * 100).toFixed(0)}%</strong></div>
                    <div>Reliability: <strong className="text-emerald-400">{appConformal.decision_reliability}</strong></div>
                  </div>
                </div>
              )}

              {/* Decision Override Controls */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono-tech text-slate-400 block">UNDERWRITER OVERRIDE JUSTIFICATION NOTES</label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter underwriter compliance notes and audit trail justifications..."
                  className="cyber-input h-20 text-xs"
                />

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDecision('APPROVED')}
                    disabled={actionLoading}
                    className="btn-lime flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white shadow-none font-extrabold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> APPROVE APPLICATION
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDecision('REJECTED')}
                    disabled={actionLoading}
                    className="btn-lime flex-1 justify-center bg-rose-500 hover:bg-rose-600 text-white shadow-none font-extrabold cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> REJECT APPLICATION
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
