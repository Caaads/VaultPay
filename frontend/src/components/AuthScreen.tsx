import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  Lock, 
  Phone, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  User
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (userDetails: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    accountNumber: string;
    balance: number;
  }) => void;
}

const STORAGE_USERS_KEY = 'vaultpay_registered_users';

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Register Form States
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPin, setShowRegPin] = useState(false);


  // Feedback States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);



  // Quick normalized helper for local 11-digit phone numbers starting with 09
  const normalizePhoneNumber = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 11 || !clean.startsWith('09')) return null;
    return '+63' + clean.substring(1);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmail = loginPhone.includes('@');
    let normPhone = '';

    if (!isEmail) {
      const parsed = normalizePhoneNumber(loginPhone);
      if (!parsed) {
        setError('Login phone number must be exactly 11 digits starting with 09.');
        return;
      }
      normPhone = parsed;
    } else {
      if (!loginPhone.trim() || !loginPhone.includes('.')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (!loginPassword) {
      setError('Password is required.');
      return;
    }

    if (loginPin.length !== 4 || !/^\d+$/.test(loginPin)) {
      setError('Security PIN must be exactly 4 digits.');
      return;
    }

    try {
      // Attempt backend Database lookup first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: isEmail ? loginPhone.trim().toLowerCase() : normPhone,
          password: loginPassword,
          pin: loginPin
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success && data.user) {
          // Logged in with remote database!
          setSuccess(`Welcome back, ${data.user.firstName}! (Connected to Supabase)`);
          setTimeout(() => {
            onLoginSuccess({
              id: data.user.id, // Database user UUID!
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              email: data.user.email,
              phone: data.user.phone,
              accountNumber: data.user.accountNumber,
              balance: data.user.balance
            });
          }, 850);
        } else {
          setError(data.error || 'Authentication failed.');
        }
      } else {
        setError(data.error || 'Identity gate connectivity mismatch.');
      }
    } catch (err: any) {
      setError('Network handshake error connecting to auth server.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regFirstName.trim() || !regLastName.trim()) {
      setError('First name and Last name are required.');
      return;
    }

    const normPhone = normalizePhoneNumber(regPhone);
    if (!normPhone) {
      setError('Registration phone number must be exactly 11 digits starting with 09.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPin.length !== 4 || !/^\d+$/.test(regPin)) {
      setError('Your security PIN must be exactly 4 digits.');
      return;
    }

    // Generate random Account Number (e.g. 1043-9843-12 format)
    const randomAccNum = Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(10 + Math.random() * 90);
    const starterBalance = 10000.00;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          email: regEmail.trim(),
          phone: normPhone,
          password: regPassword,
          pin: regPin,
          accountNumber: randomAccNum,
          balance: starterBalance
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          setSuccess('Registration successful in secure database! Please check your email for verification before signing in.');
          setIsRegister(false);
          setLoginPhone(regPhone);
        } else {
          setError(data.error || 'Registration failed.');
        }
      } else {
        setError(data.error || 'Server rejected registration.');
      }
    } catch (err: any) {
      setError('Network validation failure connecting to registry server.');
    }
  };

  // Seed default credentials info on bottom for the user
  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience Dots & Glows */}
      <div className="absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="w-[300px] h-[300px] -ml-[200px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Banner header top bar */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <div className="w-full h-full bg-[#080d19] rounded-[14px] flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-2">
              <h1 className="font-mono text-base tracking-widest font-black text-slate-100">VAULTPAY</h1>
                        </div>
            <p className="text-xs text-slate-400">Instapay Quick Remittance Sovereign Gateway</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
              !isRegister
                ? 'bg-slate-850 text-slate-100 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
              isRegister
                ? 'bg-slate-850 text-slate-100 border border-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Error / Success Notices */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{success}</span>
          </div>
        )}

        {/* Login Form */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-phone" className="text-xs font-semibold text-slate-400 flex justify-between">
                <span>Phone Number or Email</span>
                <span className="text-[10px] text-slate-500 italic">
                  {loginPhone.includes('@') ? 'Email format active' : '11-digit local format'}
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-phone"
                  type={loginPhone.includes('@') ? "email" : "text"}
                  placeholder={loginPhone.includes('@') ? "email@domain.com" : "0917 123 4567 (11 digits)"}
                  value={loginPhone}
                  onChange={(e) => {
                    let val = e.target.value;
                    const hasAlpha = /[a-zA-Z@]/.test(val);
                    if (!hasAlpha) {
                      val = val.replace(/\D/g, '').slice(0, 11);
                    }
                    setLoginPhone(val);
                  }}
                  className={`w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 transition outline-none ${
                    loginPhone.includes('@') ? 'font-sans' : 'font-mono'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-400">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4-digit Security PIN Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-pin" className="text-xs font-semibold text-slate-400 flex justify-between">
                <span>4-Digit Security PIN</span>
                <span className="text-[10px] text-indigo-400">GCash/Maya Style PIN</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="login-pin"
                  type={showLoginPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 font-mono tracking-[0.6em] transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPin(!showLoginPin)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Banner Button */}
            <button
              type="submit"
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Unlock Vault Dashboard</span>
              <LogIn className="w-4 h-4" />
            </button>

          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            {/* Registration Name Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">First Name</label>
                <input
                  type="text"
                  placeholder="Alice"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 transition outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Last Name</label>
                <input
                  type="text"
                  placeholder="Vance"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 transition outline-none"
                  required
                />
              </div>
            </div>

            {/* Registration Email */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                placeholder="alice@vance.net"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 transition outline-none"
                required
              />
            </div>

            {/* Registration Phone Field */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Phone Handle</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="0917 123 4567 (11 digits)"
                  value={regPhone}
                  maxLength={11}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Strictly only digits
                    setRegPhone(val.slice(0, 11));
                  }}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 transition font-mono outline-none"
                  required
                />
              </div>
            </div>

            {/* Registration Password */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Password</label>
              <div className="relative">
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-100 transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Registration PIN */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">4-Digit Security PIN</label>
              <div className="relative">
                <input
                  type={showRegPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="4 digits PIN"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-100 font-mono tracking-[0.5em] transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPin(!showRegPin)}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Register Action Button */}
            <button
              type="submit"
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Build Vault Account</span>
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Demo Account Quick-fill section to facilitate testing */}
        <div className="border-t border-slate-800/60 pt-4 text-center">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold flex items-center justify-center gap-1">
            <User className="w-3 h-3 text-indigo-400" />
            <span>Preseeded Demo Profile Handle</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setLoginPhone('09171234567');
              setLoginPassword('password123');
              setLoginPin('1234');
              setIsRegister(false);
              setError(null);
            }}
            className="inline-flex bg-slate-950 hover:bg-slate-850 hover:text-indigo-400 text-slate-400 text-[10px] font-semibold py-1.5 px-3.5 rounded-xl border border-slate-800 transition cursor-pointer select-none"
          >
            Quick Sandbox Auto-Fill Demo
          </button>
        </div>

      </div>
    </div>
  );
}
