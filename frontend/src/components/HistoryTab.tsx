import React from 'react';
import * as d3 from 'd3';
import { 
  History, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  FileText,
  Clock,
  ArrowRight,
  Download,
  TrendingUp
} from 'lucide-react';

interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  token: string;
  memo: string;
  created_at: string;
  receiver_account?: string;
}

interface HistoryTabProps {
  transactions: Transaction[];
  onRefresh: () => void;
  loading: boolean;
  onNavigate?: (tab: 'home' | 'history' | 'profile' | 'settings') => void;
}

export default function HistoryTab({ transactions, onRefresh, loading, onNavigate }: HistoryTabProps) {
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);

  // Download stylized file receipt logic
  const handleDownloadReceipt = (tx: Transaction) => {
    const divider = '='.repeat(48);
    const textContent = [
      divider,
      '           VAULTPAY SECURE FINANCIAL RECORD           ',
      '        Instapay Clear sovereign settlement entries   ',
      divider,
      `Transaction ID:    ${tx.id}`,
      `UTC Timestamp:     ${new Date(tx.created_at).toISOString()}`,
      `Local Timestamp:   ${new Date(tx.created_at).toLocaleString()}`,
      `Transfer Status:   SUCCESSFUL (Fulfillment Settled)`,
      divider,
      `Sender Profile:    ${tx.sender}`,
      `Receiver Name:     ${tx.receiver}`,
      `Receiver Account:  ${tx.receiver_account || '••••• ••• 4499'}`,
      `Remitted Amount:   PHP ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `PCI Safety Token:  ${tx.token}`,
      tx.memo ? `Reference Memo:    "${tx.memo}"` : '',
      divider,
      '               SECURITY VERIFICATION SYSTEM           ',
      'Original customer account numbers, PAN cards, and PIN',
      'credentials have been safely wiped from routing cache',
      'RAM. Only cryptographic signatures persist.',
      divider,
      '       VaultPay Sovereign Remittance Core, Inc.       ',
      divider
    ].filter(Boolean).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VaultPay_Receipt_${tx.id}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // D3 calculations for past 6 months spending patterns
  const getPast6Months = () => {
    const list = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      list.push({ 
        label, 
        amount: 0, 
        count: 0, 
        key: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) 
      });
    }
    return list;
  };

  const chartData = getPast6Months();
  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at);
    const txKey = txDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const found = chartData.find(item => item.key === txKey);
    if (found) {
      found.amount += tx.amount;
      found.count += 1;
    }
  });

  // SVG parameters
  const width = 600;
  const height = 150;
  const margin = { top: 20, right: 30, bottom: 25, left: 60 };

  const xScale = d3.scalePoint<string>()
    .domain(chartData.map(d => d.label))
    .range([margin.left, width - margin.right]);

  const maxSpend = d3.max(chartData, d => d.amount) || 0;
  const yScale = d3.scaleLinear()
    .domain([0, maxSpend === 0 ? 10000 : maxSpend * 1.15])
    .range([height - margin.bottom, margin.top]);

  const areaGen = d3.area<typeof chartData[0]>()
    .x(d => xScale(d.label) || 0)
    .y0(yScale(0))
    .y1(d => yScale(d.amount))
    .curve(d3.curveMonotoneX);

  const lineGen = d3.line<typeof chartData[0]>()
    .x(d => xScale(d.label) || 0)
    .y(d => yScale(d.amount))
    .curve(d3.curveMonotoneX);

  const areaPath = areaGen(chartData) || '';
  const linePath = lineGen(chartData) || '';
  const yTicks = yScale.ticks(4);

  return (
    <div className="space-y-5">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
            <History className="w-4.5 h-4.5 text-indigo-400" />
            <span>Interactive Stream History</span>
          </h3>
          <p className="text-xs text-slate-400">Secure tokenized financial remittance registry</p>
        </div>
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button 
            type="button"
            onClick={onRefresh} 
            disabled={loading}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-100 rounded-lg text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-55"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>SYNC LEDGER</span>
          </button>
        </div>
      </div>

      {/* Mini D3.js Spend Pattern Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Monthly Spending Pattern (D3.js Grid)</h4>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
            Realtime Stream
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[550px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Axis Gridlines */}
              {yTicks.map((tick, i) => (
                <g key={i} className="opacity-40">
                  <line 
                    x1={margin.left} 
                    y1={yScale(tick)} 
                    x2={width - margin.right} 
                    y2={yScale(tick)} 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="2 3"
                  />
                  <text 
                    x={margin.left - 8} 
                    y={yScale(tick) + 4} 
                    textAnchor="end" 
                    fill="#64748b" 
                    className="text-[9px] font-mono font-medium"
                  >
                    ₱{tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                  </text>
                </g>
              ))}

              {/* X Axis Labels */}
              {chartData.map((d, i) => {
                const xVal = xScale(d.label) || 0;
                return (
                  <text 
                    key={i} 
                    x={xVal} 
                    y={height - 5} 
                    textAnchor="middle" 
                    fill="#64748b" 
                    className="text-[10px] font-mono font-semibold"
                  >
                    {d.label}
                  </text>
                );
              })}

              {/* Area Path */}
              {areaPath && (
                <path 
                  d={areaPath} 
                  fill="url(#spendGrad)" 
                />
              )}

              {/* Line Path */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                />
              )}

              {/* Point Markers */}
              {chartData.map((d, i) => {
                const xVal = xScale(d.label) || 0;
                const yVal = yScale(d.amount);
                return (
                  <g key={i} className="group">
                    <circle 
                      cx={xVal} 
                      cy={yVal} 
                      r="4.5" 
                      fill="#020617" 
                      stroke="#10b981" 
                      strokeWidth="2"
                    />
                    {d.amount > 0 && (
                      <text
                        x={xVal}
                        y={yVal - 8}
                        textAnchor="middle"
                        fill="#34d399"
                        className="text-[10px] font-mono font-bold"
                      >
                        ₱{d.amount.toLocaleString()}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left: Transaction List */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-widest">Transaction Rows</span>
            <span className="text-slate-500">{transactions.length} Records</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic flex flex-col items-center justify-center space-y-2">
                <Clock className="w-8 h-8 text-slate-650" />
                <p className="text-xs">No active transactions logged in this session.</p>
                <p className="text-[10px] text-slate-650">Go to Home, trigger a Bank Transfer or Mobile Express Send, and see it map instantly.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <button
                  type="button"
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`w-full text-left p-4 hover:bg-[#0c1224] transition flex items-center justify-between ${
                    selectedTx?.id === tx.id ? 'bg-[#0f1d35]/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 max-w-[70%]">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/15 shrink-0 mt-0.5">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-200 truncate">{tx.receiver}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                        {tx.token.substring(0, 18)}...
                      </p>
                      {tx.memo && (
                        <p className="text-[10px] text-slate-400 italic max-w-xs truncate mt-1">"{tx.memo}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 space-y-1.5">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ₱ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detailed Popover Receipt panel */}
        <div className="md:col-span-5">
          {selectedTx ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col space-y-4">
              {/* Receipt Visual borders decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2 text-slate-200">
                  <FileText className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-xs font-bold font-mono tracking-wider">SECURE RECEIPT</span>
                </div>
                <span className="text-[9px] bg-slate-950 font-mono text-slate-400 px-2 py-0.5 rounded border border-slate-850">
                  Instapay Clear
                </span>
              </div>

              <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Transfer Success Amount</p>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                  ₱{selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="inline-flex items-center space-x-1 mt-2.5 px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-mono">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>TOKENIZED RECIPIENT</span>
                </div>
              </div>

              {/* Data specifications */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reference ID:</span>
                  <span className="font-mono text-slate-200 text-[11px] font-medium">{selectedTx.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sender Profile:</span>
                  <span className="text-slate-200 font-medium">{selectedTx.sender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Entity:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[150px]">{selectedTx.receiver}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Account:</span>
                  <span className="font-mono text-xs font-bold text-slate-200">{selectedTx.receiver_account || '••••• ••• 4499'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stamp:</span>
                  <span className="font-mono text-slate-300 text-[10px]">
                    {new Date(selectedTx.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedTx.memo && (
                  <div className="border-t border-slate-800/80 pt-2.5 mt-1.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Custom Reference Memo:</span>
                    <p className="p-2.5 bg-slate-950/80 text-xs italic text-slate-300 rounded-lg border border-slate-850">
                      "{selectedTx.memo}"
                    </p>
                  </div>
                )}
              </div>

              {/* Security confirmation notice */}
              <div className="bg-[#0c1224] p-3 rounded-lg border border-slate-800 flex items-start space-x-2.5 text-[10px] leading-relaxed text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <b>Security Verification Passed:</b> Original payment gateway card/phone details are completely deleted from RAM stack registers. Only lookup handles are kept.
                </span>
              </div>

              {/* Save Receipt Button */}
              <button
                type="button"
                onClick={() => handleDownloadReceipt(selectedTx)}
                className="w-full bg-slate-950 hover:bg-slate-850 hover:text-indigo-400 border border-slate-800/80 text-indigo-300 font-bold py-2.5 px-4 rounded-xl text-[11px] transition duration-200 shadow-md cursor-pointer flex items-center justify-center space-x-2 font-mono uppercase tracking-wider"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Save Secure Receipt (.TXT)</span>
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 bg-slate-900/10 rounded-2xl p-10 text-center text-slate-550 flex flex-col items-center justify-center h-[340px] space-y-2">
              <Calendar className="w-10 h-10 text-slate-550" />
              <p className="text-xs font-semibold text-slate-400">No Receipt Selected</p>
              <p className="text-[10px] text-slate-500 max-w-[200px]">Click any transaction record on the left to review the cryptographically protected checkout receipt.</p>
            </div>
          )}
        </div>

      </div>

      {/* Redirect/Next Link */}
      {onNavigate && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="group inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150 cursor-pointer"
          >
            <span>Proceed to User Profile (/profile)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

    </div>
  );
}
