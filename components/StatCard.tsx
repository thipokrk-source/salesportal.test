
import React from 'react';
import { SalesMetric } from '../types';

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  metric: SalesMetric;
  colorClass: string;
  icon: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, unit, metric, colorClass, icon }) => {
  const hasTarget = metric.target !== undefined && metric.target !== null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-800">
            {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
          </h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 text-xl`}>
          <i className={`${icon} ${colorClass.replace('bg-', 'text-')}`}></i>
        </div>
      </div>
      
      <div className="space-y-2">
        {hasTarget ? (
          <>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Target: {metric.target?.toLocaleString()}</span>
              <span className="font-semibold text-slate-700">{metric.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${colorClass}`} 
                style={{ width: `${Math.min(metric.progress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {metric.actual < (metric.target || 0)
                ? `-${((metric.target || 0) - metric.actual).toLocaleString()} vs Target`
                : `+${(metric.actual - (metric.target || 0)).toLocaleString()} over Target`}
            </p>
          </>
        ) : (
          <div className="pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Volume Monitoring Only</p>
          </div>
        )}
      </div>
    </div>
  );
};
