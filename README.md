# Diyal Filling Station — Petrol Pump Management System (MVP)

An offline-first Windows desktop application and web ERP for petrol pump management, fuel sales dispensing, tank stock, customer fleet ledgers, supplier purchases, and daily shift closing.

Built with **React**, **Electron**, **Dexie.js (IndexedDB)**, and **Tailwind CSS v3.4**.

---

## 🚀 Key Modules

1. **Dashboard:**
   - Real-time station overview with live fuel rate tickers (Diesel, Petrol, Mobil Oil).
   - High Speed Diesel (HSD) and Motor Gasoline (PMG) underground storage tank fill gauges.
   - Key performance indicators: Total Revenue, Fuel Dispensed (Ltrs), Driver Cash Advances, and Outstanding Fleet Receivables.
   - Quick Dispensing trigger via `F2` keyboard shortcut.

2. **Sales & Billing (`Oct-26` Sheet Workflow):**
   - Direct digital implementation of the client's `Oct-26` Excel worksheet.
   - Supports: Date, Serial #, Vehicle #, Type (Diesel / Petrol / Cash), Litres, Rate, Diesel Amount, Cash Advance (CASH), Mobil Oil, As Per Formula Price, Difference, and Net Total.
   - Real-time calculations:
     - $\text{Formula Price} = \text{Litres} \times \text{Rate}$
     - $\text{Difference} = \text{Diesel Amount} - \text{Formula Price}$
     - $\text{Total} = \text{Diesel Amount} + \text{Cash Advance} + \text{Mobil Oil}$
   - Real-time filtering by Vehicle Number (e.g. `5244`, `8658`, `6219`), Date, Customer, and Transaction Type.
   - Thermal Receipt (80mm/58mm) and A4 invoice printing.
   - CSV export.

3. **Customers & Fleet Ledgers (`LEDGER` Sheet Workflow):**
   - Faithful reproduction of the `M.B GOODS LEDGER DETAIL Oct-2026` table.
   - Previous Balance: `1,355,204 PKR`.
   - Daily columns: `DATE`, `Diesel(Ltr)`, `IN(AMOUNT)`, `OUT(AMOUNT)`, `MOBIL OIL/ADV`, `DIESEL`, `DIFF/TOTAL`.
   - Expandable rows: Click any day (e.g., `01-Oct-2026`) to drill down into the exact fleet vehicles refueled and cash advances disbursed.
   - Exact ledger calculation rule:
     $$\text{Closing Balance} = \text{Previous Balance} + \text{Total OUT} + \text{Total MOBIL OIL/ADV} + \text{Total DIESEL} - \text{Total IN}$$
   - Record customer payment receipts (`IN`) and debit adjustments/monthly rent (`OUT`).
   - Printable customer statements.

4. **Stock & Tank Management:**
   - Visual tank levels for Tank 1 (HSD Diesel 35,000L) and Tank 2 (PMG Petrol 25,000L).
   - Dip measurement tracking (depth in cm and calibrated litres) with reorder threshold alerts.
   - Nozzle totalizer meters (Opening meter, Current meter, Testing litres, and Total Dispensed).

5. **Purchases & Suppliers (OMCs):**
   - Manage fuel tanker purchases from suppliers (Pakistan State Oil - PSO, Shell, Attock Petroleum).
   - Automated inventory addition to underground tanks upon tanker decanting.
   - Supplier payables tracking and invoice records.

6. **Shifts & Daily Closing:**
   - Shift management (Day Shift & Night Shift).
   - Physical cash drawer reconciliation:
     $$\text{Expected Cash} = \text{Cash Fuel Sales} - \text{Driver Cash Advances} - \text{Shift Petty Expenses}$$
   - Detects cash shortages and surpluses automatically.
   - Printable shift handover slip.

7. **Cashbook & Expenses:**
   - Daily petty cash register with categories: Electricity & Generator Fuel, Staff Mess/Tea, Pump Maintenance, Stationeries, and Taxes.

8. **Reports & Analytics:**
   - Monthly sales summaries by fuel product.
   - Vehicle-wise fleet consumption audit (identifies which truck consumed how many litres and cash advances).
   - One-click print and CSV export.

9. **Staff & Operators:**
   - Pump attendants, cashiers, and admin profiles with contact details and salaries.

10. **Settings & Disaster Recovery (JSON Backup & Restore):**
    - Petrol pump profile details (`DIYAL FILLING STATION`, address, phone, NTN).
    - Rate change manager with effective dates.
    - **Download JSON Backup:** 1-click export of the entire IndexedDB database.
    - **Restore JSON Backup:** Automated safety backup created before restoring with full schema validation.
    - **Reload October 2026 Sample Data:** Instantly restore the client's Excel dataset.

---

## 🛠️ Development & Running Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Run Dev Web Application
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in any browser.

### 2. Run Desktop Application (Electron)
```bash
npm run electron:dev
```
Launches the native Electron desktop application with single-instance lock and native menus.

### 3. Build Windows Executable Installer (`.exe`)
```bash
npm run electron:build
```
Generates an NSIS Windows installer in `dist-electron/` with a desktop shortcut and start menu shortcut (`Diyal Filling Station.exe`).

---

## 📊 Client Excel Reference Data Included

The application includes the full dataset from `M.B GOODS OCT-2026.xlsx`:
- **October 1–13, 2026**: All 140+ vehicle transactions (Vehicles `5244`, `8658`, `6219`, `2695`, `9760`, `1284`, etc.).
- **Customer Ledger**: Starting Previous Balance of `1,355,204 PKR`, payments received (`1,500,000 PKR` on 01-Oct, `1,000,000 PKR` on 07-Oct), and monthly rent charge (`60,000 PKR` on 05-Oct).
