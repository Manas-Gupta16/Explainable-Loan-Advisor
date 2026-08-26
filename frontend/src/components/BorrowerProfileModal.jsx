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

const MODAL_I18N = {
  hi: {
    title: "स्थायी उधारकर्ता व किसान प्रोफ़ाइल",
    subtitle: "यह जानकारी आपके सभी भावी ऋण आवेदनों के लिए सुरक्षित रहेगी।",
    name_label: "उधारकर्ता का पूरा नाम",
    phone_label: "मोबाइल नंबर",
    occ_label: "मुख्य व्यवसाय",
    land_label: "कृषि भूमि (एकड़ में)",
    kcc_label: "किसान क्रेडिट कार्ड (KCC 4% ब्याज छूट धारक)",
    income_label: "मासिक कृषि व शुद्ध आय (₹)",
    debts_label: "मौजूदा मासिक ऋण किश्तें (₹)",
    cibil_label: "सिबिल स्कोर",
    home_label: "मकान का स्वामित्व",
    lang_label: "पसंदीदा भाषा",
    save_btn: "प्रोफ़ाइल सुरक्षित करें",
    saving_btn: "सुरक्षित हो रहा है...",
    saved_badge: "प्रोफ़ाइल सफलतापूर्वक सुरक्षित हुई!",
    occupations: {
      "Farmer / Agriculture": "🌾 किसान / कृषि कार्य",
      "Rural Self-Employed / Kirana": "🏬 ग्रामीण किराना व व्यापार",
      "Dairy / Livestock": "🥛 डेयरी व पशुपालन",
      "Salaried": "💼 वेतनभोगी / सरकारी नौकरी",
      "Daily Wage / Labor": "🛠️ ग्रामीण कारीगर / श्रमिक"
    },
    homes: {
      "Owned - Ancestral / Pucca": "🏠 पैतृक / पक्का मकान",
      "Gram Panchayat / Pucca": "🏡 ग्राम पंचायत पट्टा / आवास",
      "Rented / Semi-Pucca": "🚪 किराए का मकान"
    }
  },
  mr: {
    title: "कायमस्वरूपी कर्जदार व शेतकरी प्रोफाइल",
    subtitle: "हा तपशील तुमच्या सर्व भावी कर्ज अर्जांसाठी सुरक्षित राहील.",
    name_label: "कर्जदाराचे पूर्ण नाव",
    phone_label: "मोबाईल नंबर",
    occ_label: "मुख्य व्यवसाय",
    land_label: "शेती जमीन (एकरमध्ये)",
    kcc_label: "किसान क्रेडिट कार्ड (KCC 4% सवलत धारक)",
    income_label: "मासिक शेती व निव्वळ उत्पन्न (₹)",
    debts_label: "सध्याचे मासिक कर्ज हप्ते (₹)",
    cibil_label: "सिबिल स्कोअर",
    home_label: "घराचे स्वामित्व",
    lang_label: "पसंतीची भाषा",
    save_btn: "प्रोफाइल जतन करा",
    saving_btn: "जतन होत आहे...",
    saved_badge: "प्रोफाइल यशस्वीरीत्या जतन झाली!",
    occupations: {
      "Farmer / Agriculture": "🌾 शेतकरी / कृषी व्यवसाय",
      "Rural Self-Employed / Kirana": "🏬 ग्रामीण किराणा व व्यवसाय",
      "Dairy / Livestock": "🥛 दुग्धव्यवसाय व पशुपालन",
      "Salaried": "💼 पगारदार / नोकरदार",
      "Daily Wage / Labor": "🛠️ ग्रामीण कारागीर / मजूर"
    },
    homes: {
      "Owned - Ancestral / Pucca": "🏠 वडिलोपार्जित / पक्के घर",
      "Gram Panchayat / Pucca": "🏡 ग्रामपंचायत पट्टा / घर",
      "Rented / Semi-Pucca": "🚪 भाड्याचे घर"
    }
  },
  en: {
    title: "Permanent Borrower Profile",
    subtitle: "Saved permanently across all your future loan applications.",
    name_label: "Borrower Full Name",
    phone_label: "Mobile Number",
    occ_label: "Primary Occupation",
    land_label: "Agricultural Land Holding (Acres)",
    kcc_label: "Kisan Credit Card (KCC 4% Subvention Holder)",
    income_label: "Net Monthly Income (₹)",
    debts_label: "Existing Monthly Loan EMIs (₹)",
    cibil_label: "CIBIL Score",
    home_label: "Residential Home Ownership",
    lang_label: "Preferred Language",
    save_btn: "SAVE BORROWER PROFILE",
    saving_btn: "SAVING PROFILE...",
    saved_badge: "Profile Saved Successfully!",
    occupations: {
      "Farmer / Agriculture": "🌾 Farmer / Agriculture",
      "Rural Self-Employed / Kirana": "🏬 Village Kirana / Trader",
      "Dairy / Livestock": "🥛 Dairy & Livestock Development",
      "Salaried": "💼 Salaried / Govt / Teacher",
      "Daily Wage / Labor": "🛠️ Rural Artisan / Labor"
    },
    homes: {
      "Owned - Ancestral / Pucca": "🏠 Owned - Ancestral / Pucca House",
      "Gram Panchayat / Pucca": "🏡 Gram Panchayat Patta / Rural Pucca",
      "Rented / Semi-Pucca": "🚪 Rented / Semi-Pucca"
    }
  }
};

export default function BorrowerProfileModal({ isOpen, onClose, profile, onSave, currentLanguage = "hi" }) {
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
    preferred_language: profile?.preferred_language || currentLanguage || "hi",
    phone_number: profile?.phone_number || "+91 98231 45678"
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const t = MODAL_I18N[currentLanguage] || MODAL_I18N.hi;

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
      const res = await axios.put('/api/v1/auth/profile', formData);
      setSavedSuccess(true);
      if (onSave) onSave(res.data);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to update borrower profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#121824] border border-[#d2ff00]/40 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d2ff00] text-black flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono-tech">
                  {t.subtitle}
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
                <label className="text-slate-300 block mb-1">{t.name_label}</label>
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
                <label className="text-slate-300 block mb-1">{t.phone_label}</label>
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
                <label className="text-slate-300 block mb-1">{t.occ_label}</label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value="Farmer / Agriculture">{t.occupations["Farmer / Agriculture"]}</option>
                  <option value="Rural Self-Employed / Kirana">{t.occupations["Rural Self-Employed / Kirana"]}</option>
                  <option value="Dairy / Livestock">{t.occupations["Dairy / Livestock"]}</option>
                  <option value="Salaried">{t.occupations["Salaried"]}</option>
                  <option value="Daily Wage / Labor">{t.occupations["Daily Wage / Labor"]}</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">{t.land_label}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    name="agri_land_acres"
                    value={formData.agri_land_acres}
                    onChange={handleChange}
                    className="cyber-input text-xs font-bold text-[#d2ff00]"
                  />
                  <span className="text-slate-400 text-xs shrink-0">Acres</span>
                </div>
              </div>
            </div>

            {/* Kisan Credit Card (KCC) Subvention Toggle */}
            <div className="p-3 rounded-xl bg-[#0a0e17] border border-[#1e2a3d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wheat className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {t.kcc_label}
                  </span>
                  <span className="text-[11px] text-slate-400 font-light">
                    {currentLanguage === 'hi' ? '3% त्वरित पुनर्भुगतान छूट के साथ 4.0% प्रभावी ब्याज दर' : currentLanguage === 'mr' ? '3% वेळेवर परतफेड सवलतीसह 4.0% प्रभावी व्याजदर' : 'Net 4.0% effective interest rate with 3% prompt repayment subvention'}
                  </span>
                </div>
              </div>

              <input 
                type="checkbox"
                name="kcc_holder"
                checked={formData.kcc_holder}
                onChange={handleChange}
                className="w-5 h-5 accent-[#d2ff00] cursor-pointer rounded"
              />
            </div>

            {/* Income & Debts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">{t.income_label}</label>
                <input 
                  type="number"
                  step="1000"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">{t.debts_label}</label>
                <input 
                  type="number"
                  step="500"
                  name="existing_debts_monthly"
                  value={formData.existing_debts_monthly}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                />
              </div>
            </div>

            {/* CIBIL & Home Ownership */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">{t.cibil_label}</label>
                <input 
                  type="number"
                  min="300"
                  max="900"
                  name="cibil_score"
                  value={formData.cibil_score}
                  onChange={handleChange}
                  className="cyber-input text-xs font-bold text-[#d2ff00]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">{t.home_label}</label>
                <select
                  name="home_ownership"
                  value={formData.home_ownership}
                  onChange={handleChange}
                  className="cyber-input text-xs"
                >
                  <option value="Owned - Ancestral / Pucca">{t.homes["Owned - Ancestral / Pucca"]}</option>
                  <option value="Gram Panchayat / Pucca">{t.homes["Gram Panchayat / Pucca"]}</option>
                  <option value="Rented / Semi-Pucca">{t.homes["Rented / Semi-Pucca"]}</option>
                </select>
              </div>
            </div>

            {/* Language Preference */}
            <div>
              <label className="text-slate-300 block mb-1">{t.lang_label}</label>
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

            {/* Save Button */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="btn-lime w-full justify-center py-3 text-xs font-black tracking-wide cursor-pointer flex items-center gap-2"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>{t.saved_badge}</span>
                  </>
                ) : saving ? (
                  <span>{t.saving_btn}</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t.save_btn}</span>
                  </>
                )}
              </motion.button>
            </div>

          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
