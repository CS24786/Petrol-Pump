import Dexie from 'dexie';

export const db = new Dexie('PetrolPumpDB');

db.version(1).stores({
  sales: '++id, date, serialNo, vehicleNo, customerId, transactionType, fuelType, paymentType, shiftId, createdAt',
  customers: '++id, name, phone, company, createdAt',
  vehicles: '++id, customerId, vehicleNo, driverName',
  ledgerEntries: '++id, customerId, date, receiptNo, createdAt',
  tanks: '++id, tankName, fuelType',
  nozzles: '++id, tankId, nozzleName, fuelType',
  purchases: '++id, supplierId, tankId, invoiceNo, date, fuelType, createdAt',
  suppliers: '++id, name, phone',
  supplierPayments: '++id, supplierId, date, createdAt',
  shifts: '++id, shiftNumber, shiftDate, status, operatorName',
  expenses: '++id, date, shiftId, category, createdAt',
  fuelRates: '++id, fuelType, effectiveDate',
  employees: '++id, name, role, status',
  settings: 'key',
  users: '++id, username, role, status, createdAt',
  stockAdjustments: '++id, tankId, fuelType, date, type, litres, reason, createdAt'
});

db.version(2).stores({
  sales: '++id, date, serialNo, vehicleNo, customerId, transactionType, fuelType, paymentType, shiftId, createdAt',
  customers: '++id, name, phone, company, createdAt',
  vehicles: '++id, customerId, vehicleNo, driverName',
  ledgerEntries: '++id, customerId, date, receiptNo, createdAt',
  tanks: '++id, tankName, fuelType',
  nozzles: '++id, tankId, nozzleName, fuelType',
  purchases: '++id, supplierId, tankId, invoiceNo, date, fuelType, createdAt',
  suppliers: '++id, name, phone',
  supplierPayments: '++id, supplierId, date, createdAt',
  shifts: '++id, shiftNumber, shiftDate, status, operatorName',
  expenses: '++id, date, shiftId, category, createdAt',
  fuelRates: '++id, fuelType, effectiveDate',
  employees: '++id, name, role, status',
  settings: 'key',
  users: '++id, username, role, status, createdAt',
  stockAdjustments: '++id, tankId, fuelType, date, type, litres, reason, createdAt',
  meterReadings: '++id, date, nozzleId, fuelType, createdAt',
  summaryChallans: '++id, summaryNo, customerId, startDate, endDate, createdAt',
  employeePayments: '++id, employeeId, date, type, createdAt',
  officeRents: '++id, customerId, month, status, createdAt',
  auditLogs: '++id, date, entityType, entityId, action, performedBy, createdAt'
});

// Helper for resetting database
export async function resetDatabase() {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

// Backup database to JSON object
export async function exportDatabaseBackup() {
  const backup = {
    version: 1,
    exportDate: new Date().toISOString(),
    appName: 'Petrol Pump Management System (Diyal Filling Station)',
    tables: {}
  };

  for (const table of db.tables) {
    backup.tables[table.name] = await table.toArray();
  }

  return backup;
}

// Restore database from JSON object with validation & safety backup
export async function restoreDatabaseBackup(backupData) {
  if (!backupData || !backupData.tables) {
    throw new Error('Invalid backup file format. Missing tables data.');
  }

  // Create safety pre-restore backup string in localStorage
  try {
    const safetyBackup = await exportDatabaseBackup();
    localStorage.setItem('PP_SAFETY_BACKUP_BEFORE_RESTORE', JSON.stringify(safetyBackup));
  } catch (e) {
    console.warn('Could not store local safety backup:', e);
  }

  // Restore tables
  await db.transaction('rw', db.tables, async () => {
    for (const tableName of Object.keys(backupData.tables)) {
      const table = db.table(tableName);
      if (table) {
        await table.clear();
        const records = backupData.tables[tableName];
        if (Array.isArray(records) && records.length > 0) {
          await table.bulkAdd(records);
        }
      }
    }
  });

  return true;
}
