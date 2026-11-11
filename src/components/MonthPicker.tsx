import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
}

const formatMonthLabel = (mKey: string) => {
  const [year, month] = mKey.split('-').map(Number);
  if (!year || !month) return mKey;
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const MonthPicker: React.FC<MonthPickerProps> = ({ selectedMonth, setSelectedMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(
    () => parseInt(selectedMonth.split('-')[0]) || new Date().getFullYear()
  );
  const currentMonthKey = getCurrentMonthKey();

  const select = (mKey: string) => {
    setSelectedMonth(mKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const y = parseInt(selectedMonth.split('-')[0]);
          if (y) setPickerYear(y);
          setIsOpen(prev => !prev);
        }}
        className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-violet-300 hover:bg-slate-50/80 active:scale-98 transition-all cursor-pointer select-none"
      >
        <div className="w-6 h-6 rounded-lg bg-violet-100/70 text-violet-600 flex items-center justify-center shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <span className="font-display font-bold text-slate-900">{formatMonthLabel(selectedMonth)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-violet-600' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close popover */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
            {/* Year navigation */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setPickerYear(prev => prev - 1)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-display font-extrabold text-xs text-slate-800 tracking-tight">
                {pickerYear} Calendar
              </span>
              <button
                type="button"
                onClick={() => setPickerYear(prev => prev + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const mKey = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                const isSelected = selectedMonth === mKey;
                const isCurrent = mKey === currentMonthKey;
                const monthName = new Date(pickerYear, i, 1).toLocaleDateString('en-US', { month: 'short' });

                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => select(mKey)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-200 scale-105'
                        : isCurrent
                        ? 'bg-violet-50 text-violet-700 border border-violet-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <span>{monthName}</span>
                    {isCurrent && <span className={`text-[8px] mt-0.5 ${isSelected ? 'opacity-90 text-violet-100' : 'text-violet-500 font-bold'}`}>• Today</span>}
                  </button>
                );
              })}
            </div>

            {/* Date Input Shortcut */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Or pick date:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) select(e.target.value);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
