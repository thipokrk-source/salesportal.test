import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserRole, UserPerformance, CustomerData } from './types';
import { INITIAL_EMPTY_DATA } from './constants';
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

interface DailyData {
  day: string;
  rev: number;
  con: number;
}

interface StagedFiles {
  hierarchy: any[][] | null;
  performance: any[][] | null;
  target: any[][] | null;
}

interface MonthlySnapshot {
  month: string;
  year: string;
  customers: CustomerWithSaleMapping[];
  systemData: UserPerformance;
  rawFiles: StagedFiles; 
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

const GenericListModal: React.FC<{
  title: string;
  subtitle: string;
  customers: any[];
  onClose: () => void;
  renderRow: (c: any) => React.ReactNode;
  onExport: () => void;
}> = ({ title, subtitle, customers, onClose, renderRow, onExport }) => (
  <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 italic uppercase">{title}</h3>
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onExport} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all">
            <i className="fas fa-file-excel"></i>
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 divide-y divide-slate-50">
        {customers.map(renderRow)}
      </div>
    </div>
  </div>
);

const CustomerInsightModal: React.FC<{
  customer: CustomerWithSaleMapping;
  onClose: () => void;
}> = ({ customer, onClose }) => {
  const ypc = customer.con > 0 ? customer.revenue / customer.con : 0;
  const ypw = customer.weight > 0 ? customer.revenue / customer.weight : 0;
  const wpc = customer.con > 0 ? customer.weight / customer.con : 0;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#f8fafc] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[95vh]">
        <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
              {customer.name}
            </h3>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">
              {customer.code} • SME: {customer.smeName}
            </p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
              <p className="text-2xl font-black text-slate-900 italic">฿{customer.revenue.toLocaleString()}</p>
              <div className={`text-[10px] font-bold mt-1 ${customer.momChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {customer.momChange >= 0 ? '+' : ''}{customer.momChange.toFixed(1)}% MoM
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consignment</p>
              <p className="text-2xl font-black text-slate-900 italic">{customer.con.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Items shipped</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">YPC</p>
              <p className="text-2xl font-black text-slate-900 italic">฿{ypc.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Yield per con</p>
            </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">YPW / WPC</p>
              <p className="text-2xl font-black text-slate-900 italic">{ypw.toFixed(1)} <span className="text-[12px] font-normal text-slate-400">/ {wpc.toFixed(1)}</span></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Efficiency metrics</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em]">Daily Shipment Trend</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div><span className="text-[9px] font-black uppercase text-slate-400">Revenue</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div><span className="text-[9px] font-black uppercase text-slate-400">Con</span></div>
                </div>
             </div>
             <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customer.daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                    <YAxis tickFormatter={formatCompactNumber} axisLine={false} tickLine={false} fontSize={10} fontStyle="italic" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Area type="monotone" dataKey="rev" stroke="#f97316" fill="#f9731610" strokeWidth={3} />
                    <Area type="monotone" dataKey="con" stroke="#6366f1" fill="#6366f110" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
             <div className="bg-orange-50 p-6 rounded-[24px] border border-orange-100">
                <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-4">Yield Intelligence</p>
                <div className="space-y-3">
                   <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                      <span className="text-[11px] font-bold text-orange-600">Yield Per Con (YPC)</span>
                      <span className="text-sm font-black text-slate-900">฿{ypc.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                      <span className="text-[11px] font-bold text-orange-600">Yield Per Weight (YPW)</span>
                      <span className="text-sm font-black text-slate-900">฿{ypw.toFixed(2)} /kg</span>
                   </div>
                </div>
             </div>
             <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-4">Weight Efficiency</p>
                <div className="space-y-3">
                   <div className="flex justify-between items-center border-b border-indigo-200/50 pb-2">
                      <span className="text-[11px] font-bold text-indigo-600">Avg Weight Per Con</span>
                      <span className="text-sm font-black text-slate-900">{wpc.toFixed(2)} kg</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-indigo-200/50 pb-2">
                      <span className="text-[11px] font-bold text-indigo-600">Total Month Weight</span>
                      <span className="text-sm font-black text-slate-900">{customer.weight.toLocaleString()} kg</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage: React.FC<{ onLogin: (id: string, pass: string) => void }> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen bg-orange-600 flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-orange-600 italic tracking-tighter">KEX EXPRESS</h1>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">Sales Portal</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enter Credentials to Access Dashboard</p>
        </div>
        <div className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Employee ID</label>
            <input 
              type="text" 
              placeholder="Enter Employee ID" 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="••••" 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLogin(id, pass)}
            />
          </div>
          <button 
            onClick={() => onLogin(id, pass)}
            className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all shadow-xl active:scale-95 mt-2"
          >
            Authenticate
          </button>
        </div>
        <div className="pt-4 border-t border-slate-50">
           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
             Authorized Personnel Only
           </p>
        </div>
      </div>
    </div>
  );
};

const RoleManagement: React.FC<{ 
  onClose: () => void;
  hierarchy: UserPerformance;
  onUpdateHierarchy: (newAdmin: UserPerformance) => void;
}> = ({ onClose, hierarchy, onUpdateHierarchy }) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.SME);
  const [newUserRegion, setNewUserRegion] = useState('BKK');
  const [parentUserId, setParentUserId] = useState('');

  const allUsers = useMemo(() => {
    const users: UserPerformance[] = [];
    const traverse = (node: UserPerformance) => {
      users.push(node);
      node.subordinates?.forEach(traverse);
    };
    traverse(hierarchy);
    return users;
  }, [hierarchy]);

  const handleEdit = (user: UserPerformance) => {
    setEditingUserId(user.id);
    setNewUserId(user.id);
    setNewUserName(user.name);
    setNewUserRole(user.role);
    setNewUserRegion(user.region);
    
    const findParent = (node: UserPerformance, targetId: string): string => {
      if (node.subordinates) {
        if (node.subordinates.some(s => s.id === targetId)) return node.id;
        for (const sub of node.subordinates) {
          const res = findParent(sub, targetId);
          if (res) return res;
        }
      }
      return '';
    };
    setParentUserId(findParent(hierarchy, user.id));
  };

  const handleDelete = (id: string) => {
    if (id === hierarchy.id) {
      alert("Cannot delete the root system administrator.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${id}? This will also remove all subordinates under this user.`)) return;

    const updatedAdmin = JSON.parse(JSON.stringify(hierarchy));
    
    const removeNodeRecursive = (parent: UserPerformance, targetId: string): boolean => {
      if (!parent.subordinates) return false;
      
      const index = parent.subordinates.findIndex(s => s.id === targetId);
      if (index !== -1) {
        parent.subordinates.splice(index, 1);
        return true;
      }
      
      for (const sub of parent.subordinates) {
        if (removeNodeRecursive(sub, targetId)) return true;
      }
      
      return false;
    };

    if (removeNodeRecursive(updatedAdmin, id)) {
      onUpdateHierarchy(updatedAdmin);
      if (editingUserId === id) resetForm();
      alert("User and their tree removed successfully.");
    } else {
      alert("Error: User not found in system directory.");
    }
  };

  const handleSave = () => {
    if (!newUserId || !newUserName) return alert("Please fill ID and Name");
    
    const newUser: UserPerformance = {
      id: newUserId,
      name: newUserName,
      role: newUserRole,
      region: newUserRegion,
      con: { actual: 0, progress: 0 },
      rev: { target: 0, actual: 0, progress: 0 },
      yields: { ypc: 0, ypw: 0, wpc: 0 },
      customers: { totalSenders: 0, activeSenders: 0, newCustomers: 0, existingCustomers: 0 },
      subordinates: []
    };

    let updatedAdmin = JSON.parse(JSON.stringify(hierarchy));

    const findAndRemove = (node: UserPerformance, targetId: string): UserPerformance | null => {
      if (!node.subordinates) return null;
      const idx = node.subordinates.findIndex(s => s.id === targetId);
      if (idx !== -1) return node.subordinates.splice(idx, 1)[0];
      for (const sub of node.subordinates) {
        const res = findAndRemove(sub, targetId);
        if (res) return res;
      }
      return null;
    };

    let existingData: UserPerformance | null = null;
    if (editingUserId) {
      existingData = findAndRemove(updatedAdmin, editingUserId);
    }

    const finalUser: UserPerformance = {
      ...(existingData || newUser),
      id: newUserId,
      name: newUserName,
      role: newUserRole,
      region: newUserRegion
    };

    const findAndAdd = (node: UserPerformance): boolean => {
      if (node.id === parentUserId) {
        node.subordinates = node.subordinates || [];
        node.subordinates.push(finalUser);
        return true;
      }
      if (node.subordinates) {
        for (const sub of node.subordinates) {
          if (findAndAdd(sub)) return true;
        }
      }
      return false;
    };

    if (newUserRole === UserRole.SR_RSM || newUserRole === UserRole.ADMIN) {
      updatedAdmin.subordinates = updatedAdmin.subordinates || [];
      updatedAdmin.subordinates.push(finalUser);
    } else {
      if (!parentUserId) return alert("Please select a Supervisor");
      if (!findAndAdd(updatedAdmin)) return alert("Parent User ID not found");
    }

    onUpdateHierarchy(updatedAdmin);
    resetForm();
    alert(editingUserId ? "User updated successfully!" : "User added successfully!");
  };

  const resetForm = () => {
    setEditingUserId(null);
    setNewUserId('');
    setNewUserName('');
    setNewUserRole(UserRole.SME);
    setNewUserRegion('BKK');
    setParentUserId('');
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-10 text-slate-900">
          <div>
            <h2 className="text-3xl font-black text-slate-900 italic uppercase">Role Management</h2>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Assign roles and manage organizational access</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest border-l-4 border-orange-500 pl-4">
              {editingUserId ? 'Edit Employee Identity' : 'Add New Identity'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Employee ID</label>
                <input value={newUserId} onChange={e => setNewUserId(e.target.value)} disabled={!!editingUserId} placeholder="kxth..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 outline-none font-bold text-slate-800 placeholder:text-slate-300 disabled:opacity-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Full Name</label>
                <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Name Surname" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 outline-none font-bold text-slate-800 placeholder:text-slate-300" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Role Level</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 outline-none font-bold text-slate-800">
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              {newUserRole !== UserRole.SR_RSM && newUserRole !== UserRole.ADMIN && (
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Reporting Manager (Supervisor)</label>
                   <select value={parentUserId} onChange={e => setParentUserId(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 outline-none font-bold text-slate-800">
                     <option value="">Select Supervisor</option>
                     {allUsers.filter(u => u.role !== UserRole.SME && u.id !== editingUserId).map(u => <option key={u.id} value={u.id}>{u.id} - {u.name} ({u.role})</option>)}
                   </select>
                 </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Region Assignment</label>
                <input value={newUserRegion} onChange={e => setNewUserRegion(e.target.value)} placeholder="Region (e.g. BKKE202)" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 outline-none font-bold text-slate-800 placeholder:text-slate-300" />
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handleSave} className="flex-1 py-4 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-900 transition-all">
                  {editingUserId ? 'Update User' : 'Create Identity'}
                </button>
                {editingUserId && (
                  <button onClick={resetForm} className="px-8 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest border-l-4 border-slate-900 pl-4 mb-6">Current Directory</h3>
            <div className="max-h-[500px] overflow-y-auto scrollbar-hide space-y-2 pr-2">
              {allUsers.map(user => (
                <div key={user.id} className={`p-4 rounded-2xl flex justify-between items-center group border transition-all ${editingUserId === user.id ? 'bg-orange-50 border-orange-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase">{user.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 italic">{user.id} • {user.role} • <span className="text-orange-600">{user.region}</span></p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(user)} className="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-400 hover:text-orange-500" title="Edit User">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    {user.id !== hierarchy.id && (
                      <button onClick={() => handleDelete(user.id)} className="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-400 hover:text-red-500" title="Delete User">
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HierarchyModal: React.FC<{ 
  data: UserPerformance; 
  onClose: () => void; 
  onSelectUser: (user: UserPerformance) => void 
}> = ({ data, onClose, onSelectUser }) => {
  const renderNode = (node: UserPerformance) => {
    if (node.role === UserRole.ADMIN) {
      if (node.subordinates && node.subordinates.length > 0) {
        return (
          <div className="flex gap-8 items-start justify-center w-full">
             {node.subordinates
               .filter(sub => sub.role !== UserRole.ADMIN)
               .map(sub => renderNode(sub))}
          </div>
        );
      }
      return null;
    }

    const filteredSubordinates = node.subordinates?.filter(sub => sub.role !== UserRole.ADMIN) || [];

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div 
          onClick={() => { onSelectUser(node); onClose(); }}
          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-105 shadow-sm min-w-[180px] text-center
            ${node.role === UserRole.SR_RSM ? 'bg-slate-900 border-slate-900 text-white' : 
              node.role === UserRole.RSM ? 'bg-orange-500 border-orange-500 text-white' : 
              'bg-white border-slate-200 text-slate-800'}`}
        >
          <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">{node.role}</p>
          <p className="text-xs font-black uppercase truncate">{node.name}</p>
          <p className="text-[9px] font-bold opacity-60 italic">{node.id}</p>
          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between items-center text-[10px] font-bold">
             <span>฿{formatCompactNumber(node.rev.actual)}</span>
             <span className="bg-black/20 px-1.5 rounded">{node.rev.progress.toFixed(0)}%</span>
          </div>
        </div>
        
        {filteredSubordinates.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-200"></div>
            <div className="flex gap-4 items-start relative pt-6 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-[calc(100%-2rem)] before:h-0.5 before:bg-slate-200">
               {filteredSubordinates.map(sub => (
                 <div key={sub.id} className="relative before:content-[''] before:absolute before:-top-6 before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:h-6 before:bg-slate-200">
                   {renderNode(sub)}
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-[#f8fafc] w-full max-w-7xl max-h-full rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Sales Hierarchy Visualizer</h3>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Sales organizational mapping excluding administrative roles</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-12 flex justify-center items-start scrollbar-hide">
          <div className="inline-block min-w-full">
            {renderNode(data)}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminImportSection: React.FC<{ 
  onClose: () => void;
  onDataCommit: (files: StagedFiles) => void;
}> = ({ onClose, onDataCommit }) => {
  const [staged, setStaged] = useState<StagedFiles>({
    hierarchy: null,
    performance: null,
    target: null
  });

  const downloadTemplate = (type: 'hierarchy' | 'performance' | 'target') => {
    let data: any[] = [];
    let fileName = "";
    
    if (type === 'hierarchy') {
      data = [
        ["SME Name", "SME ID", "SME Region", "RSM Name", "RSM ID", "RSM Region", "SRSM Name", "SRSM ID", "SRSM Region"],
        ["Saransak Inpan", "kxth10009668", "BKKE202", "Artit Sukasame", "kxth6500011", "BKKE", "Akarapol Poramatikul", "kxth6600660", "BKK"]
      ];
      fileName = "KEX_Hierarchy.xlsx";
    } else if (type === 'performance') {
      const headers = [
        "Customer Code", "Customer Name", "Customer Mobile", "SME ID", "RSM ID", "SRSM ID",
        "Total Weight (Ref)", "Status"
      ];
      for (let i = 1; i <= 31; i++) headers.push(`Rev Day ${i}`);
      for (let i = 1; i <= 31; i++) headers.push(`Con Day ${i}`);
      
      const example = [
        "0670040649", "Nidaya Srikaew", "0812345678", "kxth10009668", "kxth6500011", "kxth6600660",
        120.5, "Existing"
      ];
      for (let i = 0; i < 62; i++) example.push(Math.floor(Math.random() * 1000));
      
      data = [headers, example];
      fileName = "KEX_Performance_Daily.xlsx";
    } else {
      data = [["Type", "ID", "Target Rev"], ["SME", "kxth10009668", 1500000]];
      fileName = "KEX_Targets.xlsx";
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
  };

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
    e.target.value = '';
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 mb-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-black uppercase text-xl italic"><i className="fas fa-database mr-3 text-orange-500"></i>Data Management Center</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['hierarchy', 'performance', 'target'].map((id) => (
          <div key={id} className={`p-6 rounded-2xl border ${staged[id as keyof StagedFiles] ? 'border-green-500 bg-green-500/5' : 'border-white/5 bg-white/5'}`}>
            <p className="text-white font-black uppercase text-xs mb-4">{id}</p>
            <div className="flex gap-2">
              <button onClick={() => downloadTemplate(id as any)} className="flex-1 py-2 text-[10px] font-black uppercase bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">Template</button>
              <label className="flex-1 py-2 text-[10px] font-black uppercase bg-orange-600 text-white rounded-lg text-center cursor-pointer hover:bg-orange-500 transition-all">
                Upload <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, id as any)} />
              </label>
            </div>
          </div>
        ))}
      </div>
      {staged.hierarchy && staged.performance && staged.target && (
        <button onClick={() => onDataCommit(staged)} className="w-full mt-6 py-4 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-green-500 transition-all">Sync Dashboard Data</button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserPerformance | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [dayRange, setDayRange] = useState({ start: 1, end: 31 });
  const [history, setHistory] = useState<MonthlySnapshot[]>([]);
  const [viewHistory, setViewHistory] = useState<UserPerformance[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPerformance>(INITIAL_EMPTY_DATA);
  const [showAdminImport, setShowAdminImport] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [showFullLowEff, setShowFullLowEff] = useState(false);
  const [showFullTopDecline, setShowFullTopDecline] = useState(false);
  const [selectedInsightCustomer, setSelectedInsightCustomer] = useState<CustomerWithSaleMapping | null>(null);

  const dashboardRef = useRef<HTMLDivElement>(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = useMemo(() => {
    const yrList = [];
    for (let y = 2023; y <= 2050; y++) yrList.push(y.toString());
    return yrList;
  }, []);

  const currentSnapshot = useMemo(() => {
    return history.find(h => h.month === selectedMonth && h.year === selectedYear);
  }, [history, selectedMonth, selectedYear]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) {
        const adminData = currentSnapshot ? currentSnapshot.systemData : INITIAL_EMPTY_DATA;
        setSelectedUser(adminData);
        setViewHistory([adminData]);
      } else {
        const freshUserData = currentSnapshot ? findUserRecursive(currentSnapshot.systemData, currentUser.id) : null;
        if (freshUserData) {
          setSelectedUser(freshUserData);
          setViewHistory([freshUserData]);
        } else {
          setSelectedUser(INITIAL_EMPTY_DATA);
          setViewHistory([INITIAL_EMPTY_DATA]);
        }
      }
    }
  }, [selectedMonth, selectedYear, history, currentUser]);

  const findUserRecursive = (node: UserPerformance, targetId: string): UserPerformance | null => {
    if (node.id === targetId) return node;
    if (node.subordinates) {
      for (const sub of node.subordinates) {
        const found = findUserRecursive(sub, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleLogin = (id: string, pass: string) => {
    if (id.toLowerCase() === 'admin' && pass === '123456') {
      const admin = currentSnapshot ? currentSnapshot.systemData : INITIAL_EMPTY_DATA;
      setCurrentUser(admin);
      setSelectedUser(admin);
      setViewHistory([admin]);
      return;
    }
    
    if (currentSnapshot) {
      if (pass !== '0000') {
        alert("Incorrect password for Sale access. (Default is 0000)");
        return;
      }
      const user = findUserRecursive(currentSnapshot.systemData, id);
      if (user) {
        setCurrentUser(user);
        setSelectedUser(user);
        setViewHistory([user]);
      } else {
        alert("Employee ID not found in current dataset.");
      }
    } else {
      alert("System data not loaded. Please contact an administrator.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUser(INITIAL_EMPTY_DATA);
    setViewHistory([]);
  };

  const filteredCustomers = useMemo(() => {
    if (!currentSnapshot) return [];
    let customers = currentSnapshot.customers;
    
    if (selectedUser.role !== UserRole.ADMIN) {
      customers = customers.filter(c => {
        if (selectedUser.role === UserRole.SME) return c.smeId === selectedUser.id;
        if (selectedUser.role === UserRole.RSM) return c.rsmId === selectedUser.id;
        if (selectedUser.role === UserRole.SR_RSM) return c.srsmId === selectedUser.id;
        return false;
      });
    }

    // Apply day range filter
    return customers.map(c => {
      const filteredDaily = c.daily.filter(d => {
        const dNum = parseInt(d.day);
        return dNum >= dayRange.start && dNum <= dayRange.end;
      });
      const rangeRev = filteredDaily.reduce((acc, d) => acc + d.rev, 0);
      const rangeCon = filteredDaily.reduce((acc, d) => acc + d.con, 0);
      
      return {
        ...c,
        revenue: rangeRev,
        con: rangeCon,
        daily: filteredDaily
      };
    });
  }, [currentSnapshot, selectedUser, dayRange]);

  const rangeMetrics = useMemo(() => {
    const rev = filteredCustomers.reduce((acc, c) => acc + c.revenue, 0);
    const con = filteredCustomers.reduce((acc, c) => acc + c.con, 0);
    const weight = filteredCustomers.reduce((acc, c) => acc + c.weight, 0);
    const target = selectedUser.rev.target || 0;
    
    return {
      rev,
      con,
      progress: target > 0 ? (rev / target) * 100 : 0,
      yields: {
        ypc: con > 0 ? rev / con : 0,
        ypw: weight > 0 ? rev / weight : 0,
        wpc: con > 0 ? weight / con : 0
      }
    };
  }, [filteredCustomers, selectedUser.rev.target]);

  const allDeclineCustomers = useMemo(() => {
    return filteredCustomers
      .filter(c => c.momChange < 0 && c.lastMonthRev > 0)
      .sort((a, b) => a.momChange - b.momChange);
  }, [filteredCustomers]);

  const topDeclineCustomers = useMemo(() => allDeclineCustomers.slice(0, 5), [allDeclineCustomers]);

  const allLowEffCustomers = useMemo(() => {
    return filteredCustomers
      .map(c => ({
        ...c,
        ypc: c.con > 0 ? c.revenue / c.con : 0,
        ypw: c.weight > 0 ? c.revenue / c.weight : 0
      }))
      .filter(c => (c.ypc > 0 && c.ypc < 15) || (c.ypw > 0 && c.ypw < 5))
      .sort((a, b) => a.ypc - b.ypc);
  }, [filteredCustomers]);

  const lowEfficiencyCustomersPreview = useMemo(() => allLowEffCustomers.slice(0, 5), [allLowEffCustomers]);

  const handleExportList = (data: any[], fileName: string) => {
    const exportData = data.map(c => ({
      'Code': c.code,
      'Name': c.name,
      'Mobile': c.mobile || '-',
      'Revenue': c.revenue,
      'YPC': (c.con > 0 ? c.revenue/c.con : 0).toFixed(2),
      'YPW': (c.weight > 0 ? c.revenue/c.weight : 0).toFixed(2),
      'MoM Change': c.momChange ? `${c.momChange.toFixed(2)}%` : '0%'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "List");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const aggregatedDailyData = useMemo(() => {
    const dailyMap = new Map<string, { day: string, rev: number, con: number }>();
    for (let i = dayRange.start; i <= dayRange.end; i++) {
        dailyMap.set(i.toString(), { day: i.toString(), rev: 0, con: 0 });
    }
    filteredCustomers.forEach(c => {
      c.daily.forEach((d) => {
        const entry = dailyMap.get(d.day);
        if (entry) {
          entry.rev += d.rev;
          entry.con += d.con;
        }
      });
    });
    return Array.from(dailyMap.values()).sort((a,b) => parseInt(a.day) - parseInt(b.day));
  }, [filteredCustomers, dayRange]);

  const processMonth = (month: string, year: string, files: StagedFiles, fullHistory: MonthlySnapshot[]): MonthlySnapshot => {
    let tempCustomers: CustomerWithSaleMapping[] = [];
    const srsmMap = new Map<string, UserPerformance>();
    const namesLookup = new Map<string, string>();
    const monthIdx = months.indexOf(month);
    const prevMonthName = monthIdx === 0 ? months[11] : months[monthIdx - 1];
    const prevYearName = monthIdx === 0 ? (parseInt(year) - 1).toString() : year;
    const prevSnapshot = fullHistory.find(h => h.month === prevMonthName && h.year === prevYearName);
    files.hierarchy!.slice(1).forEach(row => {
      const [smeN, smeId, smeReg, rsmN, rsmId, rsmReg, srsmN, srsmId, srsmReg] = row.map(c => c?.toString().trim());
      if (!srsmId || !smeId) return;
      namesLookup.set(smeId, smeN);
      namesLookup.set(rsmId, rsmN);
      namesLookup.set(srsmId, srsmN);
      if (!srsmMap.has(srsmId)) {
        srsmMap.set(srsmId, {
          id: srsmId, name: srsmN, role: UserRole.SR_RSM, region: srsmReg,
          con: { actual: 0, progress: 0 }, rev: { target: 0, actual: 0, progress: 0 },
          yields: { ypc: 0, ypw: 0, wpc: 0 }, customers: { totalSenders: 0, activeSenders: 0, newCustomers: 0, existingCustomers: 0 },
          subordinates: []
        });
      }
      const srsmNode = srsmMap.get(srsmId)!;
      let rsmNode = srsmNode.subordinates!.find(s => s.id === rsmId);
      if (!rsmNode) {
        rsmNode = { id: rsmId, name: rsmN, role: UserRole.RSM, region: rsmReg, con: { actual: 0, progress: 0 }, rev: { target: 0, actual: 0, progress: 0 }, yields: { ypc: 0, ypw: 0, wpc: 0 }, customers: { totalSenders: 0, activeSenders: 0, newCustomers: 0, existingCustomers: 0 }, subordinates: [] };
        srsmNode.subordinates!.push(rsmNode);
      }
      if (!rsmNode.subordinates!.find(s => s.id === smeId)) {
        rsmNode.subordinates!.push({ id: smeId, name: smeN, role: UserRole.SME, region: smeReg, con: { actual: 0, progress: 0 }, rev: { target: 0, actual: 0, progress: 0 }, yields: { ypc: 0, ypw: 0, wpc: 0 }, customers: { totalSenders: 0, activeSenders: 0, newCustomers: 0, existingCustomers: 0 } });
      }
    });
    files.performance!.slice(1).forEach(row => {
      const [cCode, cName, cMob, sId, rId, srId, weightRef, status] = row.map(v => v?.toString().trim());
      const daily: DailyData[] = [];
      let totalRev = 0;
      let totalCon = 0;
      for (let i = 0; i < 31; i++) {
        const dRev = parseFloat(row[8 + i]) || 0;
        const dCon = parseFloat(row[39 + i]) || 0;
        totalRev += dRev;
        totalCon += dCon;
        daily.push({ day: `${i + 1}`, rev: dRev, con: dCon });
      }
      const prevCustomer = prevSnapshot?.customers.find(pc => pc.code === cCode);
      const lmR = prevCustomer?.revenue || 0;
      const lmC = prevCustomer?.con || 0;
      const lmW = prevCustomer?.weight || 0;
      tempCustomers.push({
        code: cCode, name: cName, mobile: cMob,
        revenue: totalRev, con: totalCon, weight: parseFloat(weightRef) || 0,
        status: status === 'New' ? 'New' : 'Existing',
        lastMonthRev: lmR, lastMonthCon: lmC, lastMonthWeight: lmW,
        momChange: lmR > 0 ? ((totalRev - lmR) / lmR) * 100 : 0, 
        smeId: sId, rsmId: rId, srsmId: srId,
        smeName: namesLookup.get(sId) || 'Unknown',
        rsmName: namesLookup.get(rId) || 'Unknown',
        srsmName: namesLookup.get(srId) || 'Unknown',
        daily
      });
    });
    const targetsMap = new Map();
    files.target!.slice(1).forEach(row => targetsMap.set(row[1], parseFloat(row[2]) || 0));
    const aggregate = (node: UserPerformance) => {
      const nodeCustomers = tempCustomers.filter(c => 
        (node.role === UserRole.SME && c.smeId === node.id) ||
        (node.role === UserRole.RSM && c.rsmId === node.id) ||
        (node.role === UserRole.SR_RSM && c.srsmId === node.id)
      );
      node.rev.actual = nodeCustomers.reduce((acc, c) => acc + c.revenue, 0);
      node.con.actual = nodeCustomers.reduce((acc, c) => acc + c.con, 0);
      const totalWeight = nodeCustomers.reduce((acc, c) => acc + c.weight, 0);
      node.rev.target = targetsMap.get(node.id) || 0;
      node.subordinates?.forEach(sub => aggregate(sub));
      if (node.role !== UserRole.SME && node.subordinates && node.subordinates.length > 0) {
        const childrenTarget = node.subordinates.reduce((acc, s) => acc + (s.rev.target || 0), 0);
        if (childrenTarget > (node.rev.target || 0)) {
           node.rev.target = childrenTarget;
        }
      }
      node.rev.progress = node.rev.target ? (node.rev.actual / node.rev.target) * 100 : 0;
      node.customers = {
        totalSenders: nodeCustomers.length,
        activeSenders: nodeCustomers.filter(c => c.con > 0).length,
        newCustomers: nodeCustomers.filter(c => c.status === 'New').length,
        existingCustomers: nodeCustomers.filter(c => c.status === 'Existing').length
      };
      node.yields = {
        ypc: node.con.actual > 0 ? node.rev.actual / node.con.actual : 0,
        ypw: totalWeight > 0 ? node.rev.actual / totalWeight : 0,
        wpc: node.con.actual > 0 ? totalWeight / node.con.actual : 0
      };
    };
    const adminSubordinates = Array.from(srsmMap.values());
    adminSubordinates.forEach(aggregate);
    const adminRevActual = adminSubordinates.reduce((acc, s) => acc + s.rev.actual, 0);
    const adminConActual = adminSubordinates.reduce((acc, s) => acc + s.con.actual, 0);
    const adminRevTarget = adminSubordinates.reduce((acc, s) => acc + (s.rev.target || 0), 0);
    const adminTotalCustomers = tempCustomers.length;
    const adminActiveCustomers = tempCustomers.filter(c => c.con > 0).length;
    const adminNewCustomers = tempCustomers.filter(c => c.status === 'New').length;
    const adminExistingCustomers = tempCustomers.filter(c => c.status === 'Existing').length;
    const adminTotalWeight = tempCustomers.reduce((acc, c) => acc + c.weight, 0);
    const newAdmin: UserPerformance = {
      ...INITIAL_EMPTY_DATA,
      rev: { actual: adminRevActual, target: adminRevTarget, progress: adminRevTarget ? (adminRevActual / adminRevTarget) * 100 : 0 },
      con: { actual: adminConActual, progress: 0 },
      customers: { totalSenders: adminTotalCustomers, activeSenders: adminActiveCustomers, newCustomers: adminNewCustomers, existingCustomers: adminExistingCustomers },
      yields: { ypc: adminConActual > 0 ? adminRevActual / adminConActual : 0, ypw: adminTotalWeight > 0 ? adminRevActual / adminTotalWeight : 0, wpc: adminConActual > 0 ? adminTotalWeight / adminConActual : 0 },
      subordinates: adminSubordinates 
    };
    return { month, year, customers: tempCustomers, systemData: newAdmin, rawFiles: files };
  };

  const handleCommitData = (newFiles: StagedFiles) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.month === selectedMonth && h.year === selectedYear));
      const updatedList = [...filtered, { 
        month: selectedMonth, 
        year: selectedYear, 
        rawFiles: newFiles, 
        customers: [], 
        systemData: INITIAL_EMPTY_DATA 
      }];
      const sortedHistory = [...updatedList].sort((a, b) => {
        if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
      let processedHistory: MonthlySnapshot[] = [];
      for (const snapshot of sortedHistory) {
        const result = processMonth(snapshot.month, snapshot.year, snapshot.rawFiles, processedHistory);
        processedHistory.push(result);
      }
      return processedHistory;
    });
    setShowAdminImport(false);
  };

  const handleUpdateHierarchy = (newAdmin: UserPerformance) => {
    if (currentSnapshot) {
      const newHistory = history.map(h => {
        if (h.month === selectedMonth && h.year === selectedYear) {
          return { ...h, systemData: newAdmin };
        }
        return h;
      });
      setHistory(newHistory);
    }
  };

  const handleCapture = async () => {
    if (!dashboardRef.current) return;
    setIsCapturing(true);
    const originalStyle = dashboardRef.current.style.width;
    const originalMaxW = dashboardRef.current.style.maxWidth;
    const originalMargin = dashboardRef.current.style.margin;
    dashboardRef.current.style.width = '794px';
    dashboardRef.current.style.maxWidth = '794px';
    dashboardRef.current.style.margin = '0';
    await new Promise(r => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: 794,
        windowWidth: 794
      });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `KEX_Dashboard_${selectedUser.id}_${selectedMonth}${selectedYear}.jpg`;
      link.click();
    } catch (err) {
      console.error("Capture failed", err);
      alert("Capture failed. Please try again.");
    } finally {
      dashboardRef.current.style.width = originalStyle;
      dashboardRef.current.style.maxWidth = originalMaxW;
      dashboardRef.current.style.margin = originalMargin;
      setIsCapturing(false);
    }
  };

  const handleSelectHierarchyUser = (user: UserPerformance) => {
    const buildPath = (node: UserPerformance, targetId: string, path: UserPerformance[] = []): UserPerformance[] | null => {
      if (node.id === targetId) return [...path, node];
      if (node.subordinates) {
        for (const sub of node.subordinates) {
          const res = buildPath(sub, targetId, [...path, node]);
          if (res) return res;
        }
      }
      return null;
    };
    if (currentSnapshot) {
      const path = buildPath(currentSnapshot.systemData, user.id);
      if (path) {
        setViewHistory(path);
        setSelectedUser(user);
      }
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      {showHierarchyModal && currentSnapshot && (
        <HierarchyModal 
          data={currentSnapshot.systemData} 
          onClose={() => setShowHierarchyModal(false)}
          onSelectUser={handleSelectHierarchyUser}
        />
      )}
      {selectedInsightCustomer && (
        <CustomerInsightModal 
          customer={selectedInsightCustomer} 
          onClose={() => setSelectedInsightCustomer(null)} 
        />
      )}
      {showFullLowEff && (
        <GenericListModal 
          title="Low Efficiency Monitor"
          subtitle="Full List of Low Yield Accounts"
          customers={allLowEffCustomers}
          onClose={() => setShowFullLowEff(false)}
          onExport={() => handleExportList(allLowEffCustomers, `KEX_LowEff_${selectedMonth}`)}
          renderRow={(c) => (
            <div key={c.code} className="py-4 flex justify-between items-center group">
               <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase text-slate-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase italic">{c.code} • {c.mobile || 'No Mobile'}</p>
                  <p className="text-[10px] text-amber-600 font-black mt-1 uppercase">YPC: {c.ypc.toFixed(1)} • YPW: {c.ypw.toFixed(1)}</p>
               </div>
               <div className="text-right ml-4">
                  <p className="text-sm font-black text-slate-900">฿{c.revenue.toLocaleString()}</p>
                  <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Low Yield</span>
               </div>
            </div>
          )}
        />
      )}
      {showFullTopDecline && (
        <GenericListModal 
          title="Top Performance Decline"
          subtitle="Full list of MoM Revenue Decline"
          customers={allDeclineCustomers}
          onClose={() => setShowFullTopDecline(false)}
          onExport={() => handleExportList(allDeclineCustomers, `KEX_Decline_${selectedMonth}`)}
          renderRow={(c) => (
            <div key={c.code} className="py-4 flex justify-between items-center group">
               <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase text-slate-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase italic">{c.code} • {c.mobile || 'No Mobile'}</p>
               </div>
               <div className="text-right ml-4">
                  <p className="text-sm font-black text-slate-900">฿{c.revenue.toLocaleString()}</p>
                  <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase">{c.momChange.toFixed(1)}%</span>
               </div>
            </div>
          )}
        />
      )}

      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-8">
          <div className="flex items-center justify-center py-2 h-14">
            <h1 className="text-2xl font-black text-orange-600 italic tracking-tighter">KEX</h1>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <div className="relative">
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)} 
                className="appearance-none bg-white border border-orange-200 text-orange-900 font-black uppercase text-[11px] px-4 py-2 pr-8 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer shadow-sm hover:border-orange-300 transition-all"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-orange-500 pointer-events-none"></i>
            </div>
            <div className="relative">
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)} 
                className="appearance-none bg-white border border-orange-200 text-orange-900 font-black uppercase text-[11px] px-4 py-2 pr-8 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer shadow-sm hover:border-orange-300 transition-all"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-orange-500 pointer-events-none"></i>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCapture}
            disabled={isCapturing}
            className={`h-11 px-6 rounded-2xl ${isCapturing ? 'bg-slate-100 text-slate-400' : 'bg-orange-600 text-white hover:bg-slate-900'} font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-md`}
          >
            <i className={`fas ${isCapturing ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i> {isCapturing ? 'Capturing...' : 'Capture JPG'}
          </button>
          <div className="flex flex-col items-end px-4 border-r border-slate-100 text-slate-900">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentUser.role}</span>
            <span className="text-sm font-black text-slate-800">{currentUser.name}</span>
          </div>
          {currentUser.role === UserRole.ADMIN && (
             <div className="flex items-center gap-2">
               <button onClick={() => setShowAdminImport(!showAdminImport)} className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all shadow-xl" title="Data Import"><i className="fas fa-file-import"></i></button>
               <button onClick={() => setShowRoleManagement(true)} className="h-11 w-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-xl" title="Role Management"><i className="fas fa-user-shield"></i></button>
             </div>
          )}
          {currentSnapshot && (currentUser.role !== UserRole.SME) && (
             <button onClick={() => setShowHierarchyModal(true)} className="h-11 px-6 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><i className="fas fa-sitemap text-orange-600"></i> Hierarchy</button>
          )}
          <button onClick={handleLogout} className="h-11 w-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"><i className="fas fa-sign-out-alt"></i></button>
        </div>
      </header>

      <main ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-8 space-y-8 bg-[#f8fafc]">
        {showRoleManagement && currentSnapshot && (
          <RoleManagement hierarchy={currentSnapshot.systemData} onClose={() => setShowRoleManagement(false)} onUpdateHierarchy={handleUpdateHierarchy} />
        )}
        {showAdminImport && <AdminImportSection onClose={() => setShowAdminImport(false)} onDataCommit={handleCommitData} />}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {viewHistory.length > 1 && (
              <button onClick={() => { const h = [...viewHistory]; h.pop(); const prev = h[h.length-1]; if (prev) { setViewHistory(h); setSelectedUser(prev); } }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"><i className="fas fa-arrow-left text-slate-600"></i></button>
            )}
            <div>
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">{selectedUser.name}</h2>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.3em]">{selectedUser.role} • {selectedUser.region} • {selectedMonth} {selectedYear}</p>
            </div>
          </div>
          {history.length > 0 && !currentSnapshot && (
            <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-red-600 text-xs font-black uppercase animate-pulse"><i className="fas fa-exclamation-circle mr-2"></i> No data for {selectedMonth} {selectedYear}</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-900">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Range Target Progress</p>
            <h3 className="text-5xl font-black italic mt-2">{rangeMetrics.progress.toFixed(1)}%</h3>
            <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Month Target: ฿{selectedUser.rev.target?.toLocaleString()}</div>
          </div>
          <StatCard title="Consignment" value={rangeMetrics.con.toLocaleString()} unit="Items" metric={{actual: rangeMetrics.con, progress: 0}} colorClass="bg-orange-500" icon="fas fa-box" />
          <StatCard title="Revenue" value={`฿${rangeMetrics.rev.toLocaleString()}`} unit="THB" metric={{actual: rangeMetrics.rev, progress: rangeMetrics.progress, target: selectedUser.rev.target}} colorClass="bg-indigo-600" icon="fas fa-coins" />
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between group">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Send Rate</p>
            <h3 className="text-4xl font-black text-slate-900 italic mt-2 group-hover:text-orange-600 transition-colors">
              {selectedUser.customers.totalSenders ? ((filteredCustomers.filter(c => c.con > 0).length/selectedUser.customers.totalSenders)*100).toFixed(1) : 0}%
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredCustomers.filter(c => c.con > 0).length} / {selectedUser.customers.totalSenders} Range Active</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-slate-900">
                 <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Performance Trend</h3>
                   <p className="text-[10px] font-bold text-orange-600 uppercase mt-0.5 tracking-widest">Daily Sourcing Intelligence</p>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-slate-400">Range:</span>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" min="1" max="31" 
                           value={dayRange.start} 
                           onChange={(e) => setDayRange(prev => ({ ...prev, start: Math.min(Math.max(1, parseInt(e.target.value) || 1), prev.end) }))}
                           className="w-12 px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-orange-600 text-center focus:ring-2 focus:ring-orange-500 outline-none" 
                         />
                         <span className="text-slate-300 font-bold text-[10px]">TO</span>
                         <input 
                           type="number" min="1" max="31" 
                           value={dayRange.end} 
                           onChange={(e) => setDayRange(prev => ({ ...prev, end: Math.max(Math.min(31, parseInt(e.target.value) || 31), prev.start) }))}
                           className="w-12 px-1 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-orange-600 text-center focus:ring-2 focus:ring-orange-500 outline-none" 
                         />
                      </div>
                      {(dayRange.start !== 1 || dayRange.end !== 31) && (
                        <button onClick={() => setDayRange({ start: 1, end: 31 })} className="text-[10px] text-slate-400 hover:text-orange-600 ml-1"><i className="fas fa-undo"></i></button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div><span className="text-[9px] font-black uppercase text-slate-400">Rev</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div><span className="text-[9px] font-black uppercase text-slate-400">Con</span></div>
                    </div>
                 </div>
               </div>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aggregatedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontStyle: 'italic', fontWeight: 'bold'}} />
                      <YAxis tickFormatter={formatCompactNumber} axisLine={false} tickLine={false} fontSize={10} fontStyle="italic" />
                      <Tooltip 
                        formatter={(value: any, name: string) => [name === 'rev' ? `฿${Number(value).toLocaleString()}` : Number(value).toLocaleString(), name === 'rev' ? 'Revenue' : 'Consignment']}
                        labelFormatter={(label) => `Day ${label}`}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }} 
                      />
                      <Area type="monotone" dataKey="rev" stroke="#f97316" fill="#f9731610" strokeWidth={4} />
                      <Area type="monotone" dataKey="con" stroke="#6366f1" fill="#6366f110" strokeWidth={3} />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
            <CustomerTable 
              customers={filteredCustomers} 
              onSelectCustomer={(c) => setSelectedInsightCustomer(c)}
              activeRange={`Days ${dayRange.start} - ${dayRange.end}`}
            />
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center text-amber-900">
                  <h3 className="text-[10px] font-black uppercase text-amber-800 tracking-widest flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i> Efficiency Monitor
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowFullLowEff(true)} className="text-[9px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full uppercase hover:bg-amber-300">View All</button>
                    <button onClick={() => handleExportList(allLowEffCustomers, `KEX_LowEff_${selectedMonth}`)} className="text-[9px] font-black text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full uppercase hover:bg-amber-300"><i className="fas fa-download"></i></button>
                  </div>
                </div>
                <div className="divide-y divide-amber-50 text-slate-900">
                  {lowEfficiencyCustomersPreview.length > 0 ? (
                    lowEfficiencyCustomersPreview.map(c => (
                      <div key={c.code} className="p-4 flex justify-between items-center hover:bg-amber-50/50 transition-all group">
                        <div className="min-w-0 text-slate-900">
                          <p className="text-[11px] font-black uppercase text-slate-800 truncate group-hover:text-amber-600 transition-colors">{c.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase italic truncate">{c.code} • {c.mobile || 'No Mobile'}</p>
                          <p className="text-[9px] text-amber-600 font-black uppercase tracking-tighter mt-0.5">YPC: {(c.con > 0 ? c.revenue / c.con : 0).toFixed(1)} • YPW: {(c.weight > 0 ? c.revenue / c.weight : 0).toFixed(1)}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-[11px] font-black text-slate-900">฿{formatCompactNumber(c.revenue)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yield levels healthy</p></div>
                  )}
                </div>
            </div>

            <YieldCard yields={rangeMetrics.yields} />
            
            {selectedUser.subordinates && selectedUser.subordinates.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-slate-900">
                  <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Team Range Power</h3>
                  <i className="fas fa-sort-amount-down text-slate-400"></i>
                </div>
                <div className="divide-y divide-slate-50 text-slate-900">
                  {selectedUser.subordinates.map(sub => {
                    const subFilteredCustomers = filteredCustomers.filter(c => (sub.role === UserRole.SME && c.smeId === sub.id) || (sub.role === UserRole.RSM && c.rsmId === sub.id) || (sub.role === UserRole.SR_RSM && c.srsmId === sub.id));
                    const rangeRev = subFilteredCustomers.reduce((acc, c) => acc + c.revenue, 0);
                    const rangeProgress = sub.rev.target ? (rangeRev / sub.rev.target) * 100 : 0;
                    return (
                      <div key={sub.id} onClick={() => { setSelectedUser(sub); setViewHistory([...viewHistory, sub]); }} className="p-4 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-all group">
                        <div className="min-w-0 text-slate-900">
                          <p className="text-[11px] font-black uppercase text-slate-800 group-hover:text-orange-600 truncate">{sub.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase truncate italic">{sub.id}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-[11px] font-black text-slate-900">฿{formatCompactNumber(rangeRev)}</p>
                          <div className="text-[8px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase">{rangeProgress.toFixed(0)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;