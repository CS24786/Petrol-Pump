import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { UserCheck, PlusCircle, Shield, User, Phone, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Employees() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Pump Attendant');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');

  const employees = useLiveQuery(() => db.employees.toArray(), []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await db.employees.add({
      name: name.trim(),
      role,
      phone: phone.trim(),
      salary: parseFloat(salary) || 0,
      status: 'Active'
    });

    setName('');
    setPhone('');
    setSalary('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              Staff & Operators
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Pump Attendants & Staff Records</h2>
          <p className="text-xs text-slate-400">
            Manage pump operators, cashiers, attendants, shift rosters, and role permissions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white text-xs font-bold shadow-glow-brand transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {employees?.map(emp => (
          <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  emp.role === 'Admin'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : emp.role === 'Cashier'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {emp.role}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-3">{emp.name}</h4>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{emp.phone || 'No phone recorded'}</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Monthly Salary:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(emp.salary)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add New Staff Member</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role / Designation</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Pump Attendant">Pump Attendant</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin / Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Monthly Salary (PKR)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="35000"
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
