'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { Plus, Briefcase, Loader2, AlertCircle } from 'lucide-react';

export default function HoldingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHoldings() {
      try {
        const res = await api.get('/portfolio/holdings/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching holdings:', err);
        setError('Failed to load active holdings.');
      } finally {
        setLoading(false);
      }
    }
    fetchHoldings();
  }, []);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Active Holdings</h1>
            <p className="text-sm text-white/50 mt-1">Your currently open stock positions.</p>
          </div>
          <Link
            href="/trade"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Trade</span>
          </Link>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Asset</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-4">Avg Buy Price</th>
                    <th className="py-4 px-4">Current Price</th>
                    <th className="py-4 px-4">Current Value</th>
                    <th className="py-4 px-6 text-right">Unrealized P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {data?.holdings && data.holdings.length > 0 ? (
                    data.holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg text-xs text-white">
                              {h.symbol}
                            </span>
                            <span className="text-white/60 truncate max-w-[160px] text-xs">{h.company}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/90">{h.quantity}</td>
                        <td className="py-4 px-4 text-white/90">{formatCurrency(h.avg_price)}</td>
                        <td className="py-4 px-4 text-white/90">{formatCurrency(h.latest_price)}</td>
                        <td className="py-4 px-4 text-white font-semibold">{formatCurrency(h.current_value)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className={h.unrealized_pnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {formatCurrency(h.unrealized_pnl)}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                              h.unrealized_pnl_percent >= 0
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/15 text-red-400 border border-red-500/20'
                            }`}>
                              {formatPercent(h.unrealized_pnl_percent)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-white/40">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium text-white/60">You have no active holdings.</p>
                        <Link
                          href="/trade"
                          className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          Make a Trade
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
