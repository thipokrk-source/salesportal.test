
import React, { useState, useMemo } from 'react';
import { CustomerData } from '../types';

declare var XLSX: any;

interface DailyData {
  day: string;
  rev: number;
  con: number;
}

interface CustomerWithSaleMapping extends CustomerData {
  smeId: string;
  rsmId: string;
  srsmId: string;
  smeName?: string;
  rsmName?: string;
  srsmName?: string;
  daily: DailyData[];
}

interface ExtendedCustomerData extends CustomerWithSaleMapping {
  ypc: number;
  ypw: number;
  wpc: number;
}

interface CustomerTableProps {
  customers: CustomerWithSaleMapping[];
  onSelectCustomer?: (customer: CustomerWithSaleMapping) => void;
  activeRange?: string;
}

type SortConfig = {
  key: keyof ExtendedCustomerData;
  direction: 'asc' | 'desc';
} | null;

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onSelectCustomer, activeRange }) => {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'revenue', direction: 'desc' });
  
  const enrichedData = useMemo(() => {
    return customers.map(c => ({
      ...c,
      ypc: c.con > 0 ? c.revenue / c.con : 0,
      ypw: c.weight > 0 ? c.revenue / c.weight : 0,
      wpc: c.con > 0 ? c.weight / c.con : 0
    }));
  }, [customers]);

  const filteredData = useMemo(() => {
    let result = [...enrichedData];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.code.toLowerCase().includes(lowerQuery) || 
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.mobile && c.mobile.toLowerCase().includes(lowerQuery)) ||
        c.smeId.toLowerCase().includes(lowerQuery) ||
        (c.smeName && c.smeName.toLowerCase().includes(lowerQuery)) ||
        c.rsmId.toLowerCase().includes(lowerQuery) ||
        (c.rsmName && c.rsmName.toLowerCase().includes(lowerQuery)) ||
        c.srsmId.toLowerCase().includes(lowerQuery) ||
        (c.srsmName && c.srsmName.toLowerCase().includes(lowerQuery))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [enrichedData, searchQuery, sortConfig]);

  const displayedCustomers = showAll ? filteredData : filteredData.slice(0, 10);

  const requestSort = (key: keyof ExtendedCustomerData) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ExtendedCustomerData) => {
    if (!sortConfig || sortConfig.key !== key) return 'fa-sort text-slate-200';
    return sortConfig.direction === 'asc' ? 'fa-sort-up text-orange-500' : 'fa-sort-down text-orange-500';
  };

  const handleExport = () => {
    if (filteredData.length === 0) return alert("No data to export");
    const exportData = filteredData.map(c => ({
      'Code': c.code,
      'Name': c.name,
      'Mobile': c.mobile,
      'Revenue': c.revenue,
      'Con': c.con,
      'MoM %': c.momChange.toFixed(2) + '%',
      'YPC': c.ypc.toFixed(2),
      'YPW': c.ypw.toFixed(2),
      'Status': c.status,
      'SME': `${c.smeName} (${c.smeId})`,
      'RSM': `${c.rsmName} (${c.rsmId})`,
      'SRSM': `${c.srsmName} (${c.srsmId})`
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `KEX_Full_Intelligence_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Customer Intelligence</h3>
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">
            {activeRange ? `Analysis for ${activeRange}` : 'Full month daily insights'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Search Cust/Sales/ID..." 
            className="pl-4 pr-4 py-2 text-[12px] font-bold border border-slate-200 rounded-xl bg-slate-50 w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleExport} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white hover:bg-orange-600 transition-all shadow-md flex items-center gap-2">
            <i className="fas fa-file-excel"></i> Export
          </button>
          <button onClick={() => setShowAll(!showAll)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${showAll ? 'bg-orange-600 text-white' : 'bg-slate-50 text-orange-600'}`}>
            {showAll ? 'Show Top 10' : 'View Full List'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-hide text-slate-900">
        <table className="w-full text-left min-w-[1200px]">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th className="px-6 py-5 cursor-pointer" onClick={() => requestSort('name')}>Customer Info <i className={`ml-1 fas ${getSortIcon('name')}`}></i></th>
              <th className="px-4 py-5 text-right cursor-pointer" onClick={() => requestSort('revenue')}>Range Rev <i className={`ml-1 fas ${getSortIcon('revenue')}`}></i></th>
              <th className="px-4 py-5 text-right cursor-pointer" onClick={() => requestSort('con')}>Range Con <i className={`ml-1 fas ${getSortIcon('con')}`}></i></th>
              <th className="px-4 py-5 text-right cursor-pointer" onClick={() => requestSort('momChange')}>Full MoM% <i className={`ml-1 fas ${getSortIcon('momChange')}`}></i></th>
              <th className="px-4 py-5 text-right cursor-pointer" onClick={() => requestSort('ypc')}>YPC <i className={`ml-1 fas ${getSortIcon('ypc')}`}></i></th>
              <th className="px-4 py-5 text-right cursor-pointer" onClick={() => requestSort('ypw')}>YPW <i className={`ml-1 fas ${getSortIcon('ypw')}`}></i></th>
              <th className="px-4 py-5 text-center">Status</th>
              <th className="px-6 py-5">SME Attribution</th>
              <th className="px-6 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {displayedCustomers.map((c) => (
              <tr 
                key={c.code} 
                onClick={() => onSelectCustomer?.(c)}
                className="hover:bg-orange-50 cursor-pointer transition-all group"
              >
                <td className="px-6 py-5">
                   <div className="font-black text-slate-800 uppercase tracking-tight group-hover:text-orange-600">{c.name}</div>
                   <div className="text-[10px] text-slate-400 font-bold flex gap-2">
                    <span>{c.code}</span>
                    {c.mobile && <span>• {c.mobile}</span>}
                   </div>
                </td>
                <td className="px-4 py-5 text-right text-slate-900 font-black italic">฿{c.revenue.toLocaleString()}</td>
                <td className="px-4 py-5 text-right text-slate-800 font-bold">{c.con.toLocaleString()}</td>
                <td className={`px-4 py-5 text-right font-black ${c.momChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.momChange > 0 ? '+' : ''}{c.momChange.toFixed(1)}%
                </td>
                <td className="px-4 py-5 text-right text-orange-600 font-bold">{c.ypc.toFixed(1)}</td>
                <td className="px-4 py-5 text-right text-indigo-600 font-bold">{c.ypw.toFixed(1)}</td>
                <td className="px-4 py-5 text-center">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${c.status === 'New' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="text-[11px] font-black text-slate-700 uppercase">{c.smeName || 'N/A'}</div>
                  <div className="text-[9px] text-slate-400 font-bold">{c.smeId}</div>
                </td>
                <td className="px-6 py-5 text-slate-900">
                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
                    <i className="fas fa-chart-line text-[12px]"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
