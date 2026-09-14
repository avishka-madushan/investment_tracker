'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function CashPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entryType, setEntryType] = useState('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCashData = async () => {
    try {
      const res = await api.get('/portfolio/cash/');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching cash account data:', err);
      setError('Failed to load cash account details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/portfolio/cash/', {
        entry_type: entryType,
        amount: Number(amount),
        date: date,
        description: description,
      });
      setSuccess(`Successfully recorded ${entryType.toLowerCase()} of ${formatCurrency(amount)}`);
      setAmount('');
      setDescription('');
      fetchCashData();
    } catch (err) {
      console.error('Cash transaction error:', err);
      setError(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Cash Management</h1>
          <p className="text-sm text-white/50 mt-1">Deposit or withdraw funds from your investment account.</p>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Top Grid: Balance Card & Transfer Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Balance Card */}
              <div className="lg:col-span-5 glass-card p-8 flex flex-col justify-center text-center relative overflow-hidden border border-sky-500/30">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Available Cash Balance</p>
                <h2 className="text-4xl font-extrabold text-white mt-2">
                  {formatCurrency(data?.current_balance || 0)}
                </h2>
              </div>

              {/* Transfer Form */}
              <div className="lg:col-span-7 glass-card p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-white pb-4 border-b border-white/10 mb-6">Transfer Funds</h3>

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
                  
                  {/* Radio Toggle: Deposit vs Withdraw */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setEntryType('DEPOSIT')}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                        entryType === 'DEPOSIT'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      <span>Deposit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryType('WITHDRAWAL')}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                        entryType === 'WITHDRAWAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10'
                          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Withdraw</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                        Amount ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
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

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Monthly bank deposit"
                      className="w-full glass-input"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>Confirm Transfer</span>
                      )}
                    </button>
                  </div>

                </form>
              </div>

            </div>

            {/* Cash Entries Ledger Table */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-base font-semibold text-white">Cash Movement Ledger</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-4">Type</th>
                      <th className="py-4 px-4">Description</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {data?.cash_entries && data.cash_entries.length > 0 ? (
                      data.cash_entries.map((entry, i) => {
                        const isPositive = Number(entry.amount) > 0;
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 text-white/60 text-xs">{formatDate(entry.date)}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                                isPositive
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/15 text-red-400 border-red-500/20'
                              }`}>
                                {entry.entry_type_display}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-white/80 text-xs">{entry.description || '-'}</td>
                            <td className="py-4 px-6 text-right font-semibold">
                              <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                                {isPositive ? '+' : ''}{formatCurrency(entry.amount)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-white/40">
                          No cash records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </AuthGuard>
  );
}
