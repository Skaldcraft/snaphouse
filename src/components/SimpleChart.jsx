import React from 'react';
import { motion } from 'framer-motion';

const SimpleChart = ({ data, title, type = 'bar', color = 'blue' }) => {
  // Safe guard: Handle missing, null, or empty data gracefully
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-slate-200 h-full flex flex-col items-center justify-center min-h-[250px] text-slate-400">
        <h3 className="text-lg font-bold text-slate-900 mb-2 w-full text-left">{title}</h3>
        <p className="text-sm">No data available yet</p>
      </div>
    );
  }

  // Calculate max value safely. If max is 0 (all empty), default to 100 to avoid division by zero.
  const validData = data.map(d => ({ ...d, value: Number(d.value) || 0 }));
  const maxValue = Math.max(...validData.map(d => d.value)) || 100;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-slate-200 h-full min-h-[250px] flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
      
      <div className="flex items-end justify-between flex-1 gap-2 pb-2">
        {validData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            {/* Tooltip */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 pointer-events-none">
              {item.label}: {item.value}
            </div>
            
            {/* Bar */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-${color}-500 to-${color}-400 hover:from-${color}-600 hover:to-${color}-500 transition-colors opacity-80 hover:opacity-100 min-h-[4px]`}
            />
            
            {/* Label */}
            <span className="text-xs text-slate-500 mt-2 truncate w-full text-center block" title={item.label}>
              {item.shortLabel || item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChart;