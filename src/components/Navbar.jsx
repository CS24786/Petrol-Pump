import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Menu,
  Bell,
  PlusCircle, 
  Clock,
  Calendar,
  LogOut,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import DiyalLogo from './DiyalLogo';

export default function Navbar({ onOpenQuickSale, activeTab, currentUser, onLogout, onToggleSidebar }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Live query for fuel rates
  const fuelRates = useLiveQuery(() => db.fuelRates?.toArray() || [], []);
  
  // Live query for settings
  const pumpNameSetting = useLiveQuery(() => db.settings?.get('pumpName'), []);
  const pumpName = pumpNameSetting?.value || 'DIYAL FILLING STATION';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dieselRate = fuelRates?.find(r => r.fuelType === 'Diesel')?.rate || 397.45;
  const petrolRate = fuelRates?.find(r => r.fuelType === 'Petrol')?.rate || 400.66;

  // Get user initials e.g. "HN" or "AD"
  const userInitials = (currentUser?.name || 'Habib Nawaz')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 px-4 sm:px-6 py-2.5 select-none no-print shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Hamburger Menu + Logo as in template */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <DiyalLogo size="default" />
        </div>

        {/* Center: Live Fuel Rates Ticker */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 pr-3 border-r border-slate-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500 font-sans font-medium text-[11px]">Diesel (HSD):</span>
            <span className="text-amber-700 font-bold">Rs {dieselRate.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500 font-sans font-medium text-[11px]">Petrol (PMG):</span>
            <span className="text-emerald-700 font-bold">Rs {petrolRate.toFixed(2)}</span>
          </div>
        </div>

        {/* Right: Quick Dispense, Notifications & User Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Quick Dispense Button */}
          <button
            onClick={onOpenQuickSale}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C32026] hover:bg-[#a81a1f] text-white font-medium text-xs shadow-xs transition-all duration-150 cursor-pointer"
            title="Press F2 or click for Quick Fuel Sale Entry"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Sale</span>
            <span className="text-[10px] bg-red-900/40 px-1 py-0.2 rounded font-mono">F2</span>
          </button>

          {/* Bell Notification Icon with red unread dot */}
          <div className="relative cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#C32026] rounded-full ring-2 ring-white"></span>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              {/* Circular Avatar HN as shown in template */}
              <div className="w-8 h-8 rounded-full bg-[#0F1B2F] text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                {userInitials}
              </div>
            </button>

            {/* Dropdown Card */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.name || 'Habib Nawaz'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">@{currentUser?.username || 'admin'} &bull; {currentUser?.role || 'Station Manager'}</p>
                </div>

                <div className="px-1 py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
