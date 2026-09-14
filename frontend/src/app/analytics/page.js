'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import MonthlyPnlChart from '@/components/MonthlyPnlChart';
import api from '@/lib/api';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { BarChart3, Star, AlertTriangle, TrendingUp, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/analytics/overview/');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics overview:', err);
        setError('Failed to load analytics overview.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Performance</h1>
            <p className="text-sm text-white/50 mt-1">Deep dive into your trading strategies and outcomes.</p>
          </div>

          <Link
            href="/analytics/stock"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Individual Stock Analysis</span>
            <ArrowRight className="w-4 h-4" />
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
        ) : data ? (
          <>
            {/* Top Grid: Avg Holding Days & Monthly P/L Chart */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              <div className="md:col-span-4 glass-card p-6 flex flex-col justify-center text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Avg Holding Days</p>
                <h2 className="text-4xl font-extrabold text-white mt-2">
                  {data.avg_holding_days.toFixed(1)}
                </h2>
                <p className="text-xs text-white/40 mt-1">Average duration per trade</p>
              </div>

              <div className="md:col-span-8 glass-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4">
                  Monthly Realized P/L
                </h3>
                <MonthlyPnlChart months={data.months} pnlValues={data.pnl_values} />
              </div>

            </div>

            {/* Best & Worst Single Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Best Single Trade */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Best Single Trade</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                </div>

                {data.best_trade ? (
                  <div>
                    <span className="font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-sm text-emerald-400">
                      {data.best_trade.symbol}
                    </span>
                    <div className="text-2xl font-bold text-emerald-400 mt-3">
                      +{formatCurrency(data.best_trade.profit_loss)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-400/80 mt-0.5">
                      {formatPercent(data.best_trade.profit_loss_percent)} ROI
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40 mt-4 pt-3 border-t border-white/10">
                      <span>Bought: {formatDate(data.best_trade.buy_date)}</span>
                      <span>Sold: {formatDate(data.best_trade.sell_date)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 py-4">No data available.</p>
                )}
              </div>

              {/* Worst Single Trade */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Worst Single Trade</span>
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>

                {data.worst_trade ? (
                  <div>
                    <span className="font-mono font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg text-sm text-red-400">
                      {data.worst_trade.symbol}
                    </span>
                    <div className={`text-2xl font-bold mt-3 ${data.worst_trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(data.worst_trade.profit_loss)}
                    </div>
                    <div className={`text-xs font-semibold mt-0.5 ${data.worst_trade.profit_loss_percent >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                      {formatPercent(data.worst_trade.profit_loss_percent)} ROI
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40 mt-4 pt-3 border-t border-white/10">
                      <span>Bought: {formatDate(data.worst_trade.buy_date)}</span>
                      <span>Sold: {formatDate(data.worst_trade.sell_date)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 py-4">No data available.</p>
                )}
              </div>

            </div>

            {/* Yearly Performance Summary */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-base font-semibold text-white">Yearly Performance Summary</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6 text-left">Year</th>
                      <th className="py-4 px-4">Total Trades</th>
                      <th className="py-4 px-4">Realized P/L</th>
                      <th className="py-4 px-6 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {data.yearly_data && data.yearly_data.length > 0 ? (
                      data.yearly_data.map((y, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 text-left font-bold text-white">{y.year}</td>
                          <td className="py-4 px-4 text-white/80">{y.total_trades}</td>
                          <td className="py-4 px-4 font-semibold">
                            <span className={y.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {formatCurrency(y.realized_pnl)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              y.win_rate >= 50
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/15 text-red-400 border-red-500/20'
                            }`}>
                              {y.win_rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-white/40">No yearly summary data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 Profitable & Worst Performing Stocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Top 5 Most Profitable */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-emerald-400 mb-4">Top 5 Most Profitable Stocks</h3>
                <div className="space-y-3">
                  {data.top_5_stocks && data.top_5_stocks.length > 0 ? (
                    data.top_5_stocks.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs text-emerald-400">
                          {item.stock__symbol}
                        </span>
                        <span className="font-bold text-emerald-400 text-sm">
                          +{formatCurrency(item.total_pnl)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40 py-4">No data available.</p>
                  )}
                </div>
              </div>

              {/* Top 5 Worst Performing */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-red-400 mb-4">Top 5 Worst Performing Stocks</h3>
                <div className="space-y-3">
                  {data.worst_5_stocks && data.worst_5_stocks.length > 0 ? (
                    data.worst_5_stocks.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="font-mono font-bold bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs text-red-400">
                          {item.stock__symbol}
                        </span>
                        <span className={`font-bold text-sm ${item.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(item.total_pnl)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/40 py-4">No data available.</p>
                  )}
                </div>
              </div>

            </div>
          </>
        ) : null}

      </div>
    </AuthGuard>
  );
}
