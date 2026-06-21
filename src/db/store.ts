import { promises as fs } from "fs";
import path from "path";
import {
  TruckInfo,
  TripLogMaster,
  TransactionLog,
  AccountMaster,
  CargoManifest,
  ExpenseRegister,
  PerformanceSummaryMart,
  SystemAuditLog,
  AggregatedBillingRecord,
  DashboardAnalytics
} from "../types.js";

// Safe math arithmetic rounding helpers to resolve JS floating-point limitations
export function safeMultiply(a: number, b: number): number {
  return Number(Math.round(Number((a * b).toFixed(6)) * 100) / 100);
}

export function safeSubtract(a: number, b: number): number {
  return Number(Math.round(Number((a - b).toFixed(6)) * 100) / 100);
}

export function safeSum(numbers: number[]): number {
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Number(Math.round(Number(sum.toFixed(6)) * 100) / 100);
}

interface DBState {
  trucks: TruckInfo[];
  trips: TripLogMaster[];
  transactions: TransactionLog[];
  accounts: AccountMaster[];
  manifests: CargoManifest[];
  expenses: ExpenseRegister[];
  summaries: PerformanceSummaryMart[];
  audits: SystemAuditLog[];
}

const DB_FILE_PATH = path.join(process.cwd(), "db.json");

// Initial high-quality production realistic seed records
const INITIAL_STATE: DBState = {
  trucks: [
    { id: "tk-1", truck_no: "HR-38-Q-4921", date_registered: "2026-01-10" },
    { id: "tk-2", truck_no: "MH-43-Y-8822", date_registered: "2026-02-14" },
    { id: "tk-3", truck_no: "KA-01-A-7744", date_registered: "2026-03-22" },
    { id: "tk-4", truck_no: "DL-1G-B-9911", date_registered: "2026-04-05" }
  ],
  trips: [
    { id: "trip-1", truck_id: "tk-1", date: "2026-06-15", route: "Delhi to Mumbai" },
    { id: "trip-2", truck_id: "tk-2", date: "2026-06-16", route: "Mumbai to Chennai" },
    { id: "trip-3", truck_id: "tk-3", date: "2026-06-18", route: "Bangalore to Hyderabad" },
    { id: "trip-4", truck_id: "tk-4", date: "2026-06-19", route: "Kolkata to Patna" }
  ],
  transactions: [
    { id: "tx-1", trip_id: "trip-1", account_id: "Blue Dart Logistics", fair_calc: 45000, transaction_date: "2026-06-15" },
    { id: "tx-2", trip_id: "trip-2", account_id: "Safexpress Corp", fair_calc: 52000, transaction_date: "2026-06-16" },
    { id: "tx-3", trip_id: "trip-3", account_id: "VRL Logistics Ltd", fair_calc: 31000, transaction_date: "2026-06-18" },
    { id: "tx-4", trip_id: "trip-4", account_id: "Trackon Carriers", fair_calc: 28000, transaction_date: "2026-06-19" }
  ],
  accounts: [
    { id: "ac-1", trip_id: "trip-1", account_id: "Blue Dart Logistics", advance: 15000, paid_amount: 10000, remaining_balance: 20000 }, // 45000 - 15000 - 10000 = 20000
    { id: "ac-2", trip_id: "trip-2", account_id: "Safexpress Corp", advance: 20000, paid_amount: 15000, remaining_balance: 17000 }, // 52000 - 20000 - 15000 = 17000
    { id: "ac-3", trip_id: "trip-3", account_id: "VRL Logistics Ltd", advance: 10000, paid_amount: 5000, remaining_balance: 16000 },  // 31000 - 10000 - 5000 = 16000
    { id: "ac-4", trip_id: "trip-4", account_id: "Trackon Carriers", advance: 8000, paid_amount: 10000, remaining_balance: 10000 }    // 28000 - 8000 - 10000 = 10000
  ],
  manifests: [
    { id: "cm-1", trip_id: "trip-1", weight: 24.500, volume: "Standard Trailer", rate: 1600, total_amount: 39200 }, // amount = 24.5 * 1600 = 39200
    { id: "cm-2", trip_id: "trip-2", weight: 28.000, volume: "Bulk Liquid Tanker", rate: 1750, total_amount: 49000 },
    { id: "cm-3", trip_id: "trip-3", weight: 16.200, volume: "Container 24ft", rate: 1550, total_amount: 25110 },
    { id: "cm-4", trip_id: "trip-4", weight: 18.000, volume: "Flatbed Heavy Loads", rate: 1400, total_amount: 25200 }
  ],
  expenses: [
    { id: "ep-1", trip_id: "trip-1", expense_id: "Diesel Purchase", description: "Enroute National Highway Fueling Station", amount: 12000 },
    { id: "ep-2", trip_id: "trip-1", expense_id: "Highway Tolls", description: "NH-8 Toll Gate charges", amount: 2200 },
    { id: "ep-3", trip_id: "trip-1", expense_id: "Driver Allowance", description: "Food & overnight lodging allowance", amount: 3500 },
    { id: "ep-4", trip_id: "trip-2", expense_id: "Diesel Purchase", description: "BPCL Station Fuel", amount: 15000 },
    { id: "ep-5", trip_id: "trip-2", expense_id: "Highway Tolls", description: "Expressway Toll Plaza", amount: 3100 },
    { id: "ep-6", trip_id: "trip-2", expense_id: "Driver Allowance", description: "Trip expense stipend", amount: 4000 },
    { id: "ep-7", trip_id: "trip-3", expense_id: "Diesel Purchase", description: "Shell Station Bangalore-Hyd highway", amount: 9500 },
    { id: "ep-8", trip_id: "trip-3", expense_id: "Driver Allowance", description: "Stipend", amount: 2500 }
  ],
  summaries: [
    { id: "ps-1", trip_id: "trip-1", purchase_id: "PURCH-1001", fair: 45000, weight: 24.500, paid_amount: 10000, net_profit: 3500 }, // Net Profit = Amount(39200) - Purchase Amount(18000) - sumExpenses(17700) = 3500
    { id: "ps-2", trip_id: "trip-2", purchase_id: "PURCH-1002", fair: 52000, weight: 28.000, paid_amount: 15000, net_profit: 6900 }, // Amount(49000) - Purchase(20000) - Expenses(22100) = 6900
    { id: "ps-3", trip_id: "trip-3", purchase_id: "PURCH-1003", fair: 31000, weight: 16.200, paid_amount: 5000, net_profit: 1100 },  // Amount(25110) - Purchase(12000) - Expenses(12000) = 1110
    { id: "ps-4", trip_id: "trip-4", purchase_id: "PURCH-1004", fair: 28000, weight: 18.000, paid_amount: 10000, net_profit: 10200 } // Amount(25200) - Purchase(15000) - Expenses(0) = 10200
  ],
  audits: [
    { id: "ad-1", trip_id: "trip-1", purchase_id: "PURCH-1001", date: "2026-06-15T12:00:00Z", route: "Delhi to Mumbai", amount: 45000, user_action: "TRIP_LOG_INITIATED" },
    { id: "ad-2", trip_id: "trip-2", purchase_id: "PURCH-1002", date: "2026-06-16T14:30:00Z", route: "Mumbai to Chennai", amount: 52000, user_action: "TRIP_LOG_INITIATED" },
    { id: "ad-3", trip_id: "trip-3", purchase_id: "PURCH-1003", date: "2026-06-18T09:15:00Z", route: "Bangalore to Hyderabad", amount: 31000, user_action: "TRIP_LOG_INITIATED" },
    { id: "ad-4", trip_id: "trip-4", purchase_id: "PURCH-1004", date: "2026-06-19T10:00:00Z", route: "Kolkata to Patna", amount: 28000, user_action: "TRIP_LOG_INITIATED" }
  ]
};

// Map of standard base purchases to track "Purchase Amount" for each trip (e.g. diesel base cost or cargo wholesale purchase mapping)
// In the schema, `purchase_id` in performance summary links to raw fuel inventory / purchasing transactions.
const PURCHASE_AMOUNTS_MAP: Record<string, number> = {
  "PURCH-1001": 18000,
  "PURCH-1002": 20000,
  "PURCH-1003": 12000,
  "PURCH-1004": 15000
};

export class Database {
  private state: DBState = { ...INITIAL_STATE };

  public async init(): Promise<void> {
    try {
      const data = await fs.readFile(DB_FILE_PATH, "utf-8");
      this.state = JSON.parse(data);
      console.log("Database successfully loaded from", DB_FILE_PATH);
    } catch {
      console.log("Database file not found or corrupted, generating new initial database state.");
      await this.save();
    }
  }

  private async save(): Promise<void> {
    try {
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err) {
      console.error("Critical: Failed to persist dataset to db.json", err);
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // --- CRUD API INTAKE ENGINE ---

  // 1. TRIP INTAKE (Cascaded transaction mapping: TRUCK_INFO -> TRIP_LOG_MASTER -> CARGO_MANIFEST -> ACCOUNT_MASTER)
  public async createTrip(data: {
    truckNo: string;
    route: string;
    date: string;
    fair: number;
    advance: number;
    transport: string;
    weight: number;
    rate: number;
    volume: string;
    purchaseAmount: number;
  }): Promise<TripLogMaster> {
    const truckNoNormalized = data.truckNo.trim().toUpperCase();
    if (!truckNoNormalized) {
      throw new Error("Truck number is invalid or cannot be blank");
    }

    // A. Verify or register target truck in TRUCK_INFO
    let truck = this.state.trucks.find(t => t.truck_no === truckNoNormalized);
    if (!truck) {
      truck = {
        id: this.generateId("tk"),
        truck_no: truckNoNormalized,
        date_registered: data.date
      };
      this.state.trucks.push(truck);
    }

    // B. Register the Trip Master record
    const tripId = this.generateId("trip");
    const newTrip: TripLogMaster = {
      id: tripId,
      truck_id: truck.id,
      date: data.date || new Date().toISOString().substring(0, 10),
      route: data.route
    };
    this.state.trips.push(newTrip);

    // C. Core Math Engines
    // Amount = Weight * Rate
    const computedAmount = safeMultiply(data.weight, data.rate);

    // Initial Reconciliation calculation
    // Remaining Balance = Fair - Advance
    // (Paid Amount starts at 0 initially)
    const initialRemaining = safeSubtract(data.fair, data.advance);

    // D. Cargo Manifest Insert
    const manifest: CargoManifest = {
      id: this.generateId("cm"),
      trip_id: tripId,
      weight: data.weight,
      volume: data.volume || "Standard Load",
      rate: data.rate,
      total_amount: computedAmount
    };
    this.state.manifests.push(manifest);

    // E. Transaction Log ledger initialization
    const transaction: TransactionLog = {
      id: this.generateId("tx"),
      trip_id: tripId,
      account_id: data.transport,
      fair_calc: data.fair,
      transaction_date: newTrip.date
    };
    this.state.transactions.push(transaction);

    // F. Account Master Setup
    const account: AccountMaster = {
      id: this.generateId("ac"),
      trip_id: tripId,
      account_id: data.transport,
      advance: data.advance,
      paid_amount: 0,
      remaining_balance: initialRemaining
    };
    this.state.accounts.push(account);

    // G. Setup dynamically mapped base purchases
    const purchaseId = this.generateId("PURCH");
    PURCHASE_AMOUNTS_MAP[purchaseId] = Number(data.purchaseAmount) || 0;

    // H. Performance Summary Mart insert
    // Net Profit = Amount - Purchase Amount - Expenses (Initially expenses = 0)
    const initialNetProfit = safeSubtract(computedAmount, Number(data.purchaseAmount) || 0);

    const summaryMart: PerformanceSummaryMart = {
      id: this.generateId("ps"),
      trip_id: tripId,
      purchase_id: purchaseId,
      fair: data.fair,
      weight: data.weight,
      paid_amount: 0,
      net_profit: initialNetProfit
    };
    this.state.summaries.push(summaryMart);

    // I. System Audit Trail logging
    const audit: SystemAuditLog = {
      id: this.generateId("ad"),
      trip_id: tripId,
      purchase_id: purchaseId,
      date: new Date().toISOString(),
      route: data.route,
      amount: data.fair,
      user_action: "TRIP_LOG_INITIATED"
    };
    this.state.audits.push(audit);

    await this.save();
    return newTrip;
  }

  // 2. EXPENSE SERVICE INTAKE
  public async logExpense(data: {
    tripId: string;
    expenseId: string; // e.g. Diesel, Tolls, Meal
    description: string;
    amount: number;
  }): Promise<ExpenseRegister> {
    const trip = this.state.trips.find(t => t.id === data.tripId);
    if (!trip) {
      throw new Error(`Expense assignment aborted: Reference tripId '${data.tripId}' does not exist.`);
    }

    const newExpense: ExpenseRegister = {
      id: this.generateId("ep"),
      trip_id: data.tripId,
      expense_id: data.expenseId,
      description: data.description,
      amount: Number(data.amount) || 0
    };
    this.state.expenses.push(newExpense);

    // Trigger Reconciliation / Profit Re-calc
    await this.updateProfitAndLossForTrip(data.tripId);

    // Log Audit Trail
    const summary = this.state.summaries.find(s => s.trip_id === data.tripId);
    this.state.audits.push({
      id: this.generateId("ad"),
      trip_id: data.tripId,
      purchase_id: summary?.purchase_id || "",
      date: new Date().toISOString(),
      route: trip.route,
      amount: data.amount,
      user_action: `EXPENSE_POSTED: ${data.expenseId}`
    });

    await this.save();
    return newExpense;
  }

  // 3. PAYMENT INSTALLMENT LEDGER ENTRY
  public async postPayment(data: {
    tripId: string;
    paidAmount: number;
  }): Promise<AccountMaster> {
    const account = this.state.accounts.find(a => a.trip_id === data.tripId);
    if (!account) {
      throw new Error(`Payment processing failed: No ledger account setup for tripId '${data.tripId}'`);
    }

    const txLog = this.state.transactions.find(t => t.trip_id === data.tripId);
    if (!txLog) {
      throw new Error(`Critical Integrity: Calculated fare missing for tripId '${data.tripId}'`);
    }

    // Increment cumulative payment posted
    account.paid_amount = safeSum([account.paid_amount, data.paidAmount]);

    // Reconciliation formula validation:
    // Remaining Balance = Fair - Advance - Total Paid Installments
    const totalDeducts = safeSum([account.advance, account.paid_amount]);
    account.remaining_balance = safeSubtract(txLog.fair_calc, totalDeducts);

    // Update real-time summary mart references
    const summary = this.state.summaries.find(s => s.trip_id === data.tripId);
    if (summary) {
      summary.paid_amount = account.paid_amount;
    }

    // Profit re-calc trigger (if any specific models update)
    await this.updateProfitAndLossForTrip(data.tripId);

    // Log Audit Trail
    const trip = this.state.trips.find(t => t.id === data.tripId)!;
    this.state.audits.push({
      id: this.generateId("ad"),
      trip_id: data.tripId,
      purchase_id: summary?.purchase_id || "",
      date: new Date().toISOString(),
      route: trip?.route || "Unknown",
      amount: data.paidAmount,
      user_action: "PAYMENT_POSTED"
    });

    await this.save();
    return account;
  }

  // 4. DELETING A TRIP (Cascading rules simulator)
  public async deleteTrip(tripId: string): Promise<void> {
    // Audit log before wipe of references
    const trip = this.state.trips.find(t => t.id === tripId);
    if (!trip) {
      throw new Error("Trip to delete does not exist");
    }

    // Record system wipe audit trail
    this.state.audits.push({
      id: this.generateId("ad"),
      trip_id: "",
      purchase_id: "",
      date: new Date().toISOString(),
      route: trip.route,
      amount: 0,
      user_action: `TRIP_DELETED: ${tripId} (${trip.route})`
    });

    // Cascading deletions: Remove all dependencies tied to trip_id
    this.state.trips = this.state.trips.filter(t => t.id !== tripId);
    this.state.transactions = this.state.transactions.filter(t => t.trip_id !== tripId);
    this.state.accounts = this.state.accounts.filter(a => a.trip_id !== tripId);
    this.state.manifests = this.state.manifests.filter(m => m.trip_id !== tripId);
    this.state.expenses = this.state.expenses.filter(e => e.trip_id !== tripId);
    this.state.summaries = this.state.summaries.filter(s => s.trip_id !== tripId);

    await this.save();
  }

  // Helper triggering calculations dynamically
  private async updateProfitAndLossForTrip(tripId: string): Promise<void> {
    const summary = this.state.summaries.find(s => s.trip_id === tripId);
    const manifest = this.state.manifests.find(m => m.trip_id === tripId);
    if (!summary || !manifest) return;

    // Sum of all rows tied to that trip_id in EXPENSE_REGISTER
    const tripExpensesList = this.state.expenses.filter(e => e.trip_id === tripId);
    const sumExpenses = safeSum(tripExpensesList.map(e => e.amount));

    // Purchase Amount fetching
    const purchaseAmount = PURCHASE_AMOUNTS_MAP[summary.purchase_id] || 0;

    // Profit Ratio Engine formula:
    // Net Profit = Amount (Cargo manifest total amount) - Purchase Amount - Expenses
    summary.net_profit = safeSubtract(manifest.total_amount, safeSum([purchaseAmount, sumExpenses]));
  }

  // --- QUERY / REPORTING ZONES ---

  // specialized aggregated billing records (Spreadsheet View)
  public getBillingView(): AggregatedBillingRecord[] {
    return this.state.trips.map((trip, idx) => {
      const truck = this.state.trucks.find(t => t.id === trip.truck_id);
      const manifest = this.state.manifests.find(m => m.trip_id === trip.id);
      const account = this.state.accounts.find(a => a.trip_id === trip.id);
      const transaction = this.state.transactions.find(t => t.trip_id === trip.id);
      const summary = this.state.summaries.find(s => s.trip_id === trip.id);
      
      const tripExpenses = this.state.expenses.filter(e => e.trip_id === trip.id);
      const totalExpenses = safeSum(tripExpenses.map(e => e.amount));
      
      const purchaseAmount = summary ? (PURCHASE_AMOUNTS_MAP[summary.purchase_id] || 0) : 0;
      
      const fair = transaction ? transaction.fair_calc : 0;
      const advance = account ? account.advance : 0;
      const paidAmount = account ? account.paid_amount : 0;
      const amount = manifest ? manifest.total_amount : 0;
      const weight = manifest ? manifest.weight : 0;
      const rate = manifest ? manifest.rate : 0;
      const transport = account ? account.account_id : "Unassigned";

      // P/L Balance Verification
      const pl = safeSubtract(amount, safeSum([purchaseAmount, totalExpenses]));

      // Remain Reconciliation: remaining = fair - advance - paidAmount
      const remain = safeSubtract(fair, safeSum([advance, paidAmount]));

      return {
        slNo: idx + 1,
        tripId: trip.id,
        date: trip.date,
        truckId: trip.truck_id,
        truckNo: truck ? truck.truck_no : "Removed",
        route: trip.route,
        fair,
        advance,
        remain,
        transport,
        weight,
        rate,
        amount,
        paidAmount,
        purchaseAmount,
        expenses: totalExpenses,
        pl
      };
    });
  }

  // System audit listings and system status indicators
  public getAuditTrail(): SystemAuditLog[] {
    return [...this.state.audits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);
  }

  // Live aggregated dashboard stats
  public getDashboardAnalytics(): DashboardAnalytics {
    const billingRecords = this.getBillingView();
    
    // 1. Trip-wise profitability
    const tripProfitability = billingRecords.map(r => ({
      tripId: r.tripId,
      truckNo: r.truckNo,
      route: r.route,
      profit: r.pl,
      amount: r.amount,
      expenses: r.expenses
    }));

    // 2. Expense breakdown map
    const expenseMap: Record<string, number> = {};
    this.state.expenses.forEach(exp => {
      const cat = exp.expense_id || "Unclassified Ops";
      expenseMap[cat] = safeSum([expenseMap[cat] || 0, exp.amount]);
    });
    const expenseBreakdown = Object.entries(expenseMap).map(([name, value]) => ({
      name,
      value
    }));

    // Default categories if list is empty
    if (expenseBreakdown.length === 0) {
      expenseBreakdown.push({ name: "Diesel Enroute", value: 0 });
      expenseBreakdown.push({ name: "Tolls & Permits", value: 0 });
      expenseBreakdown.push({ name: "Driver Food Stipend", value: 0 });
    }

    // 3. Truck utilization metrics
    const truckUtilizationMap: Record<string, { tripCount: number; totalWeight: number }> = {};
    billingRecords.forEach(r => {
      if (!truckUtilizationMap[r.truckNo]) {
        truckUtilizationMap[r.truckNo] = { tripCount: 0, totalWeight: 0 };
      }
      truckUtilizationMap[r.truckNo].tripCount += 1;
      truckUtilizationMap[r.truckNo].totalWeight = safeSum([truckUtilizationMap[r.truckNo].totalWeight, r.weight]);
    });
    const truckUtilization = Object.entries(truckUtilizationMap).map(([truckNo, data]) => ({
      truckNo,
      tripCount: data.tripCount,
      totalWeight: data.totalWeight
    }));

    // General macro totals
    const totalTrips = billingRecords.length;
    const totalAmount = safeSum(billingRecords.map(r => r.amount));
    const totalExpenses = safeSum(billingRecords.map(r => r.expenses));
    const totalProfit = safeSum(billingRecords.map(r => r.pl));
    const totalRemainingBalance = safeSum(billingRecords.map(r => r.remain));
    
    // Operational efficiency rate (percentage of profitable trips)
    const profitableCount = billingRecords.filter(r => r.pl > 0).length;
    const operationalRate = totalTrips > 0 ? Math.round((profitableCount / totalTrips) * 100) : 100;

    return {
      tripProfitability,
      expenseBreakdown,
      truckUtilization,
      stats: {
        totalTrips,
        totalAmount,
        totalExpenses,
        totalProfit,
        totalRemainingBalance,
        operationalRate
      }
    };
  }

  // Fetch individual trip records listings
  public getTripsRaw() {
    return this.state.trips;
  }
}

export const dbStore = new Database();
