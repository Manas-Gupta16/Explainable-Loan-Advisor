import React from 'react';
import { Cpu, ShieldCheck, Activity, UserCheck, Building2, Sliders } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0e17]/90 backdrop-blur-md border-b border-[#1e2a3d]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-9 h-9 rounded-lg bg-[#d2ff00] text-black font-black flex items-center justify-center text-lg shadow-[0_0_15px_rgba(210,255,0,0.3)]">
            ⚡
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">LoanIQ</span>
            <span className="text-[10px] font-mono-tech text-[#d2ff00] block -mt-1 tracking-wider">XAI PROTOCOL V2.4</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#121824] p-1.5 rounded-xl border border-[#1e2a3d]">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-2 ${
              activeTab === 'landing'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> ARCHITECTURE
          </button>
          
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-2 ${
              activeTab === 'customer'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> CUSTOMER PORTAL
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-2 ${
              activeTab === 'bank'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> BANK DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-lg text-xs font-mono-tech transition-all flex items-center gap-2 ${
              activeTab === 'sandbox'
                ? 'bg-[#d2ff00] text-black font-bold shadow-[0_0_12px_rgba(210,255,0,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> XAI SANDBOX
          </button>
        </nav>

        {/* System Active Badge */}
        <div className="flex items-center gap-3">
          <div className="tech-badge-lime flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d2ff00] animate-ping" />
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
