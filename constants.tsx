
import { UserRole, UserPerformance, CustomerData } from './types';

// ฟังก์ชันจำลองยอดขายรายวันให้ดูสมจริง
const generateDaily = (baseRev: number, baseCon: number) => {
  return Array.from({ length: 31 }, (_, i) => ({
    day: (i + 1).toString(),
    rev: Math.floor(baseRev * (0.7 + Math.random() * 0.6)),
    con: Math.floor(baseCon * (0.8 + Math.random() * 0.4))
  }));
};

export const MOCK_CUSTOMERS: any[] = [
  {
    code: 'CUST001', name: 'Premium Fashion BKK', mobile: '0812345678',
    revenue: 155000, con: 2450, weight: 1200, status: 'Existing',
    lastMonthRev: 140000, lastMonthCon: 2100, lastMonthWeight: 1000,
    momChange: 10.7, smeId: 'SME001', rsmId: 'RSM001', srsmId: 'SRSM001',
    smeName: 'Somchai SME', rsmName: 'Artit RSM', srsmName: 'Akarapol SR',
    daily: generateDaily(5000, 80)
  },
  {
    code: 'CUST002', name: 'IT Gadget Store', mobile: '0899998888',
    revenue: 85000, con: 1200, weight: 450, status: 'New',
    lastMonthRev: 0, lastMonthCon: 0, lastMonthWeight: 0,
    momChange: 100, smeId: 'SME001', rsmId: 'RSM001', srsmId: 'SRSM001',
    smeName: 'Somchai SME', rsmName: 'Artit RSM', srsmName: 'Akarapol SR',
    daily: generateDaily(2800, 40)
  },
  {
    code: 'CUST003', name: 'Home Decor Direct', mobile: '021112222',
    revenue: 28000, con: 150, weight: 800, status: 'Existing',
    lastMonthRev: 45000, lastMonthCon: 250, lastMonthWeight: 1200,
    momChange: -37.7, smeId: 'SME002', rsmId: 'RSM001', srsmId: 'SRSM001',
    smeName: 'Jane SME', rsmName: 'Artit RSM', srsmName: 'Akarapol SR',
    daily: generateDaily(900, 5)
  }
];

const SME_1: UserPerformance = {
  id: 'SME001', name: 'Somchai SME', role: UserRole.SME, region: 'BKK_E1',
  con: { actual: 3650, progress: 0 },
  rev: { target: 300000, actual: 240000, progress: 80 },
  yields: { ypc: 65.7, ypw: 145.4, wpc: 0.45 },
  customers: { totalSenders: 10, activeSenders: 8, newCustomers: 2, existingCustomers: 8 }
};

const SME_2: UserPerformance = {
  id: 'SME002', name: 'Jane SME', role: UserRole.SME, region: 'BKK_E2',
  con: { actual: 150, progress: 0 },
  rev: { target: 100000, actual: 28000, progress: 28 },
  yields: { ypc: 186.6, ypw: 35.0, wpc: 5.33 },
  customers: { totalSenders: 5, activeSenders: 1, newCustomers: 0, existingCustomers: 5 }
};

const RSM_1: UserPerformance = {
  id: 'RSM001', name: 'Artit RSM', role: UserRole.RSM, region: 'BKK_EAST',
  con: { actual: 3800, progress: 0 },
  rev: { target: 400000, actual: 268000, progress: 67 },
  yields: { ypc: 70.5, ypw: 110.2, wpc: 0.64 },
  customers: { totalSenders: 15, activeSenders: 9, newCustomers: 2, existingCustomers: 13 },
  subordinates: [SME_1, SME_2]
};

const SRSM_1: UserPerformance = {
  id: 'SRSM001', name: 'Akarapol SR', role: UserRole.SR_RSM, region: 'METRO',
  con: { actual: 3800, progress: 0 },
  rev: { target: 400000, actual: 268000, progress: 67 },
  yields: { ypc: 70.5, ypw: 110.2, wpc: 0.64 },
  customers: { totalSenders: 15, activeSenders: 9, newCustomers: 2, existingCustomers: 13 },
  subordinates: [RSM_1]
};

export const INITIAL_KEX_DATA: UserPerformance = {
  id: 'admin',
  name: 'KEX System Admin',
  role: UserRole.ADMIN,
  region: 'Thailand',
  con: { actual: 3800, progress: 0 },
  rev: { target: 400000, actual: 268000, progress: 67 },
  yields: { ypc: 70.5, ypw: 110.2, wpc: 0.64 },
  customers: { totalSenders: 15, activeSenders: 9, newCustomers: 2, existingCustomers: 13 },
  subordinates: [SRSM_1]
};

export const INITIAL_EMPTY_DATA = INITIAL_KEX_DATA;
export const HIERARCHY_DATA = INITIAL_KEX_DATA;
