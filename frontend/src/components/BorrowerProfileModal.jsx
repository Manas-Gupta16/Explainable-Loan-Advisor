import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Save, X, Sparkles, CheckCircle2, Landmark, 
  Wheat, Sprout, Home, Shield, Phone, IndianRupee, Layers
} from 'lucide-react';

const formatINR = (val) => {
  if (!val || isNaN(val)) return '₹0';
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function BorrowerProfileModal({ isOpen, onClose, profile, onSave }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "Rameshwar Patil",
    employment_type: profile?.employment_type || "Farmer / Agriculture",
    agri_land_acres: profile?.agri_land_acres !== undefined ? profile.agri_land_acres : 3.5,
    kcc_holder: profile?.kcc_holder !== undefined ? profile.kcc_holder : true,
    monthly_income: profile?.monthly_income || 38000,
    coapplicant_income: profile?.coapplicant_income || 0,
    existing_debts_monthly: profile?.existing_debts_monthly || 4500,
    cibil_score: profile?.cibil_score || 695,
    home_ownership: profile?.home_ownership || "Owned - Ancestral / Pucca",
    preferred_language: profile?.preferred_language || "hi",
    phone_number: profile?.phone_number || "+91 98231 45678"
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Persist to backend user profile
      const res = await axios.put('/api/v1/auth/profile', formData);
      setSavedSuccess(true);
      if (onSave) onSave(res.data);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.warn("Backend profile sync note:", err.message);
      // Fallback local save
      if (onSave) onSave(formData);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#121824] border border-[#d2ff00]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#d2ff00]/10 text-[#d2ff00] border border-[#d2ff00]/30 flex items-center justify-center">
                <Wheat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Permanent Borrower Profile (स्थायी प्रोफ़ाइल)
                </h3>
                <p className="text-xs text-slate-400 font-mono-tech">
                  Set once during registration. Auto-fills your loan applications.
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

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono-tech">
            
            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Borrower Full Name (नाम)</label>
                <input 
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                  placeholder="e.g. Rameshwar Patil"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Mobile Number (फ़ोन नंबर)</label>
                <input 
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                  placeholder="+91 98XXX XXXXX"
                />
              </div>
            </div>

            {/* Occupation & Land Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Primary Occupation (मुख्य व्यवसाय)</label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value="Farmer / Agriculture">🌾 Farmer / Agriculture (किसान)</option>
                  <option value="Rural Self-Employed / Kirana">🏬 Village Kirana / Trader (दुकानदार)</option>
                  <option value="Dairy / Livestock">🥛 Dairy & Livestock (पशुपालन / डेयरी)</option>
                  <option value="Salaried">💼 Salaried / Govt / Teacher (वेतनभोगी)</option>
                  <option value="Daily Wage / Labor">🛠️ Rural Artisan / Labor (कारीगर / श्रमिक)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Agricultural Land Holding (कृषि भूमि)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    name="agri_land_acres"
                    value={formData.agri_land_acres}
                    onChange={handleChange}
                    className="cyber-input text-xs"
                  />
                  <span className="text-slate-400 shrink-0">Acres (एकड़)</span>
                </div>
              </div>
            </div>

            {/* Incomes & Debts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0a0e17] p-3.5 rounded-xl border border-[#1e2a3d]">
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Net Monthly Income</label>
                <input 
                  type="number"
                  step="1000"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold text-[#d2ff00]"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">{formatINR(formData.monthly_income * 12)} / year</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Existing Monthly Debts</label>
                <input 
                  type="number"
                  step="500"
                  name="existing_debts_monthly"
                  value={formData.existing_debts_monthly}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Active EMIs / dues</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">TransUnion CIBIL Score</label>
                <input 
                  type="number"
                  min="300"
                  max="850"
                  name="cibil_score"
                  value={formData.cibil_score}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold text-white"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {formData.cibil_score >= 720 ? 'Prime Tier' : formData.cibil_score >= 640 ? 'Near-Prime / KCC' : 'Microfinance Tier'}
                </span>
              </div>
            </div>

            {/* KCC & Home Ownership */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">House Ownership (घर का स्वामित्व)</label>
                <select
                  name="home_ownership"
                  value={formData.home_ownership}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value="Owned - Ancestral / Pucca">Owned - Ancestral / Pucca (पैतृक / पक्का मकान)</option>
                  <option value="Village Gram Panchayat">Village Gram Panchayat House (पंचायत मकान)</option>
                  <option value="Rented">Rented (किराए का)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Preferred Language (पसंदीदा भाषा)</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold text-[#d2ff00]"
                >
                  <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                  <option value="mr">🇮🇳 मराठी (Marathi)</option>
                  <option value="gu">🇮🇳 ગુજરાતી (Gujarati)</option>
                  <option value="bn">🇮🇳 বাংলা (Bengali)</option>
                  <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                  <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="hinglish">🇮🇳 Hinglish</option>
                </select>
              </div>
            </div>

            {/* Kisan Credit Card Subvention Benefit Box */}
            <div className="p-3 bg-[#0a0e17] rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="kcc_check"
                  name="kcc_holder"
                  checked={formData.kcc_holder}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#d2ff00] cursor-pointer rounded"
                />
                <label htmlFor="kcc_check" className="text-xs text-white cursor-pointer select-none">
                  Kisan Credit Card (KCC) Holder / Crop Farmer
                </label>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                4% Subsidized Rate
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-dark-outline flex-1 justify-center py-2.5 text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-lime flex-1 justify-center py-2.5 text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <span>Saving Profile...</span>
                ) : savedSuccess ? (
                  <span className="flex items-center gap-1.5 text-black">
                    <CheckCircle2 className="w-4 h-4" /> Profile Updated!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> Save Permanent Profile
                  </span>
                )}
              </button>
            </div>

          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
