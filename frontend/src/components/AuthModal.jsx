import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Mail, Phone, Briefcase, Landmark, ShieldCheck, 
  ArrowRight, X, Sparkles, CheckCircle2, Globe, Wheat, Building2
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login', initialRole = 'CUSTOMER' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState(initialRole); // 'CUSTOMER' (Farmer/Borrower) | 'BANK_OFFICER'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    occupation: 'Farmer / Agriculture',
    monthly_income: 38000,
    agri_land_acres: 3.5,
    preferred_language: 'hi',
    bank_name: 'State Bank of India (SBI)'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'monthly_income' || name === 'agri_land_acres') ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const res = await axios.post('/api/v1/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        const tokenData = res.data;
        localStorage.setItem('loaniq_token', tokenData.access_token);
        localStorage.setItem('loaniq_user', JSON.stringify(tokenData.user));
        
        if (onAuthSuccess) {
          onAuthSuccess(tokenData.user);
        }
        onClose();
      } else {
        // Registration
        const res = await axios.post('/api/v1/auth/register', {
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          role: role
        });

        // Also update initial profile details
        try {
          await axios.put('/api/v1/auth/profile', {
            full_name: formData.full_name,
            monthly_income: Number(formData.monthly_income),
            employment_type: role === 'CUSTOMER' ? formData.occupation : 'Bank Loan Officer',
            agri_land_acres: Number(formData.agri_land_acres),
            preferred_language: formData.preferred_language,
            phone_number: formData.phone_number
          });
        } catch (e) {
          console.warn("Profile init notice:", e);
        }

        const tokenData = res.data;
        localStorage.setItem('loaniq_token', tokenData.access_token);
        localStorage.setItem('loaniq_user', JSON.stringify(tokenData.user));

        if (onAuthSuccess) {
          onAuthSuccess(tokenData.user);
        }
        onClose();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Fill for Presentations & Demonstrations
  const handleQuickDemo = (demoType) => {
    if (demoType === 'farmer') {
      setRole('CUSTOMER');
      setMode('login');
      setFormData(prev => ({
        ...prev,
        email: 'rameshwar.patil@ruralbharat.in',
        password: 'DemoPassword123'
      }));
    } else if (demoType === 'bank') {
      setRole('BANK_OFFICER');
      setMode('login');
      setFormData(prev => ({
        ...prev,
        email: 'officer.deshmukh@sbi.co.in',
        password: 'DemoPassword123'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#121824] border border-[#d2ff00]/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#d2ff00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(210,255,0,0.3)]">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {mode === 'login' ? 'Account Sign In' : 'Create Individual Account'}
                </h3>
                <p className="text-xs text-slate-400 font-mono-tech">
                  {role === 'CUSTOMER' ? '🌾 Rural & Farmer Credit Portal' : '🏦 Institutional Underwriter'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2336] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Switcher: Farmer vs Bank Officer */}
          <div className="bg-[#0a0e17] p-1 rounded-xl border border-[#1e2a3d] grid grid-cols-2 gap-1 text-xs font-mono-tech font-bold">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'CUSTOMER'
                  ? 'bg-[#d2ff00] text-black shadow-[0_0_12px_rgba(210,255,0,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" /> Farmer / Borrower
            </button>
            <button
              type="button"
              onClick={() => setRole('BANK_OFFICER')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === 'BANK_OFFICER'
                  ? 'bg-[#d2ff00] text-black shadow-[0_0_12px_rgba(210,255,0,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Bank Officer
            </button>
          </div>

          {/* Mode Switcher: Sign In vs Register */}
          <div className="flex border-b border-[#1e2a3d] text-xs font-mono-tech">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-center font-bold border-b-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'border-[#d2ff00] text-[#d2ff00]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-center font-bold border-b-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'border-[#d2ff00] text-[#d2ff00]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              REGISTER
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl font-mono-tech">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">
                  {role === 'CUSTOMER' ? 'Full Name (नाम)' : 'Officer Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={role === 'CUSTOMER' ? 'e.g. Rameshwar Patil' : 'e.g. Officer S. Deshmukh'}
                    className="cyber-input pl-9 text-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-bold">Email / Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={role === 'CUSTOMER' ? 'farmer@ruralbharat.in' : 'officer@sbi.co.in'}
                  className="cyber-input pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-bold">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="cyber-input pl-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Additional Registration Fields */}
            {mode === 'register' && role === 'CUSTOMER' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e2a3d]">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Occupation (व्यवसाय)</label>
                  <select
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="cyber-input text-xs"
                  >
                    <option value="Farmer / Agriculture">🌾 Farmer / Agri</option>
                    <option value="Dairy / Livestock">🥛 Dairy Co-op</option>
                    <option value="Rural Self-Employed / Kirana">🏬 Kirana Store</option>
                    <option value="Artisan / Handloom">🧵 Rural Artisan</option>
                    <option value="Salaried Corporate">💼 Salaried Worker</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Monthly Income (मासिक आय)</label>
                  <input
                    type="number"
                    name="monthly_income"
                    step="1000"
                    value={formData.monthly_income}
                    onChange={handleChange}
                    className="cyber-input text-xs font-mono-tech"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Agri Land (Acres)</label>
                  <input
                    type="number"
                    name="agri_land_acres"
                    step="0.5"
                    value={formData.agri_land_acres}
                    onChange={handleChange}
                    className="cyber-input text-xs font-mono-tech"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Preferred Language</label>
                  <select
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleChange}
                    className="cyber-input text-xs"
                  >
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'register' && role === 'BANK_OFFICER' && (
              <div className="pt-1 border-t border-[#1e2a3d]">
                <label className="text-[11px] text-slate-400 block mb-1">Bank / Institution</label>
                <select
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                  <option value="Bank of Baroda (BoB)">Bank of Baroda (BoB)</option>
                  <option value="Regional Rural Banks (NABARD)">Regional Rural Banks (NABARD)</option>
                  <option value="HDFC Bank Agri">HDFC Bank Agri Finance</option>
                  <option value="Bandhan Bank MSME">Bandhan Bank Rural MSME</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-lime py-2.5 text-xs font-bold shadow-[0_0_20px_rgba(210,255,0,0.3)] mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'SIGN IN TO PORTAL' : 'CREATE INDIVIDUAL ACCOUNT'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Live Presentation */}
          <div className="border-t border-[#1e2a3d] pt-3 text-center space-y-2">
            <span className="text-[10px] font-mono-tech text-slate-500 block uppercase">
              ⚡ 1-Click Presentation Access:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tech">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="p-1.5 rounded-lg bg-[#0a0e17] hover:bg-[#162030] text-slate-300 hover:text-[#d2ff00] border border-[#1e2a3d] transition-all cursor-pointer"
              >
                🌾 Farmer Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('bank')}
                className="p-1.5 rounded-lg bg-[#0a0e17] hover:bg-[#162030] text-slate-300 hover:text-[#d2ff00] border border-[#1e2a3d] transition-all cursor-pointer"
              >
                🏦 Bank Officer Demo
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
