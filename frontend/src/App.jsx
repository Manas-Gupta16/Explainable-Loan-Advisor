import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import CustomerPortal from './components/CustomerPortal';
import BankPortal from './components/BankPortal';
import Sandbox from './components/Sandbox';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 selection:bg-[#d2ff00] selection:text-black">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {activeTab === 'landing' && (
          <LandingHero onGetStarted={() => setActiveTab('customer')} />
        )}
        {activeTab === 'customer' && <CustomerPortal />}
        {activeTab === 'bank' && <BankPortal />}
        {activeTab === 'sandbox' && <Sandbox />}
      </main>

      {/* Minimal Tech Footer */}
      <footer className="border-t border-[#1e2a3d] mt-20 py-8 bg-[#0a0e17] text-xs font-mono-tech text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-white font-bold">LoanIQ Protocol</span> — Explainable AI (XAI) Smart Loan Advisor
          </div>
          <div className="flex gap-6 text-slate-400">
            <span>RAMDEOBABA UNIVERSITY</span>
            <span>IDEA LAB 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
