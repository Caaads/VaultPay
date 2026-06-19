import React from 'react';
import { 
  User, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Hash
} from 'lucide-react';

interface ProfileTabProps {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderAccount: string;
  balance: number;
  totalTransfers: number;
  hideBalance?: boolean;
  onToggleHideBalance?: () => void;
  onNavigate?: (tab: 'home' | 'history' | 'profile' | 'settings') => void;
}

export default function ProfileTab({ 
  senderName, 
  senderPhone, 
  senderEmail, 
  senderAccount, 
  balance,
  totalTransfers,
  hideBalance,
  onToggleHideBalance,
  onNavigate
}: ProfileTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Upper Profile Identity Presentation */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Visual elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl" />
 
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
          <div className="flex items-center space-x-4">
            {/* Mock Profile Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#080d19] rounded-[14px] flex items-center justify-center">
                <User className="w-7 h-7 text-indigo-400" />
              </div>
            </div>
 
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-slate-100">{senderName}</h3>
                <div className="flex items-center space-x-1 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-[9px] font-bold font-mono">
                  <ShieldCheck className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span>FULLY VERIFIED</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">E-Wallet Tier: Premium Fintech Partner</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Acc ID: {senderAccount}</p>
            </div>
          </div>
 
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right sm:text-left min-w-[170px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-widest">Active Balance</p>
              {onToggleHideBalance && (
                <button 
                  type="button"
                  onClick={onToggleHideBalance}
                  className="text-slate-500 hover:text-slate-350 transition p-0.5"
                  title="Toggle balance visibility"
                >
                  {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <p className="text-lg font-black text-emerald-400 font-mono mt-1">₱{hideBalance ? '••••••' : balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Profile Contact Details - Only phone number and email */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-400 flex items-center space-x-2 pb-2 border-b border-slate-800/80">
          <span>Account Contact Details</span>
        </h4>

        <div className="space-y-4 pt-1">
          <div className="flex items-center space-x-3.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">PHONE NUMBER</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{senderPhone}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">EMAIL ADDRESS</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{senderEmail}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">ACCOUNT ID (ACC ID)</span>
              <span className="text-sm font-semibold text-slate-200 font-mono">{senderAccount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Link to the Next Page */}
      {onNavigate && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="group inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150 cursor-pointer"
          >
            <span>Proceed to Configuration Settings (/settings)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

    </div>
  );
}
