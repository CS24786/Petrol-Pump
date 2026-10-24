import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  UserCheck, 
  Users, 
  PlusCircle, 
  Shield, 
  User, 
  Phone, 
  Key, 
  Check, 
  X, 
  Trash2, 
  Lock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { hashPassword } from '../utils/auth';

export default function EmployeesUsers() {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'users'
  
  // Staff modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Pump Attendant');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSalary, setStaffSalary] = useState('');

  // User account modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState('Cashier');
  const [password, setPassword] = useState('');
  const [userError, setUserError] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Queries
  const employees = useLiveQuery(() => db.employees.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);

  // Staff Handlers
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    await db.employees.add({
      name: staffName.trim(),
      role: staffRole,
      phone: staffPhone.trim(),
      salary: parseFloat(staffSalary) || 0,
      status: 'Active',
      createdAt: new Date().toISOString()
    });

    setStaffName('');
    setStaffPhone('');
    setStaffSalary('');
    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff record?')) {
      await db.employees.delete(id);
    }
  };

  // User Account Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');

    if (!username.trim() || !password) {
      setUserError('Username and password are required.');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const existing = await db.users.where('username').equalsIgnoreCase(cleanUser).first();
    if (existing) {
      setUserError('A user account with this username already exists.');
      return;
    }

    const passwordHash = await hashPassword(password);
    await db.users.add({
      username: cleanUser,
      passwordHash,
      name: fullName.trim() || cleanUser,
      role: userRole,
      status: 'Active',
      createdAt: new Date().toISOString()
    });

    setUsername('');
    setFullName('');
    setPassword('');
    setIsUserModalOpen(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword) return;

    const passwordHash = await hashPassword(newPassword);
    await db.users.update(resetTargetUser.id, { passwordHash });

    setResetTargetUser(null);
    setNewPassword('');
    alert(`Password for @${resetTargetUser.username} updated successfully!`);
  };

  const handleToggleUserStatus = async (user) => {
    if (user.username === 'admin') {
      alert('The root administrator account cannot be deactivated.');
      return;
    }
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await db.users.update(user.id, { status: nextStatus });
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Employees &amp; System User Accounts
          </h2>
          <p className="text-xs text-slate-500">
            Manage pump attendants, cashiers, operators, and offline password-secured login accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pump Attendants &amp; Staff</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>System Login Users</span>
            </button>
          </div>

          {activeTab === 'employees' ? (
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setUserError('');
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add User Account</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EMPLOYEES & STAFF */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {employees?.map(emp => (
            <div key={emp.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    emp.role === 'Admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : emp.role === 'Cashier'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {emp.role}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-3">{emp.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{emp.phone || 'No phone recorded'}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Monthly Salary</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(emp.salary)}</span>
                </div>
                <button
                  onClick={() => handleDeleteStaff(emp.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Remove Staff"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SYSTEM LOGIN USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Configured Login User Accounts</h3>
            <p className="text-xs text-slate-500">Offline credentials stored locally using SHA-256 cryptographic hashing</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">System Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users?.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">@{u.username}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {u.createdAt ? u.createdAt.slice(0, 10) : 'System default'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setNewPassword('');
                            setResetTargetUser(u);
                          }}
                          className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-blue-600" />
                          <span>Change Password</span>
                        </button>

                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="text-slate-500 hover:text-slate-900 text-[11px] font-medium underline"
                          >
                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Add Staff Member</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Muhammad Aslam"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Role</label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Pump Attendant">Pump Attendant</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Station Manager">Station Manager</option>
                    <option value="Admin">Administrator</option>
                    <option value="Security / Night Guard">Security / Night Guard</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="+92 300 xxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                <input
                  type="number"
                  value={staffSalary}
                  onChange={e => setStaffSalary(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Account Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Create System Login Account</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {userError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. operator1"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tariq Mehmood"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Change Password: @{resetTargetUser.username}</h3>
              <button onClick={() => setResetTargetUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Security Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
