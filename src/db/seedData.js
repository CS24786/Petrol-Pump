import { db } from './db';
import { hashPassword } from '../utils/auth';

export const oct2026RawSales = [
  // 01-Oct-2026
  { date: '2026-10-01', serialNo: '789', vehicleNo: '5244', type: 'Cash', litres: 0, rate: 401.94, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '781', vehicleNo: '', type: 'Cash', litres: 0, rate: 401.94, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '783', vehicleNo: '8658', type: 'Diesel', litres: 19.16, rate: 401.94, dieselAmount: 7701, cash: 3880, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '784', vehicleNo: '6219', type: 'Diesel', litres: 62.22, rate: 401.94, dieselAmount: 25009, cash: 3000, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '785', vehicleNo: '2695', type: 'Cash', litres: 0, rate: 401.94, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '787', vehicleNo: '9760', type: 'Diesel', litres: 21.42, rate: 401.94, dieselAmount: 8610, cash: 1880, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '786', vehicleNo: '1284', type: 'Diesel', litres: 20.47, rate: 401.94, dieselAmount: 8228, cash: 2080, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '782', vehicleNo: '4539', type: 'Diesel', litres: 12.2, rate: 401.94, dieselAmount: 4904, cash: 5530, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '776', vehicleNo: '', type: 'Cash', litres: 0, rate: 401.94, dieselAmount: 0, cash: 15000, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '777', vehicleNo: '7681', type: 'Diesel', litres: 13.78, rate: 401.94, dieselAmount: 5539, cash: 3695, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '778', vehicleNo: '4635', type: 'Diesel', litres: 29.71, rate: 401.94, dieselAmount: 11942, cash: 1580, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '779', vehicleNo: '4101', type: 'Diesel', litres: 17.65, rate: 401.94, dieselAmount: 7094, cash: 2980, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '780', vehicleNo: '9890', type: 'Diesel', litres: 20.33, rate: 401.94, dieselAmount: 8172, cash: 3500, mobilOil: 0 },
  { date: '2026-10-01', serialNo: '788', vehicleNo: '', type: 'Cash', litres: 0, rate: 401.94, dieselAmount: 0, cash: 3000, mobilOil: 0 },

  // 02-Oct-2026
  { date: '2026-10-02', serialNo: '791', vehicleNo: '2237', type: 'Diesel', litres: 62.44, rate: 400.94, dieselAmount: 25035, cash: 3000, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '812', vehicleNo: '81', type: 'Diesel', litres: 13.79, rate: 400.94, dieselAmount: 5533, cash: 3400, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '814', vehicleNo: '7698', type: 'Diesel', litres: 13.06, rate: 400.94, dieselAmount: 5240, cash: 1980, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '1800', vehicleNo: '7698', type: 'Diesel', litres: 11.01, rate: 400.94, dieselAmount: 4414, cash: 2980, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '801', vehicleNo: '7681', type: 'Cash', litres: 0, rate: 400.94, dieselAmount: 0, cash: 1400, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '799', vehicleNo: '2237', type: 'Diesel', litres: 9.77, rate: 400.94, dieselAmount: 3917, cash: 0, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '798', vehicleNo: '', type: 'Diesel', litres: 4.55, rate: 400.94, dieselAmount: 1824, cash: 8000, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '797', vehicleNo: '80', type: 'Diesel', litres: 12.8, rate: 400.94, dieselAmount: 5132, cash: 3950, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '796', vehicleNo: '6268', type: 'Diesel', litres: 57.2, rate: 400.94, dieselAmount: 22934, cash: 5300, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '795', vehicleNo: '', type: 'Diesel', litres: 10.31, rate: 400.94, dieselAmount: 4133, cash: 3500, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '794', vehicleNo: '5419', type: 'Diesel', litres: 19.7, rate: 400.94, dieselAmount: 7899, cash: 2580, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '793', vehicleNo: '4635', type: 'Cash', litres: 0, rate: 400.94, dieselAmount: 0, cash: 1400, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '792', vehicleNo: '292', type: 'Diesel', litres: 65.35, rate: 400.94, dieselAmount: 26201, cash: 4000, mobilOil: 0 },
  { date: '2026-10-02', serialNo: '790', vehicleNo: '3675', type: 'Diesel', litres: 64.89, rate: 400.94, dieselAmount: 26017, cash: 2000, mobilOil: 0 },

  // 03-Oct-2026
  { date: '2026-10-03', serialNo: '819', vehicleNo: '4101', type: 'Diesel', litres: 18.1, rate: 401.24, dieselAmount: 7262, cash: 2880, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '822', vehicleNo: '7540', type: 'Diesel', litres: 37.1, rate: 401.24, dieselAmount: 14886, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '823', vehicleNo: '4539', type: 'Diesel', litres: 17.61, rate: 401.24, dieselAmount: 7066, cash: 3480, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '818', vehicleNo: '8658', type: 'Diesel', litres: 21.23, rate: 401.24, dieselAmount: 8518, cash: 3880, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '810', vehicleNo: '', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 15000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '824', vehicleNo: '5419', type: 'Diesel', litres: 15.79, rate: 401.24, dieselAmount: 6336, cash: 2880, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '825', vehicleNo: '7698', type: 'Diesel', litres: 11.08, rate: 401.24, dieselAmount: 4446, cash: 1580, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '826', vehicleNo: '292', type: 'Diesel', litres: 11, rate: 401.24, dieselAmount: 4414, cash: 4000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '817', vehicleNo: '7681', type: 'Diesel', litres: 14.07, rate: 401.24, dieselAmount: 5646, cash: 3880, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '816', vehicleNo: '80', type: 'Diesel', litres: 19.7, rate: 401.24, dieselAmount: 7905, cash: 2600, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '815', vehicleNo: '9760', type: 'Diesel', litres: 20.93, rate: 401.24, dieselAmount: 8398, cash: 2780, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '813', vehicleNo: '2929', type: 'Diesel', litres: 22.86, rate: 401.24, dieselAmount: 9172, cash: 2500, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '811', vehicleNo: '2695', type: 'Diesel', litres: 11.2, rate: 401.24, dieselAmount: 4494, cash: 2080, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '809', vehicleNo: '7281', type: 'Diesel', litres: 81.67, rate: 401.24, dieselAmount: 32769, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '806', vehicleNo: '6219', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '808', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '807', vehicleNo: '403', type: 'Diesel', litres: 10.2, rate: 401.24, dieselAmount: 4021, cash: 3180, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '805', vehicleNo: '232', type: 'Diesel', litres: 50, rate: 401.24, dieselAmount: 20062, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '804', vehicleNo: '2489', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '803', vehicleNo: '1214', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-03', serialNo: '802', vehicleNo: '472', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 5000, mobilOil: 0 },

  // 04-Oct-2026
  { date: '2026-10-04', serialNo: '839', vehicleNo: '7698', type: 'Diesel', litres: 10.62, rate: 401.24, dieselAmount: 4261, cash: 1180, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '830', vehicleNo: '2695', type: 'Diesel', litres: 16.42, rate: 401.24, dieselAmount: 6588, cash: 3480, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '831', vehicleNo: '4635', type: 'Diesel', litres: 12.6, rate: 401.24, dieselAmount: 5056, cash: 4080, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '833', vehicleNo: '374', type: 'Diesel', litres: 69.53, rate: 401.24, dieselAmount: 27899, cash: 5900, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '834', vehicleNo: '7681', type: 'Diesel', litres: 13.28, rate: 401.24, dieselAmount: 5329, cash: 1880, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '835', vehicleNo: '292', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '836', vehicleNo: '472', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '838', vehicleNo: '81', type: 'Diesel', litres: 14.93, rate: 401.24, dieselAmount: 5991, cash: 2800, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '837', vehicleNo: '9890', type: 'Diesel', litres: 53.7, rate: 401.24, dieselAmount: 21546, cash: 0, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '840', vehicleNo: '6268', type: 'Diesel', litres: 30.06, rate: 401.24, dieselAmount: 12062, cash: 0, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '827', vehicleNo: '292', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-04', serialNo: '828', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 2000, mobilOil: 0 },

  // 05-Oct-2026
  { date: '2026-10-05', serialNo: '845', vehicleNo: '920', type: 'Diesel', litres: 50.05, rate: 401.24, dieselAmount: 20082, cash: 2000, mobilOil: 0 },
  { date: '2026-10-05', serialNo: '844', vehicleNo: '2489', type: 'Diesel', litres: 80.85, rate: 401.24, dieselAmount: 32440, cash: 0, mobilOil: 0 },
  { date: '2026-10-05', serialNo: '843', vehicleNo: '472', type: 'Diesel', litres: 57.31, rate: 401.24, dieselAmount: 22995, cash: 0, mobilOil: 0 },
  { date: '2026-10-05', serialNo: '842', vehicleNo: '9760', type: 'Diesel', litres: 49.91, rate: 401.24, dieselAmount: 20026, cash: 3000, mobilOil: 0 },
  { date: '2026-10-05', serialNo: '841', vehicleNo: '1284', type: 'Diesel', litres: 48.77, rate: 401.24, dieselAmount: 19569, cash: 0, mobilOil: 0 },

  // 06-Oct-2026
  { date: '2026-10-06', serialNo: '849', vehicleNo: '920', type: 'Cash', litres: 0, rate: 401.24, dieselAmount: 0, cash: 2000, mobilOil: 0 },

  // 07-Oct-2026
  { date: '2026-10-07', serialNo: '858', vehicleNo: '81', type: 'Diesel', litres: 10.78, rate: 399.36, dieselAmount: 4305, cash: 2580, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '856', vehicleNo: '374', type: 'Diesel', litres: 23, rate: 399.36, dieselAmount: 9185, cash: 3000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '861', vehicleNo: '7281', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '864', vehicleNo: '403', type: 'Diesel', litres: 30.37, rate: 399.36, dieselAmount: 12128, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '863', vehicleNo: '2929', type: 'Diesel', litres: 19.15, rate: 399.36, dieselAmount: 7648, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '862', vehicleNo: '7698', type: 'Diesel', litres: 10.54, rate: 399.36, dieselAmount: 4209, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '865', vehicleNo: '4539', type: 'Diesel', litres: 15, rate: 399.36, dieselAmount: 5990, cash: 1880, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '867', vehicleNo: '8658', type: 'Diesel', litres: 9.55, rate: 399.36, dieselAmount: 3813, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '868', vehicleNo: '2695', type: 'Diesel', litres: 27.18, rate: 399.36, dieselAmount: 11094, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '866', vehicleNo: '292', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '869', vehicleNo: '920', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '870', vehicleNo: '4636', type: 'Diesel', litres: 10.91, rate: 399.36, dieselAmount: 4357, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '874', vehicleNo: '374', type: 'Diesel', litres: 40.15, rate: 399.36, dieselAmount: 16034, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '877', vehicleNo: '920', type: 'Diesel', litres: 32.11, rate: 399.36, dieselAmount: 12823, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '876', vehicleNo: '6268', type: 'Diesel', litres: 44.02, rate: 399.36, dieselAmount: 17579, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '879', vehicleNo: '7698', type: 'Diesel', litres: 10.77, rate: 399.36, dieselAmount: 4301, cash: 1500, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '878', vehicleNo: '9890', type: 'Diesel', litres: 53.32, rate: 399.36, dieselAmount: 21293, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '875', vehicleNo: '2695', type: 'Diesel', litres: 11.83, rate: 399.36, dieselAmount: 4724, cash: 1880, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '851', vehicleNo: '8658', type: 'Diesel', litres: 25.71, rate: 399.36, dieselAmount: 10268, cash: 0, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '852', vehicleNo: '4539', type: 'Diesel', litres: 14.79, rate: 399.36, dieselAmount: 5907, cash: 1000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '855', vehicleNo: '6268', type: 'Diesel', litres: 24.23, rate: 399.36, dieselAmount: 9677, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '853', vehicleNo: '2929', type: 'Diesel', litres: 27.07, rate: 399.36, dieselAmount: 10811, cash: 1000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '854', vehicleNo: '3675', type: 'Diesel', litres: 48.45, rate: 399.36, dieselAmount: 19349, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '859', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '871', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '882', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '880', vehicleNo: '292', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '881', vehicleNo: '5244', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 1000, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '873', vehicleNo: '1284', type: 'Diesel', litres: 18.86, rate: 399.36, dieselAmount: 7531, cash: 2800, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '872', vehicleNo: '4635', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 1980, mobilOil: 0 },
  { date: '2026-10-07', serialNo: '857', vehicleNo: '1284', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 2000, mobilOil: 0 },

  // 08-Oct-2026
  { date: '2026-10-08', serialNo: '910', vehicleNo: '1284', type: 'Cash', litres: 0, rate: 399.36, dieselAmount: 0, cash: 3100, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '909', vehicleNo: '7681', type: 'Diesel', litres: 21.38, rate: 398.39, dieselAmount: 8519, cash: 4680, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '908', vehicleNo: '1284', type: 'Diesel', litres: 45.12, rate: 398.39, dieselAmount: 17978, cash: 3100, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '907', vehicleNo: '2489', type: 'Diesel', litres: 3.64, rate: 398.39, dieselAmount: 1450, cash: 0, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '906', vehicleNo: '403', type: 'Diesel', litres: 7.17, rate: 398.39, dieselAmount: 2857, cash: 1680, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '905', vehicleNo: '7281', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '904', vehicleNo: '292', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '903', vehicleNo: '920', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '902', vehicleNo: '4539', type: 'Diesel', litres: 21.08, rate: 398.39, dieselAmount: 8400, cash: 4600, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '900', vehicleNo: '', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 4000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '901', vehicleNo: '403', type: 'Diesel', litres: 11.4, rate: 398.39, dieselAmount: 4542, cash: 1680, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '899', vehicleNo: '4635', type: 'Diesel', litres: 14.11, rate: 398.39, dieselAmount: 5622, cash: 2780, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '898', vehicleNo: '7540', type: 'Diesel', litres: 15.57, rate: 398.39, dieselAmount: 6204, cash: 2080, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '897', vehicleNo: '9760', type: 'Diesel', litres: 17.02, rate: 398.39, dieselAmount: 6781, cash: 2280, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '895', vehicleNo: '2695', type: 'Diesel', litres: 15.95, rate: 398.39, dieselAmount: 6355, cash: 1880, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '896', vehicleNo: '7281', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '894', vehicleNo: '9890', type: 'Diesel', litres: 21.76, rate: 398.39, dieselAmount: 8670, cash: 2080, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '893', vehicleNo: '6268', type: 'Diesel', litres: 14, rate: 398.39, dieselAmount: 5578, cash: 2080, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '892', vehicleNo: '2929', type: 'Diesel', litres: 13.83, rate: 398.39, dieselAmount: 5510, cash: 2080, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '891', vehicleNo: '374', type: 'Diesel', litres: 11.81, rate: 398.39, dieselAmount: 4706, cash: 1880, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '890', vehicleNo: '8658', type: 'Diesel', litres: 12.79, rate: 398.39, dieselAmount: 5096, cash: 2630, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '889', vehicleNo: '80', type: 'Diesel', litres: 34.4, rate: 398.39, dieselAmount: 13706, cash: 3000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '888', vehicleNo: '', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 15000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '887', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '886', vehicleNo: '232', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '885', vehicleNo: '2489', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '884', vehicleNo: '9760', type: 'Diesel', litres: 59.9, rate: 398.39, dieselAmount: 23865, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '883', vehicleNo: '7540', type: 'Diesel', litres: 53.86, rate: 398.39, dieselAmount: 21460, cash: 2000, mobilOil: 0 },
  { date: '2026-10-08', serialNo: '911', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 398.39, dieselAmount: 0, cash: 10000, mobilOil: 0 },

  // 09-Oct-2026
  { date: '2026-10-09', serialNo: '926', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 6500, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '929', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '930', vehicleNo: '9760', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 3100, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '928', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 10000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '927', vehicleNo: '80', type: 'Diesel', litres: 18.21, rate: 399.23, dieselAmount: 7270, cash: 3400, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '924', vehicleNo: '7540', type: 'Diesel', litres: 39.05, rate: 399.23, dieselAmount: 15590, cash: 4300, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '925', vehicleNo: '9760', type: 'Diesel', litres: 44.37, rate: 399.23, dieselAmount: 17714, cash: 3400, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '921', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '922', vehicleNo: '9890', type: 'Diesel', litres: 19.3, rate: 399.23, dieselAmount: 7705, cash: 2900, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '923', vehicleNo: '374', type: 'Diesel', litres: 14.54, rate: 399.23, dieselAmount: 5804, cash: 2900, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '914', vehicleNo: '292', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '915', vehicleNo: '2929', type: 'Diesel', litres: 13.15, rate: 399.23, dieselAmount: 5250, cash: 3880, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '918', vehicleNo: '920', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '917', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '920', vehicleNo: '4539', type: 'Diesel', litres: 21.56, rate: 399.23, dieselAmount: 8608, cash: 4460, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '919', vehicleNo: '4101', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2800, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '916', vehicleNo: '6268', type: 'Diesel', litres: 12.29, rate: 399.23, dieselAmount: 4907, cash: 3440, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '913', vehicleNo: '2695', type: 'Diesel', litres: 16.39, rate: 399.23, dieselAmount: 6544, cash: 3640, mobilOil: 0 },
  { date: '2026-10-09', serialNo: '912', vehicleNo: '4101', type: 'Diesel', litres: 53.99, rate: 399.23, dieselAmount: 21554, cash: 2300, mobilOil: 0 },

  // 10-Oct-2026
  { date: '2026-10-10', serialNo: '943', vehicleNo: '403', type: 'Cash', litres: 0, rate: 399.23, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '962', vehicleNo: '5419', type: 'Diesel', litres: 17.71, rate: 399.75, dieselAmount: 7080, cash: 3300, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '963', vehicleNo: '1284', type: 'Diesel', litres: 17.24, rate: 399.75, dieselAmount: 6892, cash: 3300, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '961', vehicleNo: '292', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '959', vehicleNo: '8658', type: 'Diesel', litres: 25.71, rate: 399.75, dieselAmount: 10278, cash: 4200, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '960', vehicleNo: '920', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '958', vehicleNo: '374', type: 'Diesel', litres: 11.88, rate: 399.75, dieselAmount: 4749, cash: 1880, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '957', vehicleNo: '4635', type: 'Diesel', litres: 12.92, rate: 399.75, dieselAmount: 5165, cash: 2180, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '955', vehicleNo: '4101', type: 'Diesel', litres: 20.36, rate: 399.75, dieselAmount: 8139, cash: 3300, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '956', vehicleNo: '472', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '953', vehicleNo: '2489', type: 'Diesel', litres: 7, rate: 399.75, dieselAmount: 2798, cash: 0, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '954', vehicleNo: '2929', type: 'Diesel', litres: 14.01, rate: 399.75, dieselAmount: 5601, cash: 3400, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '952', vehicleNo: '9890', type: 'Diesel', litres: 42.22, rate: 399.75, dieselAmount: 16877, cash: 3000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '951', vehicleNo: '4635', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '950', vehicleNo: '9760', type: 'Diesel', litres: 40.2, rate: 399.75, dieselAmount: 16070, cash: 3200, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '949', vehicleNo: '374', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2500, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '948', vehicleNo: '4539', type: 'Diesel', litres: 19.84, rate: 399.75, dieselAmount: 7931, cash: 2080, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '947', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 10000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '945', vehicleNo: '292', type: 'Diesel', litres: 47, rate: 399.75, dieselAmount: 18790, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '946', vehicleNo: '80', type: 'Diesel', litres: 20.07, rate: 399.75, dieselAmount: 8022, cash: 2080, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '944', vehicleNo: '6268', type: 'Diesel', litres: 23.03, rate: 399.75, dieselAmount: 9206, cash: 2430, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '942', vehicleNo: '7698', type: 'Diesel', litres: 10.63, rate: 399.75, dieselAmount: 4249, cash: 2380, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '941', vehicleNo: '2695', type: 'Diesel', litres: 12.21, rate: 399.75, dieselAmount: 4881, cash: 2080, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '940', vehicleNo: '2929', type: 'Diesel', litres: 10.74, rate: 399.75, dieselAmount: 4293, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '939', vehicleNo: '5244', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '937', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 10000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '936', vehicleNo: '232', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '935', vehicleNo: '7681', type: 'Diesel', litres: 8.96, rate: 399.75, dieselAmount: 3581, cash: 1500, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '934', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '933', vehicleNo: '2489', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '932', vehicleNo: '472', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-10', serialNo: '931', vehicleNo: '81', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },

  // 11-Oct-2026
  { date: '2026-10-11', serialNo: '976', vehicleNo: '80', type: 'Diesel', litres: 21.1, rate: 399.75, dieselAmount: 8434, cash: 3000, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '975', vehicleNo: '2695', type: 'Diesel', litres: 20.54, rate: 399.75, dieselAmount: 8210, cash: 3900, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '978', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '977', vehicleNo: '6268', type: 'Diesel', litres: 19.65, rate: 399.75, dieselAmount: 7855, cash: 2900, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '964', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 1000, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '967', vehicleNo: '716', type: 'Petrol', litres: 31.12, rate: 400.66, dieselAmount: 12472, cash: 0, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '968', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 5000, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '974', vehicleNo: '1284', type: 'Diesel', litres: 18.72, rate: 399.75, dieselAmount: 7483, cash: 2080, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '973', vehicleNo: '5419', type: 'Diesel', litres: 18.27, rate: 399.75, dieselAmount: 7304, cash: 2080, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '972', vehicleNo: '9760', type: 'Diesel', litres: 19.87, rate: 399.75, dieselAmount: 7943, cash: 4600, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '971', vehicleNo: '9890', type: 'Diesel', litres: 21.24, rate: 399.75, dieselAmount: 8490, cash: 3500, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '970', vehicleNo: '4539', type: 'Diesel', litres: 19.33, rate: 399.75, dieselAmount: 7727, cash: 2800, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '966', vehicleNo: '8658', type: 'Diesel', litres: 18.05, rate: 399.75, dieselAmount: 7216, cash: 2280, mobilOil: 0 },
  { date: '2026-10-11', serialNo: '965', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 3000, mobilOil: 0 },

  // 12-Oct-2026
  { date: '2026-10-12', serialNo: '981', vehicleNo: '2237', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '998', vehicleNo: '403', type: 'Diesel', litres: 10.06, rate: 399.75, dieselAmount: 4022, cash: 3380, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '999', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '997', vehicleNo: '6219', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '996', vehicleNo: '2929', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 1980, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '994', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2500, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '995', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 6000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '993', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 1400, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '992', vehicleNo: '232', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '991', vehicleNo: '292', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '990', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '989', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 10000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '988', vehicleNo: '920', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '987', vehicleNo: '7281', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '986', vehicleNo: '6268', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '983', vehicleNo: '6219', type: 'Diesel', litres: 50.17, rate: 399.75, dieselAmount: 20056, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '984', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '985', vehicleNo: '403', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2000, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '982', vehicleNo: '81', type: 'Diesel', litres: 31.77, rate: 399.75, dieselAmount: 12700, cash: 2380, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '980', vehicleNo: '80', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 2080, mobilOil: 0 },
  { date: '2026-10-12', serialNo: '979', vehicleNo: '', type: 'Cash', litres: 0, rate: 399.75, dieselAmount: 0, cash: 5000, mobilOil: 0 },

  // 13-Oct-2026
  { date: '2026-10-13', serialNo: '1020', vehicleNo: '4635', type: 'Diesel', litres: 0, rate: 397.45, dieselAmount: 3637, cash: 3080, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1017', vehicleNo: '3675', type: 'Cash', litres: 0, rate: 397.45, dieselAmount: 0, cash: 2500, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1019', vehicleNo: '403', type: 'Diesel', litres: 9.61, rate: 397.45, dieselAmount: 3820, cash: 4080, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1018', vehicleNo: '7540', type: 'Diesel', litres: 40.82, rate: 397.45, dieselAmount: 16224, cash: 4680, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1016', vehicleNo: '6268', type: 'Cash', litres: 0, rate: 397.45, dieselAmount: 0, cash: 4200, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1015', vehicleNo: '8658', type: 'Diesel', litres: 17.56, rate: 397.45, dieselAmount: 6979, cash: 3500, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1013', vehicleNo: '2695', type: 'Diesel', litres: 22.59, rate: 397.45, dieselAmount: 8978, cash: 3500, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1011', vehicleNo: '6268', type: 'Diesel', litres: 22.44, rate: 397.45, dieselAmount: 8918, cash: 3300, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1012', vehicleNo: '5419', type: 'Diesel', litres: 17.87, rate: 397.45, dieselAmount: 7102, cash: 3500, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1010', vehicleNo: '9890', type: 'Diesel', litres: 19.66, rate: 397.45, dieselAmount: 7813, cash: 3500, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1014', vehicleNo: '80', type: 'Diesel', litres: 16.6, rate: 397.45, dieselAmount: 6597, cash: 5000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1009', vehicleNo: '7698', type: 'Diesel', litres: 10.6, rate: 397.45, dieselAmount: 4213, cash: 3960, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1007', vehicleNo: '4539', type: 'Diesel', litres: 17.88, rate: 397.45, dieselAmount: 7107, cash: 5000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1008', vehicleNo: '7681', type: 'Diesel', litres: 9.07, rate: 397.45, dieselAmount: 3604, cash: 1280, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1005', vehicleNo: '2929', type: 'Diesel', litres: 23.53, rate: 397.45, dieselAmount: 9352, cash: 2780, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1004', vehicleNo: '920', type: 'Diesel', litres: 55.63, rate: 397.45, dieselAmount: 22110, cash: 2000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1003', vehicleNo: '7281', type: 'Cash', litres: 0, rate: 397.45, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1002', vehicleNo: '2237', type: 'Diesel', litres: 53.98, rate: 397.45, dieselAmount: 21455, cash: 3000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1001', vehicleNo: '2489', type: 'Cash', litres: 0, rate: 397.45, dieselAmount: 0, cash: 3000, mobilOil: 0 },
  { date: '2026-10-13', serialNo: '1000', vehicleNo: '232', type: 'Diesel', litres: 162, rate: 397.45, dieselAmount: 64387, cash: 3000, mobilOil: 0 },
];

// 1. Ensure minimal system defaults exist (Admin login + basic station settings + 0-stock tanks)
// Starts with ZERO sales, ZERO customers, ZERO meter readings, ZERO expenses.
export async function ensureSystemInitialized() {
  // Ensure User Accounts for Desktop Login Authentication exist
  const userCount = await db.users.count();
  if (userCount === 0) {
    const adminHash = await hashPassword('admin');
    await db.users.bulkPut([
      {
        id: 1,
        username: 'admin',
        passwordHash: adminHash,
        name: 'Station Administrator',
        role: 'Administrator',
        status: 'Active',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: 'cashier',
        passwordHash: adminHash,
        name: 'Naveed Akhtar',
        role: 'Cashier',
        status: 'Active',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  // Ensure default Settings exist
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.bulkPut([
      { key: 'pumpName', value: 'DIYAL FILLING STATION' },
      { key: 'pumpTagline', value: 'Authorized Petroleum Dealer • تیل خالص، پیمانہ پورا، معیاری سروس کی ضمانت' },
      { key: 'pumpPhone', value: '0300-7654321' },
      { key: 'pumpPhonePrimary', value: '0300-7654321' },
      { key: 'pumpPhoneSecondary', value: '0321-9876543' },
      { key: 'proprietor1', value: 'Chaudhry Diyal Muhammad (0300-1122334)' },
      { key: 'proprietor2', value: 'Haji Naveed Akhtar (0321-5566778)' },
      { key: 'pumpAddress', value: 'Chiniot Road, Chak Jhumra, FSD.' },
      { key: 'pumpCity', value: 'Faisalabad / Punjab' },
      { key: 'pumpNTN', value: 'NTN-4829103-7' },
      { key: 'pumpEmail', value: 'diyal.station@gmail.com' },
      { key: 'githubRepo', value: 'CS24786/Petrol-Pump' },
      { key: 'currency', value: 'PKR' },
      { key: 'printPaperWidth', value: '80mm' },
      { key: 'autoPrintReceipt', value: false },
      { key: 'currentShiftNumber', value: 'Shift 1' }
    ]);
  } else {
    // Keep pumpAddress updated with official address
    await db.settings.put({ key: 'pumpAddress', value: 'Chiniot Road, Chak Jhumra, FSD.' });
  }

  // Ensure standard fuel dispensing rates exist
  const ratesCount = await db.fuelRates.count();
  if (ratesCount === 0) {
    await db.fuelRates.bulkAdd([
      { fuelType: 'Diesel', rate: 397.45, effectiveDate: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() },
      { fuelType: 'Petrol', rate: 400.66, effectiveDate: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() },
      { fuelType: 'Mobil Oil', rate: 1250.00, effectiveDate: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() }
    ]);
  }

  // One-time initialization to start system in clean 0 state for tanks, nozzles, sales, customers, etc.
  const hasZeroInitRun = localStorage.getItem('PP_ZERO_CLEAN_INIT_DONE_V2') === 'true';
  const sampleActive = localStorage.getItem('PP_SAMPLE_DATA_LOADED') === 'true' || localStorage.getItem('PP_IS_SAMPLE_LOADED') === 'true';
  
  if (!hasZeroInitRun && !sampleActive) {
    await wipeAllData(true);
    localStorage.setItem('PP_ZERO_CLEAN_INIT_DONE_V2', 'true');
  }
}

// 2. Wipe All Transactional Data (Start Fresh with 0 records for real production pump use)
export async function wipeAllData(preserveProfileAndUsers = true) {
  const transactionalTables = [
    'sales',
    'customers',
    'vehicles',
    'ledgerEntries',
    'meterReadings',
    'purchases',
    'suppliers',
    'supplierPayments',
    'expenses',
    'shifts',
    'stockAdjustments',
    'summaryChallans',
    'employees',
    'employeePayments',
    'officeRents',
    'auditLogs',
    'tanks',
    'nozzles'
  ];

  await db.transaction('rw', transactionalTables.map(t => db.table(t)), async () => {
    for (const t of transactionalTables) {
      const table = db.table(t);
      if (table) {
        await table.clear();
      }
    }
  });

  if (!preserveProfileAndUsers) {
    await db.users.clear();
    await db.settings.clear();
    await ensureSystemInitialized();
  }

  localStorage.setItem('PP_IS_SAMPLE_LOADED', 'false');
  localStorage.setItem('PP_SAMPLE_DATA_LOADED', 'false');
  return true;
}

// 3. Load Full Sample Testing Data (Demo / Practice dataset for verification)
export async function loadSampleTestingData() {
  // Wipe existing transactional data to ensure fresh clean demo state
  await wipeAllData(true);

  // Ensure system settings & users exist
  await ensureSystemInitialized();

  // 1. Regular Business Customers (5-6 accounts only; NO retail customer accounts)
  const mbGoodsId = await db.customers.add({
    name: 'M.B GOODS',
    company: 'M.B Goods Transport Company',
    phone: '+92 301 5551234',
    address: 'Terminal #4, Goods Forwarding Agency, Lahore / Multan Road',
    creditLimit: 5000000,
    openingBalance: 1355204, // Exact Previous Balance from Excel LEDGER Sheet
    balanceType: 'Receivable',
    notes: 'Primary freight fleet account with daily diesel and driver cash advances.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  const alRehmanId = await db.customers.add({
    name: 'Al-Rehman Logistics',
    company: 'Al-Rehman Transport Co.',
    phone: '+92 322 8887766',
    address: 'Plot 12, Heavy Vehicle Terminal, Karachi',
    creditLimit: 2500000,
    openingBalance: 245000,
    balanceType: 'Receivable',
    notes: 'Container trailer fleet running intercity routes.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  const khanGoodsId = await db.customers.add({
    name: 'Khan Goods Forwarding',
    company: 'Khan Goods Agency',
    phone: '+92 333 4455667',
    address: 'Circular Road, Truck Stand, Multan',
    creditLimit: 2000000,
    openingBalance: 180000,
    balanceType: 'Receivable',
    notes: 'Local distribution and express logistics.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  const nationalFreightId = await db.customers.add({
    name: 'National Freight Lines',
    company: 'National Freight Corp',
    phone: '+92 345 9988776',
    address: 'Industrial Estate, Rawalpindi',
    creditLimit: 3000000,
    openingBalance: 420000,
    balanceType: 'Receivable',
    notes: 'Long-haul refrigerated trucks.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  const bilalCargoId = await db.customers.add({
    name: 'Bilal Cargo Movers',
    company: 'Bilal Cargo Services',
    phone: '+92 312 7766554',
    address: 'GT Road, Peshawar Bypass',
    creditLimit: 1500000,
    openingBalance: 95000,
    balanceType: 'Receivable',
    notes: 'Regional cargo haulage.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  const tariqBrosId = await db.customers.add({
    name: 'Tariq Brothers Transport',
    company: 'Tariq & Bros Fleet',
    phone: '+92 300 3344112',
    address: 'Bypass Road, Faisalabad',
    creditLimit: 2000000,
    openingBalance: 310000,
    balanceType: 'Receivable',
    notes: 'Textile dispatch carriers.',
    createdAt: new Date('2026-09-30').toISOString()
  });

  // 3. Vehicles for M.B GOODS
  const mbVehicles = [
    '5244', '8658', '6219', '2695', '9760', '1284', '4539', '7681', '4635', 
    '4101', '9890', '2237', '81', '7698', '80', '6268', '5419', '292', '3675', 
    '7540', '2929', '7281', '403', '232', '2489', '1214', '472', '374', '920', '716', '4636'
  ];

  await db.vehicles.bulkAdd(
    mbVehicles.map(v => ({
      customerId: mbGoodsId,
      vehicleNo: v,
      driverName: `Driver (${v})`,
      fuelType: v === '716' ? 'Petrol' : 'Diesel',
      notes: 'Registered fleet truck'
    }))
  );

  // 4. Fuel Rates
  await db.fuelRates.bulkAdd([
    { fuelType: 'Diesel', rate: 397.45, effectiveDate: '2026-10-13', updatedAt: new Date().toISOString() },
    { fuelType: 'Petrol', rate: 400.66, effectiveDate: '2026-10-11', updatedAt: new Date().toISOString() },
    { fuelType: 'Mobil Oil', rate: 1250.00, effectiveDate: '2026-10-01', updatedAt: new Date().toISOString() }
  ]);

  // 5. Tanks
  const tank1Id = await db.tanks.add({
    tankName: 'Tank 1 - High Speed Diesel (HSD)',
    fuelType: 'Diesel',
    capacityLitres: 35000,
    currentStockLitres: 21450,
    reorderLevelLitres: 6000,
    currentDipCm: 142.5,
    lastDipDate: new Date().toISOString().split('T')[0]
  });

  const tank2Id = await db.tanks.add({
    tankName: 'Tank 2 - Super Motor Gasoline (PMG)',
    fuelType: 'Petrol',
    capacityLitres: 25000,
    currentStockLitres: 14200,
    reorderLevelLitres: 4000,
    currentDipCm: 118.0,
    lastDipDate: new Date().toISOString().split('T')[0]
  });

  // 6. Nozzles
  await db.nozzles.bulkAdd([
    { tankId: tank1Id, nozzleName: 'Nozzle 1 (HSD Diesel - Bay 1A)', fuelType: 'Diesel', openingMeter: 125430.5, currentMeter: 128945.8, testingLitres: 10, isActive: true },
    { tankId: tank1Id, nozzleName: 'Nozzle 2 (HSD Diesel - Bay 1B)', fuelType: 'Diesel', openingMeter: 94820.0, currentMeter: 97510.4, testingLitres: 10, isActive: true },
    { tankId: tank2Id, nozzleName: 'Nozzle 3 (PMG Petrol - Bay 2A)', fuelType: 'Petrol', openingMeter: 61200.0, currentMeter: 63140.2, testingLitres: 5, isActive: true },
    { tankId: tank2Id, nozzleName: 'Nozzle 4 (PMG Petrol - Bay 2B)', fuelType: 'Petrol', openingMeter: 48900.0, currentMeter: 50420.0, testingLitres: 5, isActive: true },
  ]);

  // 7. Suppliers
  const psoId = await db.suppliers.add({
    name: 'Pakistan State Oil (PSO)',
    phone: '+92 21 111-111-776',
    address: 'PSO House, Khayaban-e-Iqbal, Clifton, Karachi',
    openingBalance: 1850000,
    currentBalance: 1850000
  });

  const shellId = await db.suppliers.add({
    name: 'Shell Pakistan Limited',
    phone: '+92 21 111-743-555',
    address: 'Shell House, 6 Ch. Khaliquzzaman Road, Karachi',
    openingBalance: 650000,
    currentBalance: 650000
  });

  const attockId = await db.suppliers.add({
    name: 'Attock Petroleum Limited (APL)',
    phone: '+92 51 927-268-1',
    address: 'Attock House, Morgah, Rawalpindi',
    openingBalance: 0,
    currentBalance: 0
  });

  // 8. Purchases (Sample fuel tanker supply)
  await db.purchases.add({
    supplierId: psoId,
    tankId: tank1Id,
    invoiceNo: 'PSO-INV-89210',
    date: '2026-10-01',
    fuelType: 'Diesel',
    litres: 15000,
    purchaseRate: 392.50,
    totalAmount: 5887500,
    paidAmount: 5000000,
    balanceAmount: 887500,
    lorryNo: 'TL-8842',
    driverName: 'Muhammad Aslam',
    notes: '15,000L HSD tanker received and decanted into Tank 1.',
    createdAt: new Date('2026-10-01T08:30:00').toISOString()
  });

  // 9. Staff / Employees
  await db.employees.bulkAdd([
    { name: 'Tariq Mehmood', role: 'Admin', phone: '+92 300 1122334', salary: 65000, status: 'Active' },
    { name: 'Naveed Akhtar', role: 'Cashier', phone: '+92 302 2233445', salary: 40000, status: 'Active' },
    { name: 'Muhammad Rizwan', role: 'Pump Attendant', phone: '+92 304 3344556', salary: 32000, status: 'Active' },
    { name: 'Sajid Ali', role: 'Pump Attendant', phone: '+92 305 4455667', salary: 32000, status: 'Active' }
  ]);

  // 10. Expenses
  await db.expenses.bulkAdd([
    { date: '2026-10-02', category: 'Electricity & Gen Fuel', amount: 14500, description: 'Generator diesel top-up and oil filter', paidTo: 'Pump maintenance' },
    { date: '2026-10-04', category: 'Staff Food & Tea', amount: 4800, description: 'Weekly mess and tea for pump attendants', paidTo: 'Al-Madina Hotel' },
    { date: '2026-10-07', category: 'Printing & Stationeries', amount: 2200, description: 'Thermal paper rolls and daily log register', paidTo: 'Stationery Mart' },
    { date: '2026-10-10', category: 'Pump Maintenance', amount: 8500, description: 'Nozzle 1 hose pipe seal replacement & calibration', paidTo: 'Nozzle Technician' }
  ]);

  // 11. Customer Payments (LEDGER Sheet entries for M.B GOODS: IN & OUT)
  await db.ledgerEntries.bulkAdd([
    // 01-Oct: IN = 1,500,000 (Payment received from M.B GOODS)
    {
      customerId: mbGoodsId,
      date: '2026-10-01',
      inAmount: 1500000,
      outAmount: 0,
      mobilOilAdv: 0,
      dieselAmount: 0,
      description: 'AMOUNT RECEIVED (Cheque / Bank Transfer)',
      receiptNo: 'REC-0110-01',
      paymentMethod: 'Bank Transfer',
      createdAt: new Date('2026-10-01T14:00:00').toISOString()
    },
    // 05-Oct: OUT = 60,000 (Monthly Rent charged to customer account)
    {
      customerId: mbGoodsId,
      date: '2026-10-05',
      inAmount: 0,
      outAmount: 60000,
      mobilOilAdv: 0,
      dieselAmount: 0,
      description: 'MONTHLY RENT (Debit Adjustment)',
      receiptNo: 'ADJ-0510-01',
      paymentMethod: 'Adjustment',
      createdAt: new Date('2026-10-05T10:00:00').toISOString()
    },
    // 07-Oct: IN = 1,000,000 (Payment received from M.B GOODS)
    {
      customerId: mbGoodsId,
      date: '2026-10-07',
      inAmount: 1000000,
      outAmount: 0,
      mobilOilAdv: 0,
      dieselAmount: 0,
      description: 'AMOUNT RECEIVED (Bank Transfer)',
      receiptNo: 'REC-0710-02',
      paymentMethod: 'Bank Transfer',
      createdAt: new Date('2026-10-07T16:30:00').toISOString()
    }
  ]);

  // 12. October 2026 Raw Sales populated into `sales` table
  const salesToInsert = oct2026RawSales.map((item, idx) => {
    const isRetail = !item.vehicleNo;
    const isCashOnly = item.type === 'Cash' || item.litres === 0;
    const formulaPrice = Math.round(item.litres * item.rate);
    const diff = item.dieselAmount - formulaPrice;
    const total = item.dieselAmount + item.cash + item.mobilOil;

    return {
      date: item.date,
      serialNo: item.serialNo || `${780 + idx}`,
      customerId: isRetail ? null : mbGoodsId,
      customerName: isRetail ? 'Walk-in / Retail' : 'M.B GOODS',
      isRetail: isRetail,
      vehicleNo: isRetail ? 'Walk-in Retail' : item.vehicleNo,
      transactionType: item.type,
      fuelType: item.type === 'Petrol' ? 'Petrol' : (item.litres > 0 ? 'Diesel' : 'None'),
      litres: Number(item.litres) || 0,
      rate: Number(item.rate) || 0,
      dieselAmount: Number(item.dieselAmount) || 0,
      cashAdvance: Number(item.cash) || 0,
      mobilOil: Number(item.mobilOil) || 0,
      formulaPrice: formulaPrice,
      difference: diff,
      totalAmount: total,
      paidAmount: isRetail ? total : 0,
      outstandingAmount: isRetail ? 0 : total,
      paymentType: isRetail ? 'Cash' : 'Credit',
      paymentStatus: isRetail ? 'Paid' : 'Unpaid',
      operatorName: 'Naveed Akhtar',
      notes: isRetail ? 'Retail customer on-spot purchase' : (isCashOnly ? 'Driver travel cash advance' : 'Fleet fuel dispensing'),
      createdAt: new Date(`${item.date}T10:${String(idx % 60).padStart(2, '0')}:00`).toISOString()
    };
  });

  await db.sales.bulkAdd(salesToInsert);

  // 13. Seed Initial Daily Meter Readings for October 2026
  const existingReadingsCount = await db.meterReadings.count();
  if (existingReadingsCount === 0) {
    const meterEntries = [
      // 01-Oct-2026
      { date: '2026-10-01', nozzleId: 1, nozzleName: 'Nozzle 1 (HSD Diesel - Bay 1A)', fuelType: 'Diesel', openingMeter: 125430.5, closingMeter: 125740.5, testingLitres: 5, litresSold: 305.0, rate: 401.94, salesAmount: 122592, remarks: 'Normal daily operations', createdAt: '2026-10-01T23:59:00.000Z' },
      { date: '2026-10-01', nozzleId: 2, nozzleName: 'Nozzle 2 (HSD Diesel - Bay 1B)', fuelType: 'Diesel', openingMeter: 94820.0, closingMeter: 95085.0, testingLitres: 5, litresSold: 260.0, rate: 401.94, salesAmount: 104504, remarks: 'Normal daily operations', createdAt: '2026-10-01T23:59:00.000Z' },
      { date: '2026-10-01', nozzleId: 3, nozzleName: 'Nozzle 3 (PMG Petrol - Bay 2A)', fuelType: 'Petrol', openingMeter: 61200.0, closingMeter: 61420.0, testingLitres: 5, litresSold: 215.0, rate: 400.66, salesAmount: 86142, remarks: 'Normal daily operations', createdAt: '2026-10-01T23:59:00.000Z' },
      { date: '2026-10-01', nozzleId: 4, nozzleName: 'Nozzle 4 (PMG Petrol - Bay 2B)', fuelType: 'Petrol', openingMeter: 48900.0, closingMeter: 49090.0, testingLitres: 5, litresSold: 185.0, rate: 400.66, salesAmount: 74122, remarks: 'Normal daily operations', createdAt: '2026-10-01T23:59:00.000Z' },

      // 02-Oct-2026
      { date: '2026-10-02', nozzleId: 1, nozzleName: 'Nozzle 1 (HSD Diesel - Bay 1A)', fuelType: 'Diesel', openingMeter: 125740.5, closingMeter: 126130.5, testingLitres: 5, litresSold: 385.0, rate: 400.94, salesAmount: 154362, remarks: 'Heavy fleet traffic', createdAt: '2026-10-02T23:59:00.000Z' },
      { date: '2026-10-02', nozzleId: 2, nozzleName: 'Nozzle 2 (HSD Diesel - Bay 1B)', fuelType: 'Diesel', openingMeter: 95085.0, closingMeter: 95420.0, testingLitres: 5, litresSold: 330.0, rate: 400.94, salesAmount: 132310, remarks: 'Normal operations', createdAt: '2026-10-02T23:59:00.000Z' },
      { date: '2026-10-02', nozzleId: 3, nozzleName: 'Nozzle 3 (PMG Petrol - Bay 2A)', fuelType: 'Petrol', openingMeter: 61420.0, closingMeter: 61665.0, testingLitres: 5, litresSold: 240.0, rate: 400.66, salesAmount: 96158, remarks: 'Retail petrol surge', createdAt: '2026-10-02T23:59:00.000Z' },
      { date: '2026-10-02', nozzleId: 4, nozzleName: 'Nozzle 4 (PMG Petrol - Bay 2B)', fuelType: 'Petrol', openingMeter: 49090.0, closingMeter: 49295.0, testingLitres: 5, litresSold: 200.0, rate: 400.66, salesAmount: 80132, remarks: 'Normal operations', createdAt: '2026-10-02T23:59:00.000Z' },

      // 03-Oct-2026
      { date: '2026-10-03', nozzleId: 1, nozzleName: 'Nozzle 1 (HSD Diesel - Bay 1A)', fuelType: 'Diesel', openingMeter: 126130.5, closingMeter: 126510.5, testingLitres: 5, litresSold: 375.0, rate: 401.24, salesAmount: 150465, remarks: 'Normal operations', createdAt: '2026-10-03T23:59:00.000Z' },
      { date: '2026-10-02', nozzleId: 2, nozzleName: 'Nozzle 2 (HSD Diesel - Bay 1B)', fuelType: 'Diesel', openingMeter: 95420.0, closingMeter: 95760.0, testingLitres: 5, litresSold: 335.0, rate: 401.24, salesAmount: 134415, remarks: 'Normal operations', createdAt: '2026-10-03T23:59:00.000Z' },
      { date: '2026-10-03', nozzleId: 3, nozzleName: 'Nozzle 3 (PMG Petrol - Bay 2A)', fuelType: 'Petrol', openingMeter: 61665.0, closingMeter: 61915.0, testingLitres: 5, litresSold: 245.0, rate: 400.66, salesAmount: 98162, remarks: 'Retail petrol', createdAt: '2026-10-03T23:59:00.000Z' },
      { date: '2026-10-03', nozzleId: 4, nozzleName: 'Nozzle 4 (PMG Petrol - Bay 2B)', fuelType: 'Petrol', openingMeter: 49295.0, closingMeter: 49510.0, testingLitres: 5, litresSold: 210.0, rate: 400.66, salesAmount: 84139, remarks: 'Retail petrol', createdAt: '2026-10-03T23:59:00.000Z' }
    ];

    await db.meterReadings.bulkAdd(meterEntries);
  }

  console.log(`Successfully seeded sales, meter readings, and M.B GOODS ledger details!`);
  localStorage.setItem('PP_IS_SAMPLE_LOADED', 'true');
  localStorage.setItem('PP_SAMPLE_DATA_LOADED', 'true');
  return {
    success: true,
    message: 'Sample test dataset successfully populated with 6 customers, vehicles, fuel stock, 140+ sales and meter readings.'
  };
}

// 4. Backward-compatible wrapper
export async function seedInitialData(force = false) {
  if (force) {
    return await loadSampleTestingData();
  }
  return await ensureSystemInitialized();
}
