import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  UserCheck, 
  Users, 
  PlusCircle, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Download, 
  Printer, 
  Search, 
  Edit3, 
  Trash2, 
  X,
  Banknote,
  FileDown,
  Coins,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import { exportReportToPDF } from '../utils/pdfExport';
import Pagination from '../components/Pagination';

export const STAFF_ROLES = [
  'Pump Attendant',
  'Cashier',
  'Supervisor',
  'Admin / Manager',
  'Security Guard',
  'Electrician / Maintenance'
];

export default function EmployeesPayments() {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'payments'
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Pagination states
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [payPage, setPayPage] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New / Edit Employee Form State
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState(STAFF_ROLES[0]);
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empCnic, setEmpCnic] = useState('');
  const [empShift, setEmpShift] = useState('Morning');
  const [empStatus, setEmpStatus] = useState('Active');

  // Salary Disbursement Form State
  const [salaryEmpId, setSalaryEmpId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(selectedMonth);
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [salaryBaseAmount, setSalaryBaseAmount] = useState('0');
  const [salaryAdvanceDeduction, setSalaryAdvanceDeduction] = useState('0');
  const [salaryBonusAmount, setSalaryBonusAmount] = useState('0');
  const [salaryNetPay, setSalaryNetPay] = useState('0');
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState('Cash');
  const [salaryVoucherNo, setSalaryVoucherNo] = useState(`SAL-${Date.now().toString().slice(-5)}`);
  const [salaryNotes, setSalaryNotes] = useState('');
  const [salaryError, setSalaryError] = useState('');

  // Advance Salary Form State
  const [advEmpId, setAdvEmpId] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advAmount, setAdvAmount] = useState('');
  const [advPaymentMethod, setAdvPaymentMethod] = useState('Cash');
  const [advReason, setAdvReason] = useState('Emergency personal advance');
  const [advVoucherNo, setAdvVoucherNo] = useState(`ADV-${Date.now().toString().slice(-5)}`);
  const [advRepaymentMonth, setAdvRepaymentMonth] = useState(selectedMonth);
  const [advNotes, setAdvNotes] = useState('');
  const [advError, setAdvError] = useState('');

  // Database Queries
  const employees = useLiveQuery(() => db.employees.toArray(), []);
  const employeePayments = useLiveQuery(() => db.employeePayments?.orderBy('date').reverse().toArray() || [], []);
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Chak Jhumra, FSD.';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // -------------------------------------------------------------------------
  // DETAILED PAYROLL & ADVANCE CALCULATIONS PER EMPLOYEE
  // -------------------------------------------------------------------------
  const employeeRecords = useMemo(() => {
    if (!employees) return [];

    return employees.map(emp => {
      const empId = Number(emp.id);
      const allPayments = (employeePayments || []).filter(p => Number(p.employeeId) === empId);

      // Advances taken (Type === 'Advance')
      const totalAdvancesTaken = allPayments
        .filter(p => p.type === 'Advance')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Advances deducted during salary disbursement
      const totalAdvancesDeducted = allPayments
        .filter(p => p.type === 'Salary')
        .reduce((sum, p) => sum + (Number(p.advanceDeducted) || 0), 0);

      // Outstanding advance balance owed by employee
      const outstandingAdvance = Math.max(0, totalAdvancesTaken - totalAdvancesDeducted);

      // Salary paid for selected month
      const salaryPaidThisMonth = allPayments
        .filter(p => p.type === 'Salary' && (p.month === selectedMonth || p.date?.startsWith(selectedMonth)))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Base monthly salary
      const baseSalary = Number(emp.salary) || 0;

      // Remaining net salary payable for current month
      const netPayableRemaining = Math.max(0, baseSalary - salaryPaidThisMonth);

      return {
        ...emp,
        baseSalary,
        totalAdvancesTaken,
        totalAdvancesDeducted,
        outstandingAdvance,
        salaryPaidThisMonth,
        netPayableRemaining,
        payments: allPayments
      };
    });
  }, [employees, employeePayments, selectedMonth]);

  // Overall Payroll Summary Stats
  const payrollStats = useMemo(() => {
    let totalStaff = employeeRecords.length;
    let totalMonthlyBudget = 0;
    let totalDisbursedThisMonth = 0;
    let totalOutstandingAdvances = 0;
    let totalNetPending = 0;

    employeeRecords.forEach(emp => {
      totalMonthlyBudget += emp.baseSalary;
      totalDisbursedThisMonth += emp.salaryPaidThisMonth;
      totalOutstandingAdvances += emp.outstandingAdvance;
      totalNetPending += emp.netPayableRemaining;
    });

    return {
      totalStaff,
      totalMonthlyBudget,
      totalDisbursedThisMonth,
      totalOutstandingAdvances,
      totalNetPending
    };
  }, [employeeRecords]);

  // Filtered Employees for Staff Directory Tab
  const filteredEmployees = useMemo(() => {
    return employeeRecords.filter(emp => {
      if (roleFilter !== 'All' && emp.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = emp.name?.toLowerCase().includes(q);
        const matchesRole = emp.role?.toLowerCase().includes(q);
        const matchesPhone = emp.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesPhone) return false;
      }
      return true;
    });
  }, [employeeRecords, roleFilter, searchQuery]);

  // Filtered Payments History
  const filteredPayments = useMemo(() => {
    if (!employeePayments) return [];
    return employeePayments.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesEmp = p.employeeName?.toLowerCase().includes(q);
        const matchesNotes = p.notes?.toLowerCase().includes(q);
        const matchesVoucher = p.voucherNo?.toLowerCase().includes(q);
        if (!matchesEmp && !matchesNotes && !matchesVoucher) return false;
      }
      return true;
    });
  }, [employeePayments, searchQuery]);

  // Paginated Slices
  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empPageSize;
    return filteredEmployees.slice(start, start + empPageSize);
  }, [filteredEmployees, empPage, empPageSize]);

  const paginatedPayments = useMemo(() => {
    const start = (payPage - 1) * payPageSize;
    return filteredPayments.slice(start, start + payPageSize);
  }, [filteredPayments, payPage, payPageSize]);

  // -------------------------------------------------------------------------
  // EMPLOYEE ADD / EDIT HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpRole(STAFF_ROLES[0]);
    setEmpPhone('');
    setEmpSalary('');
    setEmpCnic('');
    setEmpShift('Morning');
    setEmpStatus('Active');
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpRole(emp.role || STAFF_ROLES[0]);
    setEmpPhone(emp.phone || '');
    setEmpSalary(String(emp.salary || ''));
    setEmpCnic(emp.cnic || '');
    setEmpShift(emp.shift || 'Morning');
    setEmpStatus(emp.status || 'Active');
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empName.trim()) return;

    const salaryNum = parseFloat(empSalary) || 0;
    const payload = {
      name: empName.trim(),
      role: empRole,
      phone: empPhone.trim(),
      salary: salaryNum,
      cnic: empCnic.trim(),
      shift: empShift,
      status: empStatus,
      updatedAt: new Date().toISOString()
    };

    if (editingEmployee) {
      await db.employees.update(editingEmployee.id, payload);
    } else {
      payload.createdAt = new Date().toISOString();
      await db.employees.add(payload);
    }

    setIsEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = async (emp) => {
    if (window.confirm(`Are you sure you want to remove ${emp.name} from the staff records?`)) {
      await db.employees.delete(emp.id);
    }
  };

  // -------------------------------------------------------------------------
  // SALARY DISBURSEMENT HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenSalaryModal = (emp = null) => {
    setSalaryError('');
    const targetEmp = emp || employeeRecords[0];
    if (targetEmp) {
      setSalaryEmpId(String(targetEmp.id));
      const base = targetEmp.baseSalary || 0;
      setSalaryBaseAmount(String(base));
      // Auto-suggest advance deduction if employee has outstanding advance
      const advToDeduct = Math.min(targetEmp.outstandingAdvance, base);
      setSalaryAdvanceDeduction(String(advToDeduct));
      setSalaryBonusAmount('0');
      const net = Math.max(0, base - advToDeduct);
      setSalaryNetPay(String(net));
      setSalaryNotes(`Monthly salary disbursement for ${targetEmp.name} - ${salaryMonth}`);
    }
    setSalaryMonth(selectedMonth);
    setSalaryDate(new Date().toISOString().split('T')[0]);
    setSalaryPaymentMethod('Cash');
    setSalaryVoucherNo(`SAL-${Date.now().toString().slice(-5)}`);
    setIsSalaryModalOpen(true);
  };

  // When changing employee in salary modal
  const handleSalaryEmpChange = (empId) => {
    setSalaryEmpId(empId);
    const targetEmp = employeeRecords.find(e => e.id === Number(empId));
    if (targetEmp) {
      const base = targetEmp.baseSalary || 0;
      setSalaryBaseAmount(String(base));
      const advToDeduct = Math.min(targetEmp.outstandingAdvance, base);
      setSalaryAdvanceDeduction(String(advToDeduct));
      setSalaryBonusAmount('0');
      const net = Math.max(0, base - advToDeduct);
      setSalaryNetPay(String(net));
      setSalaryNotes(`Monthly salary disbursement for ${targetEmp.name} - ${salaryMonth}`);
    }
  };

  // Calculate net pay whenever base, deduction, or bonus changes
  const updateSalaryCalculations = (baseStr, deductStr, bonusStr) => {
    const base = parseFloat(baseStr) || 0;
    const deduct = parseFloat(deductStr) || 0;
    const bonus = parseFloat(bonusStr) || 0;
    const net = Math.max(0, base - deduct + bonus);
    setSalaryNetPay(String(net));
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    setSalaryError('');

    const netAmount = parseFloat(salaryNetPay);
    if (isNaN(netAmount) || netAmount <= 0) {
      setSalaryError('Net payable salary must be greater than zero.');
      return;
    }

    const matchedEmp = employeeRecords.find(emp => emp.id === Number(salaryEmpId));
    const empNameStr = matchedEmp?.name || 'Staff Member';

    // 1. Record in employeePayments table
    const paymentRecord = {
      employeeId: Number(salaryEmpId),
      employeeName: empNameStr,
      employeeRole: matchedEmp?.role || 'Staff',
      date: salaryDate,
      month: salaryMonth,
      type: 'Salary',
      baseSalary: parseFloat(salaryBaseAmount) || 0,
      advanceDeducted: parseFloat(salaryAdvanceDeduction) || 0,
      bonusAmount: parseFloat(salaryBonusAmount) || 0,
      amount: netAmount,
      paymentMethod: salaryPaymentMethod,
      voucherNo: salaryVoucherNo.trim() || `SAL-${Date.now().toString().slice(-5)}`,
      notes: salaryNotes.trim(),
      createdAt: new Date().toISOString()
    };

    await db.employeePayments.add(paymentRecord);

    // 2. Automatically link to Expenses / Roznamcha under 'Employee Payments'
    await db.expenses.add({
      date: salaryDate,
      time: new Date().toTimeString().slice(0, 5),
      refNo: paymentRecord.voucherNo,
      type: 'Expense',
      category: 'Employee Payments',
      amount: netAmount,
      paymentMethod: salaryPaymentMethod,
      paidTo: empNameStr,
      description: `Monthly Salary (${salaryMonth}) paid to ${empNameStr} (${matchedEmp?.role || 'Staff'})${paymentRecord.advanceDeducted > 0 ? ` [Rs ${formatNumber(paymentRecord.advanceDeducted, 0)} Advance Adjusted]` : ''}`,
      notes: salaryNotes.trim(),
      createdAt: new Date().toISOString()
    });

    setIsSalaryModalOpen(false);
  };

  // -------------------------------------------------------------------------
  // ADVANCE SALARY (PESHGI) HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAdvanceModal = (emp = null) => {
    setAdvError('');
    const targetEmp = emp || employeeRecords[0];
    if (targetEmp) {
      setAdvEmpId(String(targetEmp.id));
      setAdvNotes(`Salary advance issued to ${targetEmp.name} (Repayable: ${selectedMonth})`);
    }
    setAdvDate(new Date().toISOString().split('T')[0]);
    setAdvAmount('');
    setAdvPaymentMethod('Cash');
    setAdvReason('Emergency personal advance');
    setAdvVoucherNo(`ADV-${Date.now().toString().slice(-5)}`);
    setAdvRepaymentMonth(selectedMonth);
    setIsAdvanceModalOpen(true);
  };

  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    setAdvError('');

    const amt = parseFloat(advAmount);
    if (isNaN(amt) || amt <= 0) {
      setAdvError('Please enter a valid advance amount.');
      return;
    }

    const matchedEmp = employeeRecords.find(emp => emp.id === Number(advEmpId));
    const empNameStr = matchedEmp?.name || 'Staff Member';

    // 1. Record in employeePayments table as Advance
    const advanceRecord = {
      employeeId: Number(advEmpId),
      employeeName: empNameStr,
      employeeRole: matchedEmp?.role || 'Staff',
      date: advDate,
      month: advRepaymentMonth,
      type: 'Advance',
      amount: amt,
      paymentMethod: advPaymentMethod,
      voucherNo: advVoucherNo.trim() || `ADV-${Date.now().toString().slice(-5)}`,
      reason: advReason.trim(),
      notes: advNotes.trim(),
      createdAt: new Date().toISOString()
    };

    await db.employeePayments.add(advanceRecord);

    // 2. Automatically link to Expenses / Roznamcha under 'Employee Payments'
    await db.expenses.add({
      date: advDate,
      time: new Date().toTimeString().slice(0, 5),
      refNo: advanceRecord.voucherNo,
      type: 'Expense',
      category: 'Employee Payments',
      amount: amt,
      paymentMethod: advPaymentMethod,
      paidTo: empNameStr,
      description: `Staff Advance (Peshgi) issued to ${empNameStr} (${matchedEmp?.role || 'Staff'}) - Reason: ${advReason}`,
      notes: advNotes.trim(),
      createdAt: new Date().toISOString()
    });

    setIsAdvanceModalOpen(false);
  };

  // Delete Payment Record
  const handleDeletePayment = async (p) => {
    if (window.confirm(`Are you sure you want to reverse this ${p.type} payment voucher #${p.voucherNo || p.id}?`)) {
      await db.employeePayments.delete(p.id);
    }
  };

  // Export Staff Directory CSV
  const handleExportStaffCSV = () => {
    const headers = ['Staff Name', 'Role', 'Phone', 'CNIC', 'Shift', 'Monthly Base Salary (PKR)', 'Outstanding Advance (PKR)', 'Salary Paid This Month (PKR)', 'Net Remaining Payable (PKR)', 'Status'];
    const rows = filteredEmployees.map(emp => [
      `"${emp.name}"`,
      `"${emp.role}"`,
      `"${emp.phone || '-'}"`,
      `"${emp.cnic || '-'}"`,
      `"${emp.shift || 'General'}"`,
      emp.baseSalary,
      emp.outstandingAdvance,
      emp.salaryPaidThisMonth,
      emp.netPayableRemaining,
      emp.status
    ]);
    exportToCSV(`Staff_Payroll_Register_${selectedMonth}.csv`, headers, rows);
  };

  // Export Payments Register CSV
  const handleExportPaymentsCSV = () => {
    const headers = ['Date', 'Voucher #', 'Employee Name', 'Role', 'Type', 'Month / Period', 'Base Salary (PKR)', 'Advance Adjusted (PKR)', 'Net Paid (PKR)', 'Payment Mode', 'Notes'];
    const rows = filteredPayments.map(p => [
      p.date,
      p.voucherNo || `VCH-${p.id}`,
      `"${p.employeeName}"`,
      `"${p.employeeRole || '-'}"`,
      p.type,
      p.month || '-',
      p.baseSalary || 0,
      p.advanceDeducted || 0,
      p.amount,
      p.paymentMethod,
      `"${p.notes || ''}"`
    ]);
    exportToCSV(`Salary_Disbursements_${selectedMonth}.csv`, headers, rows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. HERO BANNER WITH REALISTIC BACKGROUND (SCREEN ONLY) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{ backgroundImage: "url('./meter_background.jpg')" }}
      >
        {/* Soft navy gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: UserCheck Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <UserCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Employees &amp; Wage Records
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                24/7 pump attendant roster, monthly salary disbursements, staff advances (peshgi) &amp; Roznamcha sync.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons (Pay Salary, Issue Advance, Add Staff) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Pay Salary Button */}
            <button
              onClick={() => handleOpenSalaryModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Salary</span>
            </button>

            {/* Issue Advance Button */}
            <button
              onClick={() => handleOpenAdvanceModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-950/20 transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Issue Advance</span>
            </button>

            {/* Add Staff Button */}
            <button
              onClick={handleOpenAddEmployee}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C32026] hover:bg-[#a81a1f] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI STAT METRIC CARDS (DIRECTLY UNDER BANNER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        
        {/* Card 1: Active Staff */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Active Station Staff
            </span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5 truncate">
              {payrollStats.totalStaff} Members
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-blue-600 font-bold font-mono">24/7 Operations</span>
              <span className="text-slate-400">&bull; Roster continuous</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Payroll Commitment */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Monthly Payroll Budget
            </span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(payrollStats.totalMonthlyBudget)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-indigo-600 font-bold font-mono">Agreed Wages</span>
              <span className="text-slate-400">&bull; Total liability</span>
            </div>
          </div>
        </div>

        {/* Card 3: Disbursed This Month */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Disbursed This Month
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(payrollStats.totalDisbursedThisMonth)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-emerald-600 font-bold font-mono">Roznamcha Synced</span>
              <span className="text-slate-400">&bull; Paid from drawer</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Advances & Pending */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Outstanding Advances
            </span>
            <div className="text-xl font-black text-amber-700 font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(payrollStats.totalOutstandingAdvances)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-amber-600 font-bold font-mono">Pending:</span>
              <span className="text-slate-700 font-semibold font-mono">{formatCurrency(payrollStats.totalNetPending)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-MODULE TABS HEADER */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Staff Directory &amp; Salary Ledger Table</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {payrollStats.totalStaff}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Salary &amp; Advance Disbursement History</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {employeePayments?.length || 0}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500 font-sans" />
            <span className="text-slate-500 font-sans font-medium">Payroll Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY & SALARY LEDGER TABLE                              */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff name, role, phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Designations</option>
                  {STAFF_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportStaffCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Full Comprehensive Staff Salary Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Station Staff Roster &amp; Monthly Salary Ledger</h3>
                <p className="text-xs text-slate-500">Record of base wages, advances (peshgi), and net disbursements for {selectedMonth}</p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Showing {filteredEmployees.length} of {payrollStats.totalStaff} staff members
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Staff Member</th>
                    <th className="py-3 px-3.5">Designation</th>
                    <th className="py-3 px-3.5">Contact Phone</th>
                    <th className="py-3 px-3.5 text-right">Base Salary</th>
                    <th className="py-3 px-3.5 text-right">Outstanding Advance</th>
                    <th className="py-3 px-3.5 text-right">Paid This Month</th>
                    <th className="py-3 px-3.5 text-right">Net Remaining</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center no-print">Actions &amp; Payouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                        No staff members found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & ID */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{emp.id} &bull; Shift: {emp.shift || 'General'}</div>
                        </td>

                        {/* Designation */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.role === 'Admin / Manager'
                              ? 'bg-rose-100 text-rose-800'
                              : emp.role === 'Cashier'
                              ? 'bg-amber-100 text-amber-800'
                              : emp.role === 'Supervisor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {emp.role}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{emp.phone || '-'}</span>
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(emp.baseSalary)}
                        </td>

                        {/* Outstanding Advance */}
                        <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                          {emp.outstandingAdvance > 0 ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {formatCurrency(emp.outstandingAdvance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Paid this month */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {emp.salaryPaidThisMonth > 0 ? formatCurrency(emp.salaryPaidThisMonth) : <span className="text-slate-400 font-normal">Rs 0</span>}
                        </td>

                        {/* Net Remaining Payable */}
                        <td className="py-3 px-3.5 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                          {formatCurrency(emp.netPayableRemaining)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{emp.status || 'Active'}</span>
                          </span>
                        </td>

                        {/* Actions & Payout Buttons */}
                        <td className="py-3 px-3.5 text-center no-print whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Pay Salary Button */}
                            <button
                              onClick={() => handleOpenSalaryModal(emp)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 cursor-pointer shadow-2xs transition-all"
                              title="Disburse Monthly Salary"
                            >
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              <span>Pay Salary</span>
                            </button>

                            {/* Issue Advance Button */}
                            <button
                              onClick={() => handleOpenAdvanceModal(emp)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 cursor-pointer shadow-2xs transition-all"
                              title="Issue Salary Advance (Peshgi)"
                            >
                              <DollarSign className="w-3 h-3 text-amber-600" />
                              <span>Advance</span>
                            </button>

                            {/* Edit Employee */}
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Employee */}
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                  <tr>
                    <td colSpan={3} className="py-3 px-3.5 text-right uppercase tracking-wider text-slate-700 font-black">
                      Total Staff Payroll ({payrollStats.totalStaff} Members):
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(payrollStats.totalMonthlyBudget)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-amber-800 whitespace-nowrap">
                      {formatCurrency(payrollStats.totalOutstandingAdvances)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                      {formatCurrency(payrollStats.totalDisbursedThisMonth)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                      {formatCurrency(payrollStats.totalNetPending)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <Pagination 
              currentPage={empPage}
              totalItems={filteredEmployees.length}
              pageSize={empPageSize}
              onPageChange={setEmpPage}
              onPageSizeChange={(sz) => { setEmpPageSize(sz); setEmpPage(1); }}
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALARY & ADVANCE DISBURSEMENT HISTORY TABLE                        */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary &amp; Advance Payment Records</h3>
              <p className="text-xs text-slate-500">Historical audit trail of all staff wage distributions and advance disbursements</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPaymentsCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Month / Period</th>
                  <th className="py-3 px-4 text-right">Advance Adjusted</th>
                  <th className="py-3 px-4 text-right">Net Amount Paid</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                      No payment records found. Use "Pay Salary" or "Issue Advance" to record transactions.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{formatDateDisplay(p.date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{p.voucherNo || `VCH-${p.id}`}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{p.employeeName}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.employeeRole || 'Staff'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.type === 'Salary'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.type === 'Advance'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{p.month || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 whitespace-nowrap">
                        {p.advanceDeducted > 0 ? formatCurrency(p.advanceDeducted) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                      <td className="py-3 px-4 text-center no-print whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePayment(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Reverse Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={payPage}
            totalItems={filteredPayments.length}
            pageSize={payPageSize}
            onPageChange={setPayPage}
            onPageSizeChange={(sz) => { setPayPageSize(sz); setPayPage(1); }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PAY SALARY DISBURSEMENT MODAL                                    */}
      {/* ========================================================================= */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in duration-150">
            <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Disburse Staff Monthly Salary</h3>
                  <p className="text-[11px] text-slate-500">Record wage payment with advance deduction &amp; Roznamcha sync</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSalaryModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4 text-xs">
              {salaryError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {salaryError}
                </div>
              )}

              {/* Staff Member Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  value={salaryEmpId}
                  onChange={e => handleSalaryEmpChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {employeeRecords.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - Base Salary: Rs {formatNumber(emp.baseSalary, 0)} {emp.outstandingAdvance > 0 ? `[Adv: Rs ${formatNumber(emp.outstandingAdvance, 0)}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month & Date */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary Month *</label>
                  <input
                    type="month"
                    value={salaryMonth}
                    onChange={e => setSalaryMonth(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disbursement Date *</label>
                  <input
                    type="date"
                    value={salaryDate}
                    onChange={e => setSalaryDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial Breakdown: Base Salary, Advance Deduction, Bonus */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <label className="font-sans font-semibold text-slate-600">Base Monthly Salary (PKR):</label>
                  <input
                    type="number"
                    value={salaryBaseAmount}
                    onChange={e => {
                      setSalaryBaseAmount(e.target.value);
                      updateSalaryCalculations(e.target.value, salaryAdvanceDeduction, salaryBonusAmount);
                    }}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-sans font-semibold text-amber-700">Advance Adjusted / Deducted (-):</label>
                  <input
                    type="number"
                    value={salaryAdvanceDeduction}
                    onChange={e => {
                      setSalaryAdvanceDeduction(e.target.value);
                      updateSalaryCalculations(salaryBaseAmount, e.target.value, salaryBonusAmount);
                    }}
                    className="w-32 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-right font-bold text-amber-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-sans font-semibold text-slate-600">Performance Bonus / Allowance (+):</label>
                  <input
                    type="number"
                    value={salaryBonusAmount}
                    onChange={e => {
                      setSalaryBonusAmount(e.target.value);
                      updateSalaryCalculations(salaryBaseAmount, salaryAdvanceDeduction, e.target.value);
                    }}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-sans font-bold text-slate-900">Net Payable Amount:</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {formatCurrency(parseFloat(salaryNetPay) || 0)}
                  </span>
                </div>
              </div>

              {/* Payment Mode & Voucher # */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={salaryPaymentMethod}
                    onChange={e => setSalaryPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Cash">Cash (from Safe Drawer)</option>
                    <option value="Bank Transfer">Bank Transfer / Online</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt / Voucher #</label>
                  <input
                    type="text"
                    value={salaryVoucherNo}
                    onChange={e => setSalaryVoucherNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={salaryNotes}
                  onChange={e => setSalaryNotes(e.target.value)}
                  placeholder="e.g. Full settlement for October shift roster"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Automatically links to <strong>Roznamcha</strong> cash outflows under Employee Payments.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs transition-all"
                >
                  Disburse Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ISSUE ADVANCE SALARY (PESHGI) MODAL                              */}
      {/* ========================================================================= */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in duration-150">
            <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Issue Staff Salary Advance (Peshgi)</h3>
                  <p className="text-[11px] text-slate-500">Record cash advance against monthly wage entitlement</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdvanceModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="p-6 space-y-4 text-xs">
              {advError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {advError}
                </div>
              )}

              {/* Staff Member */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  value={advEmpId}
                  onChange={e => {
                    setAdvEmpId(e.target.value);
                    const targetEmp = employeeRecords.find(emp => emp.id === Number(e.target.value));
                    if (targetEmp) {
                      setAdvNotes(`Salary advance issued to ${targetEmp.name} (Repayable: ${advRepaymentMonth})`);
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {employeeRecords.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - Base Salary: Rs {formatNumber(emp.baseSalary, 0)} {emp.outstandingAdvance > 0 ? `[Current Advance: Rs ${formatNumber(emp.outstandingAdvance, 0)}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Repayment Month */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Issued *</label>
                  <input
                    type="date"
                    value={advDate}
                    onChange={e => setAdvDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Repayment Deduction Month *</label>
                  <input
                    type="month"
                    value={advRepaymentMonth}
                    onChange={e => setAdvRepaymentMonth(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Advance Amount (PKR) *</label>
                  <input
                    type="number"
                    step="1"
                    value={advAmount}
                    onChange={e => setAdvAmount(e.target.value)}
                    placeholder="e.g. 10000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disbursed From</label>
                  <select
                    value={advPaymentMethod}
                    onChange={e => setAdvPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Cash">Cash (from Safe Drawer)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Reason & Voucher # */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purpose / Reason *</label>
                  <input
                    type="text"
                    value={advReason}
                    onChange={e => setAdvReason(e.target.value)}
                    placeholder="e.g. Medical emergency, festival"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher #</label>
                  <input
                    type="text"
                    value={advVoucherNo}
                    onChange={e => setAdvVoucherNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
                <input
                  type="text"
                  value={advNotes}
                  onChange={e => setAdvNotes(e.target.value)}
                  placeholder="Notes for payroll record"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Advance will be tracked against the employee and automatically synced to <strong>Roznamcha</strong>.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs transition-all"
                >
                  Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT STAFF MEMBER MODAL                                    */}
      {/* ========================================================================= */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in duration-150">
            <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingEmployee ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEmployeeModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Role *</label>
                  <select
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {STAFF_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Base Salary (PKR) *</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="35000"
                    required
                    value={empSalary}
                    onChange={e => setEmpSalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Shift</label>
                  <select
                    value={empShift}
                    onChange={e => setEmpShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Morning">Morning Shift (A)</option>
                    <option value="Evening">Evening Shift (B)</option>
                    <option value="Night">Night Shift (C)</option>
                    <option value="General">General / Full Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CNIC Number</label>
                <input
                  type="text"
                  placeholder="33100-1234567-1"
                  value={empCnic}
                  onChange={e => setEmpCnic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs transition-all"
                >
                  {editingEmployee ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINTABLE STAFF PAYROLL & SALARY LEDGER REPORT                   */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY - Clean White Style) */}
            <div className="px-6 py-4 bg-white text-slate-800 border-b border-slate-200 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Staff Payroll Register &amp; Wage Disbursement Report
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Payroll Month: {selectedMonth} &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportStaffCSV}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fname = `Diyal_Staff_Payroll_${selectedMonth}.pdf`;
                    exportReportToPDF('payroll-print-report', fname);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer border border-blue-200 transition-all shadow-xs"
                  title="Directly save PDF file to your computer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet (print-area) */}
            <div id="payroll-print-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Diyal Filling Station Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="./logo.png" 
                    alt="Diyal Logo" 
                    className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-xs"
                    onError={e => { e.target.src = './logo.jpg'; }}
                  />
                  <div className="flex flex-col leading-none">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider uppercase font-sans">
                      DIYAL
                    </h2>
                    <h3 className="text-xs font-bold tracking-widest text-[#C32026] uppercase mt-0.5">
                      FILLING STATION
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 sm:text-left font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📍</span>
                    <span>{pumpAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <span className="font-mono">{pumpPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">🏛️</span>
                    <span className="font-mono font-semibold">NTN: 1234567-8</span>
                  </div>
                </div>
              </div>

              {/* Title & Metadata Ribbon */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Official Station Staff Wages &amp; Payroll
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Monthly Staff Payroll Register &amp; Wage Disbursement Statement
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete breakdown of base salaries, advances deducted, and net wages disbursed
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                    Period: {selectedMonth}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-bold font-mono">
                    {payrollStats.totalStaff} Employees
                  </span>
                </div>
              </div>

              {/* Printable KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">Total Staff</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">{payrollStats.totalStaff} Members</span>
                  <span className="text-[10px] text-slate-400 block font-sans">Active Station Roster</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 font-sans block">Monthly Payroll</span>
                  <span className="text-base sm:text-lg font-black text-indigo-900">{formatCurrency(payrollStats.totalMonthlyBudget)}</span>
                  <span className="text-[10px] text-indigo-600 block font-sans">Base Wage Budget</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 font-sans block">Disbursed to Date</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">{formatCurrency(payrollStats.totalDisbursedThisMonth)}</span>
                  <span className="text-[10px] text-emerald-600 block font-sans">Paid from Safe Drawer</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 font-sans block">Advances &amp; Pending</span>
                  <span className="text-base sm:text-lg font-black text-amber-900">{formatCurrency(payrollStats.totalOutstandingAdvances)}</span>
                  <span className="text-[10px] text-amber-600 block font-sans">Pending: {formatCurrency(payrollStats.totalNetPending)}</span>
                </div>
              </div>

              {/* Comprehensive Payroll Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Employee Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-right">Base Salary</th>
                      <th className="py-2.5 px-3 text-right">Advance Taken</th>
                      <th className="py-2.5 px-3 text-right">Paid This Month</th>
                      <th className="py-2.5 px-3 text-right">Net Remaining</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id}>
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{emp.name}</td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{emp.role}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{emp.phone || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(emp.baseSalary)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-800 whitespace-nowrap">
                          {emp.outstandingAdvance > 0 ? formatCurrency(emp.outstandingAdvance) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {emp.salaryPaidThisMonth > 0 ? formatCurrency(emp.salaryPaidThisMonth) : 'Rs 0'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                          {formatCurrency(emp.netPayableRemaining)}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="font-semibold text-emerald-700">{emp.status || 'Active'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700 font-black">
                        Total Summary:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        {formatCurrency(payrollStats.totalMonthlyBudget)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900 whitespace-nowrap">
                        {formatCurrency(payrollStats.totalOutstandingAdvances)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-900 whitespace-nowrap">
                        {formatCurrency(payrollStats.totalDisbursedThisMonth)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-900 whitespace-nowrap">
                        {formatCurrency(payrollStats.totalNetPending)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Sign-off Footer */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Accountant</span>
                  <span className="block text-[10px] text-slate-400">Payroll Calculation Checked</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Head Cashier</span>
                  <span className="block text-[10px] text-slate-400">Disbursement Cashier</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Manager</span>
                  <span className="block text-[10px] text-slate-400">Diyal Filling Station</span>
                </div>
              </div>

              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>System Generated Official Document &bull; Diyal ERP</span>
                <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
