'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Search, Plus, History, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const [data, setData] = useState(null);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await api.get('/transactions/history/', {
          params: { page, symbol: symbolQuery },
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [page, symbolQuery]);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Transaction History</h1>
            <p className="text-sm text-white/50 mt-1">Complete log of your trading activity.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Symbol Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={symbolQuery}
                onChange={(e) => {
                  setSymbolQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by symbol..."
                className="w-full pl-9 pr-4 py-2 glass-input text-sm"
              />
            </div>

            <Link
              href="/trade"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Trade</span>
            </Link>
          </div>
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
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-4">Action</th>
                    <th className="py-4 px-4">Asset</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-4">Price / Share</th>
                    <th className="py-4 px-6 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {data?.results && data.results.length > 0 ? (
                    data.results.map((tx, i) => {
                      const isBuy = tx.transaction_type === 'BUY';
                      return (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 text-white/60 text-xs">{formatDate(tx.date)}</td>
                          <td className="py-4 px-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                              isBuy
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/15 text-red-400 border-red-500/20'
                            }`}>
                              {isBuy ? 'BUY' : 'SELL'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg text-xs text-white">
                              {tx.stock.symbol}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-white/90">{tx.quantity}</td>
                          <td className="py-4 px-4 text-white/90">{formatCurrency(tx.price)}</td>
                          <td className="py-4 px-6 text-right font-semibold">
                            <span className={isBuy ? 'text-red-400' : 'text-emerald-400'}>
                              {isBuy ? '-' : '+'}{formatCurrency(tx.total_value)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-white/40">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium text-white/60">No transactions recorded.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data && data.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/50">
                  Page {data.page} of {data.total_pages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setPage(data.page - 1)}
                    className="p-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={data.page >= data.total_pages}
                    onClick={() => setPage(data.page + 1)}
                    className="p-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
