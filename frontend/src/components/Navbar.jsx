import React from 'react';
import { Cpu, ShieldCheck, Activity, UserCheck, Building2, Sliders, Wheat, User, LogOut, LogIn } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuth, onLogout, onOpenProfile }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0e17]/90 backdrop-blur-md border-b border-[#1e2a3d]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('landing')}>
          <div className="w-9 h-9 rounded-lg bg-[#d2ff00] text-black font-black flex items-center justify-center text-lg shadow-[0_0_15px_rgba(210,255,0,0.3)]">
            ⚡
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">LoanIQ</span>
            <span className="text-[10px] font-mono-tech text-[#d2ff00] block -mt-1 tracking-wider">INDIVIDUAL XAI PLATFORM</span>
          </div>
        </div>

        {/* Clear Role Switcher Tabs (Farmer vs Bank Dashboard) */}
        <div className="flex items-center gap-1.5 bg-[#121824] p-1 rounded-xl border border-[#1e2a3d]">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" /> 🌾 FARMER / BORROWER
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> 🏦 BANK DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-all hidden md:flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> XAI LAB
          </button>
        </div>

        {/* Right Controls: User Profile & Individual Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#121824] border border-[#1e2a3d] pl-3 pr-1.5 py-1 rounded-xl text-xs font-mono-tech">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-[#d2ff00] transition-colors"
                onClick={onOpenProfile}
              >
                <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-pulse" />
                <span className="font-bold text-white max-w-[130px] truncate">{currentUser.full_name || 'Individual User'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline">
                  {currentUser.role === 'BANK_OFFICER' ? 'Bank Officer' : 'Farmer'}
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#1e2a3d] transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-lime text-xs font-bold py-1.5 px-3 shadow-[0_0_15px_rgba(210,255,0,0.2)] cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN / REGISTER</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

