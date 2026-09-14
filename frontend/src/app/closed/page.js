'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { Search, Loader2, AlertCircle, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClosedPage() {
  const [data, setData] = useState(null);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClosed() {
      setLoading(true);
      try {
        const res = await api.get('/portfolio/closed/', {
          params: { page, symbol: symbolQuery },
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching closed positions:', err);
        setError('Failed to load closed positions.');
      } finally {
        setLoading(false);
      }
    }
    fetchClosed();
  }, [page, symbolQuery]);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Closed Positions</h1>
            <p className="text-sm text-white/50 mt-1">History of your fully closed trades and realized profit.</p>
          </div>

          {/* Symbol Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={symbolQuery}
              onChange={(e) => {
                setSymbolQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by symbol..."
              className="w-full pl-9 pr-4 py-2 glass-input text-sm"
            />
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
                    <th className="py-4 px-6">Asset</th>
                    <th className="py-4 px-4">Buy Date</th>
                    <th className="py-4 px-4">Avg Buy Price</th>
                    <th className="py-4 px-4">Sell Date</th>
                    <th className="py-4 px-4">Avg Sell Price</th>
                    <th className="py-4 px-4">Holding Days</th>
                    <th className="py-4 px-6 text-right">Realized P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {data?.results && data.results.length > 0 ? (
                    data.results.map((item, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg text-xs text-white">
                            {item.stock.symbol}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/60 text-xs">{formatDate(item.buy_date)}</td>
                        <td className="py-4 px-4 text-white/90">{formatCurrency(item.buy_price)}</td>
                        <td className="py-4 px-4 text-white/60 text-xs">{formatDate(item.sell_date)}</td>
                        <td className="py-4 px-4 text-white/90">{formatCurrency(item.sell_price)}</td>
                        <td className="py-4 px-4 text-white/60 text-xs">{item.holding_days} days</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className={Number(item.profit_loss) >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {formatCurrency(item.profit_loss)}
                            </span>
                            <span className={`text-[11px] font-medium mt-0.5 ${
                              Number(item.profit_loss_percent) >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'
                            }`}>
                              {formatPercent(item.profit_loss_percent)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-white/40">
                        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium text-white/60">No closed positions found.</p>
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
