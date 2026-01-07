
export enum UserRole {
  ADMIN = 'Admin',
  SR_RSM = 'Senior Regional Sales Manager',
  RSM = 'Regional Sales Manager',
  SME = 'SME Account'
}

export interface UserCredentials {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // For mock login logic
}

export interface SalesMetric {
  target?: number;
  actual: number;
  progress: number;
}

export interface YieldMetrics {
  ypc: number; // Yield Per Con
  ypw: number; // Yield Per Weight
  wpc: number; // Weight Per Con
}

export interface CustomerStats {
  totalSenders: number;
  activeSenders: number;
  newCustomers: number;
  existingCustomers: number;
}

export interface UserPerformance {
  id: string;
  name: string;
  role: UserRole;
  region: string;
  con: SalesMetric;
  rev: SalesMetric;
  yields: YieldMetrics;
  customers: CustomerStats;
  subordinates?: UserPerformance[];
}

export interface CustomerData {
  code: string;
  name: string;
  mobile?: string;
  con: number;
  revenue: number;
  weight: number;
  lastMonthCon: number;
  lastMonthRev: number;
  lastMonthWeight: number;
  status: 'New' | 'Existing';
  momChange: number; // Calculated field
}
