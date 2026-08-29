import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import CustomerPortal from './components/CustomerPortal';
import BankPortal from './components/BankPortal';
import Sandbox from './components/Sandbox';
import AuthModal from './components/AuthModal';
import BorrowerProfileModal from './components/BorrowerProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('customer'); // Default directly to Farmer/Borrower portal
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('loaniq_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData.role === 'BANK_OFFICER') {
      setActiveTab('bank');
    } else {
      setActiveTab('customer');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loaniq_token');
    localStorage.removeItem('loaniq_user');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 selection:bg-[#d2ff00] selection:text-black">
      
      {/* Top Navbar with Individual Identity and Role Selector */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'landing' && (
          <LandingHero onGetStarted={() => setActiveTab('customer')} />
        )}
        {activeTab === 'customer' && (
          <CustomerPortal 
            currentUser={currentUser}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}
        {activeTab === 'bank' && <BankPortal />}
        {activeTab === 'sandbox' && <Sandbox />}
      </main>

      {/* Auth Modal for Individual Login & Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Profile Modal */}
      <BorrowerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(updated) => {
          setCurrentUser(prev => ({ ...prev, ...updated }));
          localStorage.setItem('loaniq_user', JSON.stringify({ ...currentUser, ...updated }));
        }}
      />

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

