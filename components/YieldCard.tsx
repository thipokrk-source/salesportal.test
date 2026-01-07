
import React from 'react';
import { YieldMetrics } from '../types';

interface YieldCardProps {
  yields: YieldMetrics;
}

export const YieldCard: React.FC<YieldCardProps> = ({ yields }) => {
  const metrics = [
    { label: 'YPC', full: 'Yield per con', value: yields.ypc, unit: '฿', desc: 'Rev / Con', icon: 'fa-cube' },
    { label: 'YPW', full: 'Yield per weight', value: yields.ypw, unit: '฿/kg', desc: 'Rev / Weight', icon: 'fa-weight-hanging' },
    { label: 'WPC', full: 'Weight per con', value: yields.wpc, unit: 'kg', desc: 'Weight / Con', icon: 'fa-scale-balanced' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center">
        <i className="fas fa-chart-line text-orange-500 mr-2"></i>
        Efficiency Metrics
      </h3>
      <div className="space-y-6">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center group">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-sm font-bold mr-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <i className={`fas ${m.icon}`}></i>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.full}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">{m.value.toFixed(2)} <span className="text-[10px] font-normal text-slate-400 uppercase">{m.unit}</span></p>
                  <p className="text-[10px] text-slate-400 italic">{m.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
