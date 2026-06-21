export interface TruckInfo {
  id: string;
  truck_no: string;
  date_registered: string; // ISO date string (YYYY-MM-DD)
}

export interface TripLogMaster {
  id: string;
  truck_id: string;
  date: string; // YYYY-MM-DD
  route: string;
}

export interface TransactionLog {
  id: string;
  trip_id: string;
  account_id: string;
  fair_calc: number; // Decimal (fair price calculated)
  transaction_date: string;
}

export interface AccountMaster {
  id: string;
  trip_id: string;
  account_id: string;
  advance: number; // Decimal
  paid_amount: number; // Decimal
  remaining_balance: number; // Decimal
}

export interface CargoManifest {
  id: string;
  trip_id: string;
  weight: number; // Decimal
  volume: string;
  rate: number; // Decimal
  total_amount: number; // Decimal
}

export interface ExpenseRegister {
  id: string;
  trip_id: string;
  expense_id: string;
  description: string;
  amount: number; // Decimal
}

export interface PerformanceSummaryMart {
  id: string;
  trip_id: string;
  purchase_id: string;
  fair: number; // Decimal
  weight: number; // Decimal
  paid_amount: number; // Decimal
  net_profit: number; // Decimal
}

export interface SystemAuditLog {
  id: string;
  trip_id: string;
  purchase_id: string;
  date: string;
  route: string;
  amount: number;
  user_action: string;
}

// Special unified view returned by /api/billing-view
export interface AggregatedBillingRecord {
  slNo: number; // Index in list
  tripId: string;
  date: string;
  truckId: string;
  truckNo: string;
  route: string;
  fair: number; // from transaction_log.fair_calc
  advance: number; // from account_master.advance
  remain: number; // from account_master.remaining_balance
  transport: string; // account_id or transport identifier
  weight: number; // from cargo_manifest.weight
  rate: number; // from cargo_manifest.rate
  amount: number; // from cargo_manifest.total_amount
  paidAmount: number; // from account_master.paid_amount
  purchaseAmount: number; // from performance_summary_mart / purchase item
  expenses: number; // sum of expenses from expense_register
  pl: number; // net_profit = amount - purchaseAmount - expenses
}

export interface DashboardAnalytics {
  tripProfitability: Array<{
    tripId: string;
    truckNo: string;
    route: string;
    profit: number;
    amount: number;
    expenses: number;
  }>;
  expenseBreakdown: Array<{
    name: string;
    value: number;
  }>;
  truckUtilization: Array<{
    truckNo: string;
    tripCount: number;
    totalWeight: number;
  }>;
  stats: {
    totalTrips: number;
    totalAmount: number;
    totalExpenses: number;
    totalProfit: number;
    totalRemainingBalance: number;
    operationalRate: number;
  };
}
