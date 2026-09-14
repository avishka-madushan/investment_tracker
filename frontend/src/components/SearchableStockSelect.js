'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function SearchableStockSelect({ stocks = [], selectedStockId, onChange, placeholder = '— Select stock —' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedStock = stocks.find((s) => String(s.id) === String(selectedStockId));

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStocks = stocks.filter((s) =>
    `${s.symbol} ${s.company}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Search Input / Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="glass-input flex items-center justify-between cursor-pointer select-none"
      >
        <span className={selectedStock ? 'text-white font-medium' : 'text-white/30'}>
          {selectedStock ? `${selectedStock.symbol} — ${selectedStock.company}` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#14141e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Search Box */}
          <div className="p-2 border-b border-white/10 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol or company..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => {
                const isSelected = String(stock.id) === String(selectedStockId);
                return (
                  <div
                    key={stock.id}
                    onClick={() => {
                      onChange(stock.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                        : 'text-white/80 hover:bg-indigo-500/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-xs mr-2 text-white">
                        {stock.symbol}
                      </span>
                      <span>{stock.company}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-white/40">No stocks found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
