'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import SearchableStockSelect from '@/components/SearchableStockSelect';
import PriceChart from '@/components/PriceChart';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Search, Loader2, AlertCircle, TrendingUp, History } from 'lucide-react';

export default function StockAnalysisPage() {
  const [stocks, setStocks] = useState([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await api.get('/stocks/');
        const list = res.data || [];
        setStocks(list);
        if (list.length > 0) {
          setSelectedStockId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching stock list:', err);
        setError('Failed to load stock list.');
      } finally {
        setLoadingStocks(false);
      }
    }
    fetchStocks();
  }, []);

  const handleAnalyze = async (stockIdToFetch) => {
    const id = stockIdToFetch || selectedStockId;
    if (!id) return;
    setLoadingAnalysis(true);
    setError('');
    try {
      const res = await api.get('/analytics/stock/', {
        params: { stock_id: id },
      });
      setAnalysisData(res.data);
    } catch (err) {
      console.error('Error fetching stock analysis:', err);
      setError('Failed to fetch stock analysis data.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (selectedStockId) {
      handleAnalyze(selectedStockId);
    }
  }, [selectedStockId]);

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Analysis</h1>
          <p className="text-sm text-white/50 mt-1">Detailed performance and history of individual assets.</p>
        </div>

        {/* Stock Selector Card */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-lg">
            <div className="w-full">
              <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Select Asset to Analyze
              </label>
              <SearchableStockSelect
                stocks={stocks}
                selectedStockId={selectedStockId}
                onChange={(id) => setSelectedStockId(id)}
                placeholder="— Select Stock —"
              />
            </div>
          </div>
        </div>

        {loadingAnalysis ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : analysisData ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="glass-card p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Trades</p>
                <h3 className="text-3xl font-extrabold text-white mt-2">{analysisData.total_trades}</h3>
              </div>

              <div className="glass-card p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Realized P/L</p>
                <h3 className={`text-3xl font-extrabold mt-2 ${analysisData.total_realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(analysisData.total_realized_pnl)}
                </h3>
              </div>

              <div className="glass-card p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Avg Holding Days</p>
                <h3 className="text-3xl font-extrabold text-white mt-2">{analysisData.avg_holding_days.toFixed(1)}</h3>
              </div>

              <div className="glass-card p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Win Rate</p>
                <h3 className="text-3xl font-extrabold text-sky-400 mt-2">{analysisData.win_rate.toFixed(1)}%</h3>
              </div>

            </div>

            {/* Price Chart & SMAs */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4">
                Price History & SMAs (Last 90 Days)
              </h3>
              <PriceChart
                dates={analysisData.chart_dates}
                close={analysisData.chart_close}
                sma4={analysisData.chart_sma4}
                sma9={analysisData.chart_sma9}
                sma50={analysisData.chart_sma50}
              />
            </div>

            {/* Stock Specific Transaction History */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-base font-semibold text-white">
                  Transaction History for <span className="text-indigo-400 font-mono">{analysisData.selected_stock.symbol}</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-4">Type</th>
                      <th className="py-4 px-4">Quantity</th>
                      <th className="py-4 px-4">Price</th>
                      <th className="py-4 px-6">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {analysisData.transactions && analysisData.transactions.length > 0 ? (
                      analysisData.transactions.map((tx, i) => {
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
                            <td className="py-4 px-4 text-white/90">{tx.quantity}</td>
                            <td className="py-4 px-4 text-white/90">{formatCurrency(tx.price)}</td>
                            <td className="py-4 px-6 text-white/60 text-xs">{tx.notes || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-white/40">
                          No transactions recorded for this asset.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </AuthGuard>
  );
}
