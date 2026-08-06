import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, CheckCircle2, XCircle, Clock, Eye, 
  FileText, ShieldAlert, BarChart3, Search, Filter, Sparkles 
} from 'lucide-react';

export default function BankPortal() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16"
    >
      
      {/* Header */}
      <div className="border-b border-[#1e2a3d] pb-6 flex justify-between items-end">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#d2ff00] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>● INSTITUTIONAL UNDERWRITING DASHBOARD</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Bank Credit Risk & <span className="text-[#d2ff00]">Compliance Portal</span>
          </h1>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchApplications} 
          className="btn-dark-outline text-xs"
        >
          REFRESH QUEUE
        </motion.button>
      </div>

      {/* KPI Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div 
          whileHover={{ y: -4 }}
          className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]"
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-mono-tech uppercase">TOTAL APPLICATIONS</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Live queue count</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]"
        >
          <div className="flex justify-between items-start text-amber-400">
            <span className="text-[10px] font-mono-tech uppercase">PENDING REVIEW</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {applications.filter(a => a.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Action required</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]"
        >
          <div className="flex justify-between items-start text-emerald-400">
            <span className="text-[10px] font-mono-tech uppercase">APPROVED APPLICATIONS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            {applications.filter(a => a.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono-tech mt-1">Cleared risk threshold</div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="cyber-card p-5 bg-[#121824] border-[#1e2a3d]"
        >
          <div className="flex justify-between items-start text-[#d2ff00]">
            <span className="text-[10px] font-mono-tech uppercase">AVERAGE ROC-AUC</span>
            <BarChart3 className="w-4 h-4 text-[#d2ff00]" />
          </div>
          <div className="text-3xl font-black text-white mt-2">0.9658</div>
          <div className="text-[11px] text-[#d2ff00] font-mono-tech mt-1">High confidence model</div>
        </motion.div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e2a3d] pb-3">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <motion.button
            key={st}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono-tech transition-all ${
              filterStatus === st
                ? 'bg-[#d2ff00] text-black font-bold'
                : 'bg-[#121824] text-slate-400 border border-[#1e2a3d] hover:text-white'
            }`}
          >
            {st}
          </motion.button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="cyber-card p-0 bg-[#121824] border-[#1e2a3d] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono-tech text-xs">
            Loading queue from database...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono-tech text-xs">
            No loan applications found in this status queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0e17] text-slate-400 font-mono-tech uppercase text-[10px] border-b border-[#1e2a3d]">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Loan Requested</th>
                  <th className="p-4">CIBIL</th>
                  <th className="p-4">Risk Tier</th>
                  <th className="p-4">Probability</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a3d] font-mono-tech">
                {applications.map((app, idx) => (
                  <motion.tr 
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-[#1a2336]/50 transition-colors"
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
                    <td className="p-4 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedApp(app)}
                        className="btn-dark-outline py-1 px-3 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> INSPECT XAI
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Applicant XAI Inspection Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="cyber-card bg-[#121824] border-[#d2ff00]/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl"
            >
              
              <div className="flex justify-between items-start border-b border-[#1e2a3d] pb-4">
                <div>
                  <div className="text-[10px] font-mono-tech text-[#d2ff00]">APPLICANT INSPECTION LOG</div>
                  <h3 className="text-xl font-bold text-white mt-0.5">Application #{selectedApp.id}</h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400 hover:text-white font-mono-tech text-sm"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Financial Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono-tech bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d]">
                <div>
                  <span className="text-slate-500 block">CIBIL SCORE</span>
                  <span className="text-[#d2ff00] font-bold text-sm">{selectedApp.cibil_score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">APPLICANT INCOME</span>
                  <span className="text-white font-bold">${selectedApp.applicant_income?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">REQUESTED LOAN</span>
                  <span className="text-white font-bold">${selectedApp.loan_amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">EXISTING DEBTS</span>
                  <span className="text-slate-300">${selectedApp.existing_debts?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">EMPLOYMENT</span>
                  <span className="text-slate-300">{selectedApp.employment_status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HOME OWNERSHIP</span>
                  <span className="text-slate-300">{selectedApp.home_ownership}</span>
                </div>
              </div>

              {/* Decision Controls */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono-tech text-slate-400 block">UNDERWRITER OVERRIDE NOTES</label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter justification notes for approval/rejection decision..."
                  className="cyber-input h-20 text-xs"
                />

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDecision('APPROVED')}
                    disabled={actionLoading}
                    className="btn-lime flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white shadow-none font-extrabold"
                  >
                    <CheckCircle2 className="w-4 h-4" /> APPROVE LOAN
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDecision('REJECTED')}
                    disabled={actionLoading}
                    className="btn-lime flex-1 justify-center bg-rose-500 hover:bg-rose-600 text-white shadow-none font-extrabold"
                  >
                    <XCircle className="w-4 h-4" /> REJECT LOAN
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
