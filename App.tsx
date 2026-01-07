
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserRole, UserPerformance, CustomerData } from './types';
import { INITIAL_KEX_DATA, MOCK_CUSTOMERS } from './constants';
import { StatCard } from './components/StatCard';
import { CustomerTable } from './components/CustomerTable';
import { YieldCard } from './components/YieldCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

declare var XLSX: any;
declare var html2canvas: any;

const formatCompactNumber = (number: number) => {
  if (number >= 1000000) return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (number >= 1000) return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return number.toString();
};

interface DailyData { day: string; rev: number; con: number; }
interface StagedFiles { hierarchy: any[][] | null; performance: any[][] | null; target: any[][] | null; }
interface MonthlySnapshot { month: string; year: string; customers: any[]; systemData: UserPerformance; rawFiles: StagedFiles | null; }

const LoginPage: React.FC<{ onLogin: (id: string, pass: string) => void }> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  return (
    <div className="min-h-screen bg-orange-600 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-orange-600 italic tracking-tighter">KEX</h1>
          <h2 className="text-xl font-black text-slate-900 uppercase italic">Sales Portal</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Demo: admin / 123456</p>
        </div>
        <div className="space-y-4 text-left">
          <input type="text" placeholder="Employee ID" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={id} onChange={(e) => setId(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500 outline-none font-bold" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onLogin(id, pass)} />
          <button onClick={() => onLogin(id, pass)} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all shadow-xl active:scale-95">Authenticate</button>
        </div>
      </div>
    </div>
  );
};

const AdminImportSection: React.FC<{ onClose: () => void; onDataCommit: (files: StagedFiles) => void; }> = ({ onClose, onDataCommit }) => {
  const [staged, setStaged] = useState<StagedFiles>({ hierarchy: null, performance: null, target: null });
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: keyof StagedFiles) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as any[][];
      setStaged(prev => ({ ...prev, [type]: data }));
    };
    reader.readAsBinaryString(file);
  };
  return (
    <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-black uppercase text-xl italic"><i className="fas fa-database mr-3 text-orange-500"></i>Data Center</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['hierarchy', 'performance', 'target'].map((id) => (
          <div key={id} className={`p-6 rounded-2xl border transition-all ${staged[id as keyof StagedFiles] ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/5'}`}>
            <p className="text-white font-black uppercase text-xs mb-4">{id}</p>
            <label className="block w-full py-3 text-[10px] font-black uppercase bg-orange-600 text-white rounded-xl text-center cursor-pointer hover:bg-orange-500 transition-all">
              Upload <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, id as any)} />
            </label>
          </div>
        ))}
      </div>
      {staged.hierarchy && staged.performance && staged.target && (
        <button onClick={() => onDataCommit(staged)} className="w-full mt-8 py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl">Sync Sales Data</button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserPerformance | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [dayRange, setDayRange] = useState({ start: 1, end: 31 });
  const [history, setHistory] = useState<MonthlySnapshot[]>([{ month: 'Dec', year: '2025', customers: MOCK_CUSTOMERS, systemData: INITIAL_KEX_DATA, rawFiles: null }]);
  const [selectedUser, setSelectedUser] = useState<UserPerformance>(INITIAL_KEX_DATA);
  const [showAdminImport, setShowAdminImport] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const currentSnapshot = useMemo(() => history.find(h => h.month === selectedMonth && h.year === selectedYear), [history, selectedMonth, selectedYear]);

  useEffect(() => {
    if (currentUser && currentSnapshot) {
      if (currentUser.role === UserRole.ADMIN) setSelectedUser(currentSnapshot.systemData);
      else {
        const findUser = (node: UserPerformance, id: string): UserPerformance | null => {
          if (node.id === id) return node;
          if (node.subordinates) {
            for (const sub of node.subordinates) {
              const f = findUser(sub, id);
              if (f) return f;
            }
          }
          return null;
        };
        const fresh = findUser(currentSnapshot.systemData, currentUser.id);
        if (fresh) setSelectedUser(fresh);
      }
    }
  }, [selectedMonth, selectedYear, history, currentUser, currentSnapshot]);

  const handleLogin = (id: string, pass: string) => {
    if (id === 'admin' && pass === '123456') {
      setCurrentUser(INITIAL_KEX_DATA);
      return;
    }
    alert("Check demo credentials (admin / 123456)");
  };

  const filteredCustomers = useMemo(() => {
    if (!currentSnapshot) return [];
    let custs = currentSnapshot.customers;
    if (selectedUser.role !== UserRole.ADMIN) {
      custs = custs.filter(c => c.smeId === selectedUser.id || c.rsmId === selectedUser.id || c.srsmId === selectedUser.id);
    }
    return custs.map(c => {
      const daily = c.daily.filter((d: any) => parseInt(d.day) >= dayRange.start && parseInt(d.day) <= dayRange.end);
      return { ...c, revenue: daily.reduce((a: any, b: any) => a + b.rev, 0), con: daily.reduce((a: any, b: any) => a + b.con, 0), daily };
    });
  }, [currentSnapshot, selectedUser, dayRange]);

  const rangeMetrics = useMemo(() => {
    const rev = filteredCustomers.reduce((a, b) => a + b.revenue, 0);
    const con = filteredCustomers.reduce((a, b) => a + b.con, 0);
    const weight = filteredCustomers.reduce((a, b) => a + b.weight, 0);
    const target = selectedUser.rev.target || 0;
    return { rev, con, progress: target > 0 ? (rev / target) * 100 : 0, yields: { ypc: con > 0 ? rev / con : 0, ypw: weight > 0 ? rev / weight : 0, wpc: con > 0 ? weight / con : 0 } };
  }, [filteredCustomers, selectedUser]);

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-orange-600 italic tracking-tighter">KEX</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-[11px] font-black uppercase">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent px-3 py-1 cursor-pointer outline-none">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={() => setShowAdminImport(!showAdminImport)} className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all"><i className="fas fa-file-import"></i></button>
          )}
          <button onClick={() => setCurrentUser(null)} className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-sign-out-alt"></i></button>
        </div>
      </header>

      <main ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {showAdminImport && <AdminImportSection onClose={() => setShowAdminImport(false)} onDataCommit={() => alert("Sync Success")} />}
        
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">{selectedUser.name}</h2>
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.3em]">{selectedUser.role} • {selectedMonth} {selectedYear}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Revenue" value={`฿${rangeMetrics.rev.toLocaleString()}`} unit="THB" metric={{ actual: rangeMetrics.rev, progress: rangeMetrics.progress, target: selectedUser.rev.target }} colorClass="bg-indigo-600" icon="fas fa-coins" />
          <StatCard title="Consignment" value={rangeMetrics.con.toLocaleString()} unit="Items" metric={{ actual: rangeMetrics.con, progress: 0 }} colorClass="bg-orange-500" icon="fas fa-box" />
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">YPC Efficiency</p>
            <h3 className="text-4xl font-black text-slate-900 italic mt-2">฿{rangeMetrics.yields.ypc.toFixed(1)}</h3>
            <p className="text-[10px] font-bold text-orange-600 uppercase">Avg Yield Per Item</p>
          </div>
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Achievement</p>
            <h3 className="text-5xl font-black italic mt-2">{rangeMetrics.progress.toFixed(1)}%</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm h-[400px]">
               <h3 className="text-xs font-black uppercase text-slate-900 mb-8 italic">Revenue Trend (Range)</h3>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredCustomers[0]?.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="rev" stroke="#f97316" fill="#f9731610" strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            <CustomerTable customers={filteredCustomers} />
          </div>
          <div className="space-y-8">
            <Yield