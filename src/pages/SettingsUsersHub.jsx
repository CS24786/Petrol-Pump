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
        style={{ backgroundImage: "url('./dashboard_background.jpg')" }}
      >
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2F]/95 via-[#0F1B2F]/80 to-transparent pointer-events-none"></div>

        {/* Banner Left Info */}
        <div className="relative z-10 text-white max-w-xl flex items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Settings &amp; User Management
            </h1>
            <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
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
            <span>Station Profile &amp; System Settings</span>
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
        </div>

        <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
          {activeTab === 'settings' && 'Station identity, fuel rates, GitHub auto-updates & database backups'}
          {activeTab === 'users' && 'Manage cashier logins, credentials & system activity logs'}
        </div>
      </div>

      {/* Render Active Sub-Page */}
      {activeTab === 'settings' && <SettingsBackup />}
      {activeTab === 'users' && <UsersAccess />}
    </div>
  );
}
