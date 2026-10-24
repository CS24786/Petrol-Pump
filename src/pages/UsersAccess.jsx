import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  ShieldCheck, 
  UserPlus, 
  Key, 
  Lock, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  History,
  Shield,
  Search
} from 'lucide-react';
import { hashPassword } from '../utils/auth';
import { formatDateDisplay } from '../utils/formatters';

export default function UsersAccess() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('Cashier');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password reset state
  const [resetPass, setResetPass] = useState('');

  // Queries
  const users = useLiveQuery(() => db.users.toArray(), []);
  const auditLogs = useLiveQuery(() => db.auditLogs?.orderBy('id').reverse().toArray() || [], []);

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newUsername.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    // Check duplicate
    const exists = users?.find(u => u.username?.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) {
      setErrorMsg('Username already exists.');
      return;
    }

    const hashed = await hashPassword(newPassword);

    await db.users.add({
      username: newUsername.trim().toLowerCase(),
      name: newFullName.trim() || newUsername.trim(),
      role: newRole,
      passwordHash: hashed,
      status: 'Active',
      createdAt: new Date().toISOString()
    });

    // Audit log
    await db.auditLogs?.add({
      date: new Date().toISOString().split('T')[0],
      entityType: 'UserAccount',
      entityId: 0,
      action: 'UserCreated',
      performedBy: 'admin',
      details: `Created new user account @${newUsername} with role ${newRole}`,
      createdAt: new Date().toISOString()
    });

    setNewUsername('');
    setNewFullName('');
    setNewPassword('');
    setConfirmPassword('');
    setIsCreateModalOpen(false);
  };

  // Toggle user active status
  const handleToggleStatus = async (user) => {
    if (user.username === 'admin') {
      alert('The primary admin account cannot be disabled.');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    await db.users.update(user.id, { status: nextStatus });
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPass || resetPass.length < 4) {
      alert('Password must be at least 4 characters.');
      return;
    }

    const hashed = await hashPassword(resetPass);
    await db.users.update(resetTargetUser.id, { passwordHash: hashed });

    await db.auditLogs?.add({
      date: new Date().toISOString().split('T')[0],
      entityType: 'UserAccount',
      entityId: resetTargetUser.id,
      action: 'PasswordReset',
      performedBy: 'admin',
      details: `Reset password for user @${resetTargetUser.username}`,
      createdAt: new Date().toISOString()
    });

    setResetTargetUser(null);
    setResetPass('');
    alert(`Password reset successfully for @${resetTargetUser.username}!`);
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (user.username === 'admin') {
      alert('Primary admin account cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user @${user.username}?`)) {
      await db.users.delete(user.id);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Users & Access Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage local operator credentials, role permissions, and view audit trail for sensitive overrides
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'users' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              User Accounts
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'audit' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Audit Trail ({auditLogs?.length || 0})
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>New User</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Registered System Operators & Administrators
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              SHA-256 Offline Password Protection
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users?.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">@{u.username}</td>
                    <td className="py-3 px-4 text-slate-700">{u.name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'Admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : u.role === 'Manager'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.username === 'admin'}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          u.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {u.status || 'Active'}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDateDisplay(u.createdAt)}</td>
                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setResetTargetUser(u)}
                          title="Reset Password"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-amber-600" />
                          <span>Reset Key</span>
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 2: AUDIT TRAIL TABLE */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Security & Operational Audit Log</span>
            </h3>
            <span className="text-xs text-slate-500">
              Immutable local log of credit limit overrides, challan cancellations, and reading corrections
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Authorized Reason</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-600">{log.date}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">@{log.performedBy || 'admin'}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{log.entityType}</td>
                      <td className="py-2.5 px-4 font-sans text-rose-700 font-medium">{log.reason || '-'}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600 max-w-sm truncate">{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Create New System Operator</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="e.g. cashier1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Naveed Akhtar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Permissions</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Cashier">Cashier (Daily sales & challans)</option>
                  <option value="Manager">Manager (Reports, ledgers & overrides)</option>
                  <option value="Admin">Administrator (Full System Access)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span>Reset Password for @{resetTargetUser.username}</span>
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={resetPass}
                  onChange={e => setResetPass(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
