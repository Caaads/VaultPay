import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { 
  Wallet, 
  Send, 
  Building2, 
  CreditCard, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  DollarSign,
  QrCode,
  X
} from 'lucide-react';

interface HomeTabProps {
  userId?: string;
  senderName: string;
  senderPhone: string;
  senderAccount: string;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onTransactionSuccess: () => void;
  onNavigate?: (tab: 'home' | 'history' | 'profile' | 'settings') => void;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
}

export default function HomeTab({ 
  userId,
  senderName, 
  senderPhone, 
  senderAccount, 
  balance, 
  onUpdateBalance, 
  onTransactionSuccess,
  onNavigate,
  hideBalance,
  onToggleHideBalance
}: HomeTabProps) {
  const [transferType, setTransferType] = useState<'express' | 'bank'>('express');
  
  // Form input states
  const [receiverName, setReceiverName] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  
  // Pay option values
  const [targetPhone, setTargetPhone] = useState('');
  const [useCountryCode, setUseCountryCode] = useState(true);
  const [targetBankName, setTargetBankName] = useState('Maya Bank');
  const [targetBankAccount, setTargetBankAccount] = useState('');

  // Status flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // QR Modal States
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // QR Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorScanner, setErrorScanner] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setErrorScanner(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setErrorScanner("Could not access camera. Please check permissions or upload an image instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (showScanner && scanMethod === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showScanner, scanMethod]);

  const handleScannedQR = (scannedText: string) => {
    let name = '';
    let phone = '';
    let account = '';

    try {
      const data = JSON.parse(scannedText);
      name = data.name || '';
      phone = data.phone || '';
      account = data.account || '';
    } catch (e) {
      // It's a plain string! Let's check format
      const cleanText = scannedText.trim();
      if (/^\+?\d{9,15}$/.test(cleanText.replace(/\s/g, ''))) {
        phone = cleanText;
      } else if (/^[a-zA-Z0-9-]{6,30}$/.test(cleanText.replace(/\s/g, ''))) {
        account = cleanText;
      }
    }

    if (phone || account) {
      setReceiverName(name || 'Scanned Recipient');
      if (phone) {
        setTransferType('express');
        const phoneClean = phone.replace(/\D/g, '');
        if (phoneClean.startsWith('63')) {
          setUseCountryCode(true);
          setTargetPhone(phoneClean.substring(2));
        } else {
          setUseCountryCode(false);
          setTargetPhone(phoneClean);
        }
      } else if (account) {
        setTransferType('bank');
        setTargetBankAccount(account);
      }
      setShowScanner(false);
      setSuccessMsg("QR Code scanned successfully! Recipient details auto-filled.");
    } else {
      setErrorScanner("Could not find a valid phone or account number in the scanned code.");
    }
  };

  useEffect(() => {
    let active = true;
    let animationId: number;

    const scanFrame = () => {
      if (!active) return;
      if (scanMethod === 'camera' && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScannedQR(code.data);
            return; // stop scanning loop on success
          }
        }
      }
      animationId = requestAnimationFrame(scanFrame);
    };

    if (showScanner && scanMethod === 'camera' && cameraActive) {
      animationId = requestAnimationFrame(scanFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
    };
  }, [showScanner, scanMethod, cameraActive]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorScanner(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScannedQR(code.data);
          } else {
            setErrorScanner("Could not find a valid QR Code in the uploaded image. Please make sure the QR is clear and visible.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (showQR && qrCanvasRef.current) {
      const qrData = JSON.stringify({
        name: senderName,
        phone: senderPhone,
        account: senderAccount,
        purpose: 'GSave Quick Remittance'
      });
      QRCode.toCanvas(
        qrCanvasRef.current,
        qrData,
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#0f172a', // slate-900 like UI theme
            light: '#ffffff'
          }
        },
        (err) => {
          if (err) console.error('Error rendering QR Canvas:', err);
        }
      );
    }
  }, [showQR, senderName, senderPhone, senderAccount]);

  // Auto-dismiss overlays, errors, and success alerts after few seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCashIn = () => {
    const topUp = 5000;
    onUpdateBalance(balance + topUp);
    setSuccessMsg(`Successfully cashed in ₱${topUp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to your electronic wallet!`);
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid transfer amount.');
      return;
    }

    if (parsedAmount > balance) {
      setError('Insufficient funds. cash in to top up your account.');
      return;
    }

    if (!receiverName.trim()) {
      setError('Receiver name is required.');
      return;
    }

    // Determine payload details
    let finalCheckoutId = '';
    let apiPaymentType: 'card' | 'mobile' | 'bank' = 'mobile';

    let finalBankName = targetBankName;
    if (transferType === 'express') {
      const cleanPhone = targetPhone.replace(/\D/g, '');
      if (useCountryCode) {
        if (cleanPhone.length !== 10) {
          setError('Recipient phone number must be exactly 10 digits (e.g., 9085577047).');
          return;
        }
        finalCheckoutId = '63' + cleanPhone;
      } else {
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
          setError('Recipient phone number must be exactly 11 digits starting with 09 (e.g., 09085577047).');
          return;
        }
        finalCheckoutId = '63' + cleanPhone.substring(1);
      }
      apiPaymentType = 'mobile';
    } else {
      // Bank transfer
      const cleanAcc = targetBankAccount.replace(/\D/g, '');
      if (cleanAcc.length < 6) {
        setError('Destination Bank Account number must be at least 6 digits.');
        return;
      }
      finalCheckoutId = cleanAcc;
      apiPaymentType = 'bank';
    }

    // Self-transfer validation check
    if (apiPaymentType === 'mobile') {
      const cleanSenderPhone = senderPhone.replace(/\D/g, '').replace(/^0/, '63');
      const cleanTargetPhone = finalCheckoutId.replace(/\D/g, '').replace(/^0/, '63');
      if (cleanSenderPhone === cleanTargetPhone) {
        setError('Transaction canceled: You cannot send money to your own phone number.');
        return;
      }
    } else if (apiPaymentType === 'bank') {
      const cleanSenderAcc = senderAccount.replace(/\D/g, '');
      const cleanTargetAcc = finalCheckoutId.replace(/\D/g, '');
      if (cleanSenderAcc === cleanTargetAcc) {
        setError('Transaction canceled: You cannot send money to your own account number.');
        return;
      }
    }



    setLoading(true);

    try {
      const payload = {
        sender: senderName,
        receiver: receiverName.trim(),
        amount: parsedAmount,
        memo: memo.trim(),
        paymentType: apiPaymentType,
        checkoutIdentifier: finalCheckoutId,
        bankName: apiPaymentType === 'bank' ? finalBankName : undefined,
        userId: userId || undefined
      };

      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected transaction.');
      }

      // Deduct balance and trigger success
      onUpdateBalance(balance - parsedAmount);
      setSuccessMsg(data.message || 'Fund transfer successful!');
      
      // Reset inputs
      setAmount('');
      setMemo('');
      setTargetPhone('');
      setTargetBankAccount('');
      setReceiverName('');

      // Refresh parent ledger feeds
      onTransactionSuccess();
    } catch (err: any) {
      setError(err.message || 'Network error executing fund transfer.');
    } finally {
      setLoading(false);
    }
  };

  const triggerPreset = (type: 'express' | 'bank') => {
    setError(null);
    if (type === 'express') {
      setTransferType('express');
      setReceiverName('Julian Santos (Maya)');
      setTargetPhone('0917-111-2244');
      setAmount('150.00');
      setMemo('Dinner splits');
    } else {
      setTransferType('bank');
      setReceiverName('Metro Real Estate');
      setTargetBankName('UnionBank');
      setTargetBankAccount('1094-1142-99');
      setAmount('4500.00');
      setMemo('Monthly space rent');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Balance Card Widget (GCash / Maya Inspired Theme) */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-indigo-300" />
            <span className="text-xs uppercase tracking-wider text-slate-300 font-mono font-medium">Available Balance</span>
          </div>
          <button 
            type="button"
            onClick={onToggleHideBalance} 
            className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-slate-800/40 transition cursor-pointer"
            title={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-baseline space-x-1.5 mb-6">
          <span className="text-2xl font-bold font-mono text-indigo-400">₱</span>
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono transition-all duration-300">
            {hideBalance ? '••••••' : balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 gap-2 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={handleCashIn}
            className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md shadow-emerald-400/10 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mock Cash In (₱5k)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowScanner(true);
              setScanMethod('camera');
              setErrorScanner(null);
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-1.5 animate-pulse-slow"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>My QR Code</span>
          </button>
        </div>
      </div>

      {/* Main Transfer Workspace Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative">
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-200 text-base">Transfer & Send Portal</h3>
            <p className="text-xs text-slate-400">Secured with instanced tokenized routing filters</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTransferType('express')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-1.5 ${
                transferType === 'express' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Express</span>
            </button>
            <button
              type="button"
              onClick={() => setTransferType('bank')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition flex items-center space-x-1.5 ${
                transferType === 'bank' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank Transfer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitTransfer} className="space-y-4">
          


          {/* Recipient Details based on Type */}
          <div className="space-y-4">
            
            {/* 1. Send via Wallet Phone */}
            {transferType === 'express' && (
              <div>
                <label htmlFor="target-phone-no" className="text-xs font-semibold text-slate-300 block mb-1.5">Recipient Phone Number <span className="text-indigo-400">*</span></label>
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCountryCode(!useCountryCode);
                      setTargetPhone('');
                    }}
                    className="absolute left-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition focus:ring-1 focus:ring-indigo-550 select-none cursor-pointer"
                    title="Toggle between +63 and 09 formats"
                  >
                    {useCountryCode ? '+63' : '09'}
                  </button>
                  <input
                    id="target-phone-no"
                    type="tel"
                    required
                    maxLength={useCountryCode ? 10 : 11}
                    placeholder={useCountryCode ? "908 557 7047 (10 digits)" : "0908 557 7047 (11 digits)"}
                    value={targetPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Enforce only digits strictly
                      const maxL = useCountryCode ? 10 : 11;
                      setTargetPhone(val.slice(0, maxL));
                    }}
                    className={`w-full bg-slate-950 border focus:ring-1 focus:ring-opacity-50 rounded-xl pr-4 py-2.5 text-sm text-slate-100 transition font-mono outline-none pl-16 ${
                      targetPhone.length === 0 
                        ? 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500' 
                        : (useCountryCode ? targetPhone.length === 10 : (targetPhone.length === 11 && targetPhone.startsWith('09')))
                          ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500/30'
                          : 'border-amber-500/60 focus:border-amber-500 focus:ring-amber-500/30'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  <p className="text-[10px] text-slate-500">
                    {useCountryCode 
                      ? "Enter 10-digit number following +63 prefix." 
                      : "Enter 11-digit number starting with 09."
                    }
                  </p>
                  <p className={`text-[10px] font-mono tracking-wide ${
                    targetPhone.length === 0
                      ? 'text-slate-500'
                      : (useCountryCode ? targetPhone.length === 10 : (targetPhone.length === 11 && targetPhone.startsWith('09')))
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400'
                  }`}>
                    {targetPhone.length === 0
                      ? `Requires ${useCountryCode ? '10' : '11'} digits`
                      : (useCountryCode ? targetPhone.length === 10 : (targetPhone.length === 11 && targetPhone.startsWith('09')))
                        ? `✓ Perfect: ${useCountryCode ? '10' : '11'} digits entered`
                        : `Requires ${useCountryCode ? '10' : '11'} digits (Entered: ${targetPhone.length})`
                    }
                  </p>
                </div>
              </div>
            )}



            {/* 3. Send via Bank Transfer */}
            {transferType === 'bank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target-bank-selection" className="text-xs font-semibold text-slate-300 block mb-1.5">Destination Bank <span className="text-indigo-400">*</span></label>
                  <select
                    id="target-bank-selection"
                    value={targetBankName}
                    onChange={(e) => setTargetBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none cursor-pointer"
                  >
                    <option value="Maya Bank">Maya Bank</option>
                    <option value="BPI Savings">BPI Savings</option>
                    <option value="BDO Unibank">BDO Unibank</option>
                    <option value="UnionBank">UnionBank (Instapay)</option>
                    <option value="Metrobank">Metrobank Corp</option>
                    <option value="GCash GSave">GSave Savings</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="target-bank-acc-no" className="text-xs font-semibold text-slate-300 block mb-1.5">Bank Account Number <span className="text-indigo-400">*</span></label>
                  <input
                    id="target-bank-acc-no"
                    type="text"
                    required
                    placeholder="e.g. 1094 8832 10"
                    value={targetBankAccount}
                    onChange={(e) => setTargetBankAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition font-mono outline-none"
                  />
                </div>
              </div>
            )}

            {/* Common Fields: Receiver Name, Amount, Memo */}
            <div>
              <label htmlFor="receiver-name-field" className="text-xs font-semibold text-slate-300 block mb-1.5">Receiver Account Name <span className="text-indigo-400">*</span></label>
              <input
                id="receiver-name-field"
                type="text"
                required
                placeholder="First and Last Name of Receiver"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="send-amount-field" className="text-xs font-semibold text-slate-300 block mb-1.5">Amount (₱) <span className="text-indigo-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-semibold text-sm">₱</span>
                  <input
                    id="send-amount-field"
                    type="number"
                    step="0.01"
                    min="1.00"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-100 font-mono transition outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="send-memo-field" className="text-xs font-semibold text-slate-300 block mb-1.5">Transfer Message / Memo</label>
                <input
                  id="send-memo-field"
                  type="text"
                  placeholder="What is this transfer for? (e.g. dinner bill)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

          </div>

          {/* Interactive States Alerts */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 text-white disabled:text-slate-450 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing Vault Tokenization...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm Send Payment (Instapay / PESONet)</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Redirect/Next Link */}
      {onNavigate && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="group inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150 cursor-pointer"
          >
            <span>Proceed to Remittance History (/history)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Dynamic QR Loader Card/Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-base">Quick Instapay Remittance QR</h3>
              <p className="text-xs text-slate-400 mt-1">Scan this GSave proxy handle inside any supportive wallet bounds</p>
            </div>

            {/* QR Code Anchor rendering target */}
            <div className="bg-white p-3 rounded-2xl inline-block shadow-inner mx-auto">
              <canvas ref={qrCanvasRef} className="mx-auto" />
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-left text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Account Holder:</span>
                <span className="text-slate-100 font-semibold">{senderName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phone Handle:</span>
                <span className="text-slate-100 font-mono">{senderPhone}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Account Number:</span>
                <span className="text-slate-100 font-mono truncate max-w-[150px]" title={senderAccount}>{senderAccount}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              Contains secure localized offline profile configuration structure.
            </div>
          </div>
        </div>
      )}

      {/* Dynamic QR Scanner Modal Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => {
                setShowScanner(false);
                stopCamera();
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-100 text-base flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>Scan Instapay / GSave QR Code</span>
              </h3>
              <p className="text-xs text-slate-400">Scan using camera or upload a recipient's QR code image</p>
            </div>

            {/* Scanner Tab Selection */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScanMethod('camera')}
                className={`flex-1 py-2 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  scanMethod === 'camera'
                    ? 'bg-slate-850 text-slate-100 border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanMethod('upload');
                  stopCamera();
                }}
                className={`flex-1 py-2 rounded-lg transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                  scanMethod === 'upload'
                    ? 'bg-slate-850 text-slate-100 border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Upload QR Image</span>
              </button>
            </div>

            {/* Scanner Action Screens */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square border border-slate-850 flex flex-col items-center justify-center">
              {scanMethod === 'camera' ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                  />
                  
                  <div className="absolute inset-0 border-[30px] border-slate-950/70 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-indigo-500 rounded-2xl relative">
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                    </div>
                  </div>

                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">Requesting secure camera feeds...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">Select QR Code Image File</p>
                    <p className="text-[10px] text-slate-500">Supports PNG, JPG, or SVG export formats</p>
                  </div>
                  <label className="inline-flex bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition duration-200 shadow-md cursor-pointer select-none">
                    <span>Browse Device Storage</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {errorScanner && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-start space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorScanner}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-500 text-center italic">
              Fits offline Instapay routing standard structures securely.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
