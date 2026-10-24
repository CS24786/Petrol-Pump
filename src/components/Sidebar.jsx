import React from 'react';
import {
  LayoutDashboard,
  Gauge,
  Truck,
  Users,
  Fuel,
  Building2,
  BookOpen,
  UserCheck,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    category: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Station Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    category: 'SALES',
    items: [
      { id: 'meter-daily-sales', label: 'Meter & Daily Sales', icon: Gauge },
      { id: 'company-sales', label: 'Company Sales (Trucks)', icon: Truck },
      { id: 'customer-ledgers', label: 'Customer Ledgers / Khata', icon: Users }
    ]
  },
  {
    category: 'INVENTORY',
    items: [
      { id: 'fuel-stock', label: 'Fuel Stock & Tanks', icon: Fuel },
      { id: 'suppliers-purchases', label: 'Suppliers & Purchases', icon: Building2 }
    ]
  },
  {
    category: 'FINANCE & STAFF',
    items: [
      { id: 'cashbook-expenses', label: 'Cashbook & Roznamcha', icon: BookOpen },
      { id: 'employees', label: 'Employees & Wages', icon: UserCheck }
    ]
  },
  {
    category: 'SYSTEM & AUDIT',
    items: [
      { id: 'reports', label: 'Sales Reports & Audit', icon: BarChart3 },
      { id: 'settings-users', label: 'Settings & Users', icon: Settings }
    ]
  }
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  // Helper to determine if a nav item is active based on exact ID or legacy aliases
  const isItemActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'meter-daily-sales' && (activeTab === 'daily-sales' || activeTab === 'sales' || activeTab === 'meter-readings')) return true;
    if (itemId === 'company-sales' && (activeTab === 'truck-challans' || activeTab === 'fleet-sales')) return true;
    if (itemId === 'customer-ledgers' && (activeTab === 'customers' || activeTab === 'credit-limits' || activeTab === 'summary-challans')) return true;
    if (itemId === 'fuel-stock' && (activeTab === 'stock' || activeTab === 'stock-management' || activeTab === 'tanks')) return true;
    if (itemId === 'suppliers-purchases' && (activeTab === 'suppliers' || activeTab === 'purchases')) return true;
    if (itemId === 'cashbook-expenses' && (activeTab === 'expenses' || activeTab === 'roznamcha-expenses' || activeTab === 'cashbook')) return true;
    if (itemId === 'employees' && (activeTab === 'employees-payments' || activeTab === 'payroll')) return true;
    if (itemId === 'reports' && activeTab === 'sales-reports') return true;
    if (itemId === 'settings-users' && (activeTab === 'settings' || activeTab === 'settings-backup' || activeTab === 'users' || activeTab === 'users-access')) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-[#0c1527] flex flex-col shrink-0 select-none no-print relative overflow-hidden text-slate-300 z-30 border-r border-slate-800/60">

      {/* Top Brand: Logo & Diyal Filling Station */}
      <div className="px-5 py-5 border-b border-slate-800/80 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="Diyal Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-wider text-white">
              DIYAL
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5 text-[#C32026]">
              FILLING STATION
            </span>
          </div>
        </div>
      </div>

      {/* Categorized Navigation Menu Items (Styled matching the reference screenshot) */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-slate-700">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.category} className="space-y-1">
            {/* Category Header Label */}
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
              {sec.category}
            </div>

            {/* Category Items */}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${isActive
                      ? 'bg-[#152544] border border-blue-500/30 text-white font-bold shadow-md shadow-blue-950/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${isActive
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                        : 'bg-blue-950/80 text-blue-400 border border-blue-800/40'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Subtle Watermark Emblem */}
      <div className="absolute -bottom-6 -left-6 pointer-events-none opacity-5">
        <img
          src="/logo.png"
          alt=""
          className="w-36 h-48 object-contain filter grayscale invert"
        />
      </div>

      {/* Bottom Logout Button (Identical to reference screenshot) */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0A1322] relative z-10">
        <button
          onClick={onLogout}
          className="w-full py-2.5 px-4 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/35 active:bg-red-900/50 text-red-400 hover:text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}
