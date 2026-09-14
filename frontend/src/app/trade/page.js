'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import SearchableStockSelect from '@/components/SearchableStockSelect';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { ArrowLeftRight, Check, AlertCircle, Loader2, DollarSign } from 'lucide-react';

export default function TradePage() {
  const router = useRouter();
  const [stocks, setStocks] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [transactionType, setTransactionType] = useState('BUY');
  const [stockId, setStockId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [stocksRes, cashRes] = await Promise.all([
          api.get('/stocks/'),
          api.get('/portfolio/cash/'),
        ]);
        setStocks(stocksRes.data || []);
        setCashBalance(cashRes.data.current_balance || 0);
      } catch (err) {
        console.error('Error fetching trade prerequisites:', err);
        setError('Failed to load stocks or cash balance.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!stockId) {
      setError('Please select a stock.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (!price || Number(price) <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transactions/trade/', {
        stock_id: stockId,
        transaction_type: transactionType,
        quantity: Number(quantity),
        price: Number(price),
        date: date,
        notes: notes,
      });
      setSuccess(res.data.message || 'Trade executed successfully!');
      setTimeout(() => {
        router.push('/holdings');
      }, 1200);
    } catch (err) {
      console.error('Trade error:', err);
      setError(err.response?.data?.error || 'Trade execution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Execute Trade</h1>
          <p className="text-sm text-white/50 mt-1">Buy or sell assets in your portfolio.</p>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Trade Order</h2>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80">
                Available Cash: <strong className="text-white">{formatCurrency(cashBalance)}</strong>
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm animate-slide-up">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400 text-sm animate-slide-up">
                <Check className="w-5 h-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Action Toggle (BUY / SELL) */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTransactionType('BUY')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    transactionType === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Buy
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionType('SELL')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    transactionType === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Stock Selection */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Select Stock
                </label>
                <SearchableStockSelect
                  stocks={stocks}
                  selectedStockId={stockId}
                  onChange={(id) => setStockId(id)}
                  placeholder="— Select stock symbol —"
                />
              </div>

              {/* Quantity, Price, Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Price / Share ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full glass-input pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional trade notes..."
                  className="w-full glass-input"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl font-bold text-base text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Submit {transactionType} Order</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
