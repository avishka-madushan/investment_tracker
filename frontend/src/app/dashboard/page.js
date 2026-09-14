'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import PortfolioChart from '@/components/PortfolioChart';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await api.get('/dashboard/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Overview</h1>
            <p className="text-sm text-white/50 mt-1">
              Welcome back, {user?.first_name || user?.username}. Here&apos;s your financial summary.
            </p>
          </div>
          <Link
            href="/trade"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Trade</span>
          </Link>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Total Portfolio Value */}
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Total Portfolio Value</p>
                <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(data.total_portfolio_value)}</h3>
              </div>

              {/* Net P/L */}
              <div className="glass-card p-6 relative overflow-hidden">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                  data.net_pnl >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {data.net_pnl >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Net Profit / Loss</p>
                <h3 className={`text-3xl font-bold mt-1 ${data.net_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(data.net_pnl)}
                </h3>
              </div>

              {/* Available Cash */}
              <div className="glass-card p-6 relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Available Cash</p>
                <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(data.cash_balance)}</h3>
              </div>

            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="glass-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Realized P/L</p>
                <h4 className={`text-xl font-bold mt-1 ${data.total_realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(data.total_realized_pnl)}
                </h4>
              </div>

              <div className="glass-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Unrealized P/L</p>
                <h4 className={`text-xl font-bold mt-1 ${data.total_unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(data.total_unrealized_pnl)}
                </h4>
              </div>

              <div className="glass-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Trade Win Rate</p>
                <h4 className="text-xl font-bold text-white mt-1">
                  {data.win_rate.toFixed(1)}%
                </h4>
              </div>

            </div>

            {/* Performance History Chart */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-white">Performance History (30 Days)</h3>
              </div>
              <PortfolioChart dates={data.chart_dates} values={data.chart_values} />
            </div>

            {/* Open Holdings Table Preview */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <h3 className="text-base font-semibold text-white">Current Open Holdings</h3>
                <Link
                  href="/holdings"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Asset</th>
                      <th className="py-3.5 px-4">Quantity</th>
                      <th className="py-3.5 px-4">Avg Price</th>
                      <th className="py-3.5 px-4">Current Price</th>
                      <th className="py-3.5 px-4">Current Value</th>
                      <th className="py-3.5 px-6 text-right">Return (P/L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {data.holdings && data.holdings.length > 0 ? (
                      data.holdings.map((h, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold bg-white/10 border border-white/10 px-2 py-1 rounded-lg text-xs text-white">
                                {h.symbol}
                              </span>
                              <span className="text-white/60 truncate max-w-[140px] text-xs">{h.company}</span>
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
                        <td colSpan="6" className="py-12 text-center text-white/40">
                          You don&apos;t have any open holdings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top / Worst Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Top Performer */}
              <div className="glass-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Top Performer</p>
                {data.best_stock ? (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono font-bold text-lg text-emerald-400">
                      {data.best_stock.symbol}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-400">
                        +{formatCurrency(data.best_stock.profit_loss)}
                      </div>
                      <div className="text-xs font-medium text-emerald-400/80">
                        {formatPercent(data.best_stock.profit_loss_percent)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 mt-3">No data available.</p>
                )}
              </div>

              {/* Worst Performer */}
              <div className="glass-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Worst Performer</p>
                {data.worst_stock ? (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 font-mono font-bold text-lg text-red-400">
                      {data.worst_stock.symbol}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-400">
                        {formatCurrency(data.worst_stock.profit_loss)}
                      </div>
                      <div className="text-xs font-medium text-red-400/80">
                        {formatPercent(data.worst_stock.profit_loss_percent)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 mt-3">No data available.</p>
                )}
              </div>

            </div>

          </>
        ) : null}

      </div>
    </AuthGuard>
  );
}
