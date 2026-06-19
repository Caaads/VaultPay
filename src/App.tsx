import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  History, 
  User, 
  Settings as SettingsIcon, 
  Share2, 
  CheckCircle2, 
  Cpu, 
  Sliders, 
  Activity, 
  HelpCircle,
  PiggyBank,
  Eye,
  EyeOff
} from 'lucide-react';

import HomeTab from '../frontend/src/components/HomeTab.tsx';
import HistoryTab from '../frontend/src/components/HistoryTab.tsx';
import ProfileTab from '../frontend/src/components/ProfileTab.tsx';
import SettingsTab from '../frontend/src/components/SettingsTab.tsx';
import AuthScreen from '../frontend/src/components/AuthScreen.tsx';

interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  token: string;
  memo: string;
  created_at: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('vaultpay_session') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile' | 'settings'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  // Editable Profile Settings State loading from active storage session
  const [profile, setProfile] = useState(() => {
    const sessionUser = localStorage.getItem('vaultpay_active_user');
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch (err) {
        // Fallback
      }
    }
    return {
      firstName: 'Alice',
      lastName: 'Vance',
      email: 'alice.vance@fintech.net',
      phone: '+63 917 123 4567',
      accountNumber: '1043-9843-12',
      balance: 14850.50
    };
  });

  const senderName = `${profile.firstName} ${profile.lastName}`;

  // Helper to parse router tab from pathname
  const getTabFromPath = (path: string): 'home' | 'history' | 'profile' | 'settings' => {
    const p = path.toLowerCase().replace(/\/$/, "");
    if (p.endsWith('/home')) return 'home';
    if (p.endsWith('/history')) return 'history';
    if (p.endsWith('/profile')) return 'profile';
    if (p.endsWith('/settings')) return 'settings';
    return 'home';
  };

  // Sync state with router pathname
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    // Initial Path Analysis
    const initialPath = window.location.pathname;
    const initialTab = getTabFromPath(initialPath);
    setActiveTab(initialTab);

    const validPaths = ['/home', '/history', '/profile', '/settings'];
    if (!validPaths.includes(initialPath)) {
      window.history.replaceState(null, '', '/home');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (tab: 'home' | 'history' | 'profile' | 'settings') => {
    setActiveTab(tab);
    window.history.pushState(null, '', '/' + tab);
  };

  // Fetch tokenized transactional database ledger rows
  const fetchLedger = async () => {
    try {
      setLoading(true);
      const userIdParam = profile?.id ? `?userId=${profile.id}` : '';
      const res = await fetch(`/api/transactions${userIdParam}`);
      const data = await res.json();
      if (data && data.records) {
        setTransactions(data.records);
      }
    } catch (err) {
      console.error('Handshake failed reading server transaction registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [profile?.id]);

  // Handle successful logins from AuthGate
  const handleLoginSuccess = (userDetails: typeof profile) => {
    setProfile(userDetails);
    setIsAuthenticated(true);
    localStorage.setItem('vaultpay_session', 'true');
    localStorage.setItem('vaultpay_active_user', JSON.stringify(userDetails));
  };

  // Sign out workflow
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vaultpay_session');
    localStorage.removeItem('vaultpay_active_user');
  };

  // Update profile attributes from Settings Tab
  const handleSaveSettings = (updatedDetails: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    accountNumber: string 
  }) => {
    setProfile(prev => {
      const next = { ...prev, ...updatedDetails };
      localStorage.setItem('vaultpay_active_user', JSON.stringify(next));
      // Also update in registered list so settings change persists
      const rawUsers = localStorage.getItem('vaultpay_registered_users');
      if (rawUsers) {
        try {
          const users = JSON.parse(rawUsers);
          const updatedUsers = users.map((u: any) => u.phone === prev.phone ? { ...u, ...updatedDetails } : u);
          localStorage.setItem('vaultpay_registered_users', JSON.stringify(updatedUsers));
        } catch (e) {
          // Ignore
        }
      }

      // Sync settings changes to remote database if user is connected
      if (prev.id) {
        fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prev.id, ...updatedDetails })
        }).catch(err => console.error("Database sync settings failed:", err));
      }

      return next;
    });
  };

  // Dedicated balance modifier from HomeTab
  const handleUpdateBalance = (newBalance: number) => {
    setProfile(prev => {
      const next = { ...prev, balance: newBalance };
      localStorage.setItem('vaultpay_active_user', JSON.stringify(next));
      // Sync down to the registered users pool
      const rawUsers = localStorage.getItem('vaultpay_registered_users');
      if (rawUsers) {
        try {
          const users = JSON.parse(rawUsers);
          const updatedUsers = users.map((u: any) => u.phone === prev.phone ? { ...u, balance: newBalance } : u);
          localStorage.setItem('vaultpay_registered_users', JSON.stringify(updatedUsers));
        } catch (e) {
          // Ignore
        }
      }

      // Sync balance to remote database if user is connected
      if (prev.id) {
        fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prev.id, balance: newBalance })
        }).catch(err => console.error("Database sync balance failed:", err));
      }

      return next;
    });
  };

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans transition-all duration-300">
      
      {/* Upper Navigation & Brand Guard Rail (GCash & Maya Premium Theme) */}
      <header className="border-b border-slate-900 bg-[#090d18] sticky top-0 z-30 px-6 py-4 backdrop-blur-md bg-opacity-95">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-indigo-700 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-600/10">
              <div className="w-full h-full bg-[#080d19] rounded-[10px] flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-mono text-sm tracking-widest font-black text-slate-100">VAULTPAY</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/15 uppercase">Secure Hub</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">E-Wallet & Integrated Bank Transfer Demo</p>
            </div>
          </div>

          {/* Wallet Mini Status Indicator & Log Out */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-xs bg-slate-950/60 p-2 px-3.5 rounded-2xl border border-slate-800">
              <div className="text-left font-sans">
                <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-semibold leading-none">Wallet Holder</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{senderName}</p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-right flex items-center space-x-2">
                <div>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-semibold leading-none">Net Balance</p>
                  <div className="flex items-center space-x-1.5 mt-0.5 select-none">
                    <p className="text-xs font-bold text-emerald-400 font-mono">
                      ₱{hideBalance ? '••••••' : profile.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 border border-red-500/15 py-1.5 px-3 rounded-xl transition font-semibold cursor-pointer select-none"
              title="Sign Out of VaultPay"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Core View Area with Tab Controls */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Core Screen Level Tab Switchers */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center text-xs font-semibold">
          <a
            href="/home"
            onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}
            className={`flex-1 py-3 px-2 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
              activeTab === 'home' 
                ? 'bg-indigo-650 text-white border border-indigo-500/20 shadow-md' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">Home</span>
          </a>

          <a
            href="/history"
            onClick={(e) => { e.preventDefault(); handleNavigate('history'); }}
            className={`flex-1 py-3 px-2 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
              activeTab === 'history' 
                ? 'bg-indigo-650 text-white border border-indigo-500/20 shadow-md' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/40'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Remittance History</span>
            <span className="sm:hidden">History</span>
          </a>

          <a
            href="/profile"
            onClick={(e) => { e.preventDefault(); handleNavigate('profile'); }}
            className={`flex-1 py-3 px-2 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
              activeTab === 'profile' 
                ? 'bg-indigo-650 text-white border border-indigo-500/20 shadow-md' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/40'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline font-sans">User Profile</span>
            <span className="sm:hidden">Profile</span>
          </a>

          <a
            href="/settings"
            onClick={(e) => { e.preventDefault(); handleNavigate('settings'); }}
            className={`flex-1 py-3 px-2 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 ${
              activeTab === 'settings' 
                ? 'bg-indigo-650 text-white border border-indigo-500/20 shadow-md' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/40'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Configuration</span>
            <span className="sm:hidden">Settings</span>
          </a>
        </div>

        {/* Dynamic Display Slots */}
        <div className="transition-all duration-300">
          {activeTab === 'home' && (
            <HomeTab
              userId={profile.id}
              senderName={senderName}
              senderPhone={profile.phone}
              senderAccount={profile.accountNumber}
              balance={profile.balance}
              onUpdateBalance={handleUpdateBalance}
              onTransactionSuccess={fetchLedger}
              onNavigate={handleNavigate}
              hideBalance={hideBalance}
              onToggleHideBalance={() => setHideBalance(!hideBalance)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              transactions={transactions}
              onRefresh={fetchLedger}
              loading={loading}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              senderName={senderName}
              senderPhone={profile.phone}
              senderEmail={profile.email}
              senderAccount={profile.accountNumber}
              balance={profile.balance}
              totalTransfers={transactions.length}
              hideBalance={hideBalance}
              onToggleHideBalance={() => setHideBalance(!hideBalance)}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              firstName={profile.firstName}
              lastName={profile.lastName}
              email={profile.email}
              phone={profile.phone}
              accountNumber={profile.accountNumber}
              onSave={handleSaveSettings}
              onNavigate={handleNavigate}
            />
          )}
        </div>

      </main>

      {/* Footer Branding section */}
      <footer className="mt-auto border-t border-slate-900 bg-[#060a12] py-4 text-center text-[10px] text-slate-500 font-mono">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 VaultPay Secure Fintech Gate Inc. All mock rights reserved.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Premium E-Wallet fully compliant verification engine</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
