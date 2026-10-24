import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { seedInitialData } from './db/seedData';
import { getSessionUser, clearSessionUser } from './utils/auth';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QuickSaleModal from './components/QuickSaleModal';
import ReceiptModal from './components/ReceiptModal';
import LedgerPaymentModal from './components/LedgerPaymentModal';
import ErrorBoundary from './components/ErrorBoundary';

// Pages - 10 Core Modules & Hubs
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MeterDailySales from './pages/MeterDailySales';
import CompanySales from './pages/CompanySales';
import CustomerLedgersHub from './pages/CustomerLedgersHub';
import StockManagement from './pages/StockManagement';
import SuppliersPurchasesHub from './pages/SuppliersPurchasesHub';
import RoznamchaExpenses from './pages/RoznamchaExpenses';
import EmployeesPayments from './pages/EmployeesPayments';
import Reports from './pages/Reports';
import SettingsUsersHub from './pages/SettingsUsersHub';

// Direct subpages kept for backward-compatible deep links
import MeterReadings from './pages/MeterReadings';
import DailySales from './pages/DailySales';
import TruckChallans from './pages/TruckChallans';
import CompanySummaryChallans from './pages/CompanySummaryChallans';
import CustomersLedger from './pages/CustomersLedger';
import CreditLimits from './pages/CreditLimits';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import SettingsBackup from './pages/SettingsBackup';
import UsersAccess from './pages/UsersAccess';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [saleForReceipt, setSaleForReceipt] = useState(null);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Settings
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);
  const pumpSettings = React.useMemo(() => {
    if (!settingsList) return {};
    const map = {};
    settingsList.forEach(s => {
      map[s.key] = s.value;
    });
    return map;
  }, [settingsList]);

  // Initial database check & seed data loading
  useEffect(() => {
    async function init() {
      try {
        await seedInitialData(false);
      } catch (err) {
        console.error('Seed data error:', err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Global F2 shortcut for quick sale
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsQuickSaleOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaleSaved = (newSale, shouldPrint) => {
    if (shouldPrint) {
      setSaleForReceipt(newSale);
    }
  };

  const handleLogout = () => {
    clearSessionUser();
    setCurrentUser(null);
  };

  // Protected route check: If not logged in, render Login page
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      // 1. Dashboard
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setActiveTab}
            onOpenQuickSale={() => setIsQuickSaleOpen(true)}
            onOpenReceipt={setSaleForReceipt}
            onOpenPaymentModal={setPaymentCustomer}
          />
        );

      // 2. Meter & Daily Sales (Directly Record Meter & Daily Readings)
      case 'meter-daily-sales':
      case 'daily-sales':
      case 'sales':
      case 'meter-readings':
        return (
          <MeterReadings
            onNavigate={setActiveTab}
            onOpenQuickSale={() => setIsQuickSaleOpen(true)}
            onOpenReceipt={setSaleForReceipt}
          />
        );

      // 3. Company Sales (Hub: Truck Challans, 3-Copy Print, History, Fleet Details)
      case 'company-sales':
      case 'truck-challans':
      case 'fleet-sales':
        return (
          <CompanySales
            onOpenPaymentModal={setPaymentCustomer}
            onOpenReceipt={setSaleForReceipt}
          />
        );

      // 4. Customer Ledgers (Hub: Accounts & Ledgers, Credit Limits, Summary Challans)
      case 'customer-ledgers':
      case 'customers':
      case 'credit-limits':
      case 'summary-challans':
        return (
          <CustomerLedgersHub
            onOpenPaymentModal={setPaymentCustomer}
            onOpenReceipt={setSaleForReceipt}
          />
        );

      // 5. Fuel Stock & Tanks (Hub: Tanks & Dips, Stock Movement Sheets, Calibration Adjustments)
      case 'fuel-stock':
      case 'stock-management':
      case 'stock':
      case 'tanks':
        return <StockManagement />;

      // 6. Suppliers & Purchases (Hub: Fuel Purchases & Tankers, Supplier Accounts & Payables)
      case 'suppliers-purchases':
      case 'suppliers':
      case 'purchases':
        return <SuppliersPurchasesHub />;

      // 7. Cashbook & Expenses (Hub: Daily Roznamcha Cashbook & Operating Expenses Register)
      case 'cashbook-expenses':
      case 'roznamcha-expenses':
      case 'expenses':
      case 'cashbook':
        return <RoznamchaExpenses />;

      // 8. Employees (Hub: Staff Directory, 24/7 Roster, Salary & Advance Payments)
      case 'employees':
      case 'employees-payments':
      case 'payroll':
        return <EmployeesPayments />;

      // 9. Sales Reports (Hub: Comprehensive Sales, Reconciliation, Ledgers, Stock & Roznamcha Reports)
      case 'reports':
      case 'sales-reports':
        return <Reports />;

      // 10. Settings & Users (Hub: Station Settings & Fuel Rates, Users & Roles, Backup & Disaster Recovery)
      case 'settings-users':
      case 'settings':
      case 'settings-backup':
      case 'users':
      case 'users-access':
        return <SettingsUsersHub />;

      default:
        return (
          <Dashboard
            onNavigate={setActiveTab}
            onOpenQuickSale={() => setIsQuickSaleOpen(true)}
            onOpenReceipt={setSaleForReceipt}
            onOpenPaymentModal={setPaymentCustomer}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans select-none">
      
      {/* Full-Height Left Sidebar */}
      {sidebarOpen && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
      )}

      {/* Right Column: Navbar on Top + Scrollable Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
          activeTab={activeTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
              {renderActivePage()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSaleSaved={handleSaleSaved}
      />

      {saleForReceipt && (
        <ReceiptModal
          sale={saleForReceipt}
          pumpSettings={pumpSettings}
          onClose={() => setSaleForReceipt(null)}
        />
      )}

      {paymentCustomer && (
        <LedgerPaymentModal
          isOpen={Boolean(paymentCustomer)}
          customer={paymentCustomer}
          onClose={() => setPaymentCustomer(null)}
          onSaved={() => {}}
        />
      )}

    </div>
  );
}
