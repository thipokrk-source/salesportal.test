
import { UserRole, UserPerformance, CustomerData } from './types';

export const MOCK_CUSTOMERS: CustomerData[] = [];

export const INITIAL_EMPTY_DATA: UserPerformance = {
  id: 'kxth_admin',
  name: 'KEX Sales System',
  role: UserRole.ADMIN,
  region: 'All Thailand',
  con: { actual: 0, progress: 0 },
  rev: { target: 0, actual: 0, progress: 0 },
  yields: { ypc: 0, ypw: 0, wpc: 0 },
  customers: { totalSenders: 0, activeSenders: 0, newCustomers: 0, existingCustomers: 0 },
  subordinates: []
};

// Kept for type compatibility but app will start with INITIAL_EMPTY_DATA
export const HIERARCHY_DATA = INITIAL_EMPTY_DATA;
