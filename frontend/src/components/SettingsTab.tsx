import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Mail, 
  Phone, 
  HelpCircle, 
  CheckCircle2, 
  Sliders, 
  Save, 
  Hash, 
  AlertCircle,
  ArrowRight,
  Database,
  Copy,
  Check
} from 'lucide-react';

interface SettingsTabProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountNumber: string;
  onSave: (data: { firstName: string; lastName: string; email: string; phone: string; accountNumber: string }) => void;
  onNavigate?: (tab: 'home' | 'history' | 'profile' | 'settings') => void;
}

export default function SettingsTab({ 
  firstName, 
  lastName, 
  email, 
  phone, 
  accountNumber, 
  onSave,
  onNavigate
}: SettingsTabProps) {
  const [fName, setFName] = useState(firstName);
  const [lName, setLName] = useState(lastName);
  const [mail, setMail] = useState(email);
  const [ph, setPh] = useState(phone);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const [copied, setCopied] = useState(false);
  const sqlSchema = `-- 1. Create the Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  pin TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the Transactions table (connected to users table)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  token TEXT NOT NULL,
  memo TEXT,
  receiver_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    // Dynamic checks
    if (!fName.trim() || !lName.trim()) {
      setErrorMsg('Profile First and Last names are mandatory.');
      return;
    }

    if (!mail.includes('@')) {
      setErrorMsg('Please enter a valid email.');
      return;
    }

    if (ph.replace(/\D/g, '').length < 8) {
      setErrorMsg('Phone numbers must be at least 8 digits to satisfy compliance checks.');
      return;
    }

    // Trigger save callback up to App.tsx
    onSave({
      firstName: fName.trim(),
      lastName: lName.trim(),
      email: mail.trim(),
      phone: ph.trim(),
      accountNumber: accountNumber // original uneditable prop
    });

    setSuccess(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Settings Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
            <Settings className="w-4.5 h-4.5 text-indigo-400" />
            <span>Interactive Terminal Settings</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">Set persistent mock credentials of the primary account holder</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative">
        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          <div className="flex items-center space-x-2.5 text-slate-300 border-b border-slate-800/60 pb-3 mb-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs uppercase tracking-wider font-semibold font-mono">E-Wallet Holder Profile Details</span>
          </div>

          {/* Profile Name (First, Last) Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-fname" className="text-xs font-semibold text-slate-300 block mb-1.5">First Name <span className="text-indigo-400">*</span></label>
              <div className="relative">
                <input
                  id="settings-fname"
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="settings-lname" className="text-xs font-semibold text-slate-300 block mb-1.5">Last Name <span className="text-indigo-400">*</span></label>
              <div className="relative">
                <input
                  id="settings-lname"
                  type="text"
                  required
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none"
                />
              </div>
            </div>
          </div>

          {/* Account Details Specs */}
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="settings-email" className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  id="settings-email"
                  type="email"
                  required
                  disabled
                  value={mail}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-400 font-mono outline-none opacity-60 cursor-not-allowed"
                />
                <div className="absolute left-3.5 top-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="settings-phone" className="text-xs font-semibold text-slate-300 block mb-1.5">Phone Number</label>
              <div className="relative">
                <input
                  id="settings-phone"
                  type="text"
                  required
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-10 py-2.5 text-sm text-slate-100 transition font-mono outline-none"
                />
                <div className="absolute left-3.5 top-3 text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback states */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fintech wallet identity profile updated successfully!</span>
            </div>
          )}

          {/* Trigger button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-widest transition duration-200 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Compliance Settings</span>
          </button>

        </form>
      </div>

       {/* Redirect/Next Link */}
      {onNavigate && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="group inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150 cursor-pointer"
          >
            <span>Back to Home (/home)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

    </div>
  );
}
