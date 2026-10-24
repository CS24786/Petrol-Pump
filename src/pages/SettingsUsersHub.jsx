import React, { useState } from 'react';
import { Settings, Users, ShieldCheck, Download, Database, Key, CheckCircle2 } from 'lucide-react';
import SettingsBackup from './SettingsBackup';
import UsersAccess from './UsersAccess';

export default function SettingsUsersHub() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'users' | 'backup'

  return (
    <div className="space-y-5">
      {/* 1. TOP PANORAMIC BANNER */}
      <div 
        className="w-full h-44 rounded-2xl relative overflow-hidden bg-cover bg-center shadow-sm flex items-center justify-between px-8 no-print"
        style={{ backgroundImage: "url('/dashboard_background.jpg')" }}
      >
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2F]/95 via-[#0F1B2F]/80 to-transparent pointer-events-none"></div>

        {/* Banner Left Info */}
        <div className="relative z-10 text-white max-w-xl flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-white/20">
            <img
              src="/logo.jpg"
              alt="Diyal Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <div>
            <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide block">
              Diyal Filling Station &bull; Module 10
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white mt-0.5">
              Settings &amp; User Management
            </h1>
            <p className="text-white/75 text-xs mt-1">
              Station business profile, fuel rates, administrator access, roles &amp; offline data backups
            </p>
          </div>
        </div>

        {/* Banner Right Quick Status */}
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Single Admin Mode Active</span>
        </div>
      </div>

      {/* 2. SUB-MODULE TABS HEADER */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Station Profile &amp; Fuel Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>User Accounts &amp; Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Backup &amp; Disaster Recovery</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
          {activeTab === 'settings' && 'Update station name, address, NTN & fuel dispensing rates'}
          {activeTab === 'users' && 'Manage cashiers, change passwords & review audit logs'}
          {activeTab === 'backup' && 'Download JSON database backup & restore safely'}
        </div>
      </div>

      {/* Render Active Sub-Page */}
      {activeTab === 'settings' && <SettingsBackup defaultSection="profile" />}
      {activeTab === 'users' && <UsersAccess />}
      {activeTab === 'backup' && <SettingsBackup defaultSection="backup" />}
    </div>
  );
}
