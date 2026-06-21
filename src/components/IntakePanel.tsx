import React, { useState, useEffect } from "react";
import { PlusCircle, CreditCard, IndianRupee, Fuel, Truck, Layers } from "lucide-react";
import { TripLogMaster } from "../types";

interface IntakePanelProps {
  onTripCreated: () => void;
  onExpenseLogged: () => void;
  onPaymentPosted: () => void;
  trips: TripLogMaster[];
  isLoadingTrips: boolean;
}

export default function IntakePanel({
  onTripCreated,
  onExpenseLogged,
  onPaymentPosted,
  trips,
  isLoadingTrips
}: IntakePanelProps) {
  // Tabs for the Intake Zone: 'trip' | 'expense' | 'payment'
  const [activeTab, setActiveTab] = useState<"trip" | "expense" | "payment">("trip");

  // Form states - Trip Records
  const [truckNo, setTruckNo] = useState("");
  const [route, setRoute] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [fair, setFair] = useState("");
  const [advance, setAdvance] = useState("");
  const [transport, setTransport] = useState("");
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [volume, setVolume] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  // Form states - Expense Register
  const [expenseTripId, setExpenseTripId] = useState("");
  const [expenseId, setExpenseId] = useState("Diesel Purchase");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  // Form states - Payments Posting Ledger
  const [paymentTripId, setPaymentTripId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Errors and feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default trip ids when trips list changes
  useEffect(() => {
    if (trips.length > 0) {
      if (!expenseTripId) setExpenseTripId(trips[0].id);
      if (!paymentTripId) setPaymentTripId(trips[0].id);
    }
  }, [trips, expenseTripId, paymentTripId]);

  // Auto-calculate Agreed Fare (fair) dynamically in real-time when weight or rate changes
  useEffect(() => {
    const w = parseFloat(weight);
    const r = parseFloat(rate);
    if (!isNaN(w) && !isNaN(r)) {
      setFair((w * r).toFixed(2));
    }
  }, [weight, rate]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Submit Handle for Trip Intake
  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!truckNo || !route || !transport || !weight || !rate || !fair) {
      setErrorMessage("Please complete all required fields with accurate information.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckNo,
          route,
          date,
          fair: Number(fair),
          advance: Number(advance) || 0,
          transport,
          weight: Number(weight),
          rate: Number(rate),
          volume: volume || "Standard Container",
          purchaseAmount: Number(purchaseAmount) || 0
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit trip record.");
      }

      setSuccessMessage(`Trip registered successfully! ID: ${resData.trip.id}`);
      // Clear values
      setTruckNo("");
      setRoute("");
      setFair("");
      setAdvance("");
      setTransport("");
      setWeight("");
      setRate("");
      setVolume("");
      setPurchaseAmount("");
      
      onTripCreated();
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Handle for Incident/Driver Expenses
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!expenseTripId || !expenseDesc || !expenseAmount) {
      setErrorMessage("Complete all fields to allocate trip expenditures.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: expenseTripId,
          expenseId,
          description: expenseDesc,
          amount: Number(expenseAmount)
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to log expense.");
      }

      setSuccessMessage(`Trip expense successfully allocated!`);
      setExpenseDesc("");
      setExpenseAmount("");
      
      onExpenseLogged();
    } catch (err: any) {
      setErrorMessage(err.message || "Failure registering expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Handle for Billing Payments Posted
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!paymentTripId || !paymentAmount) {
      setErrorMessage("Select a trip and state payment amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: paymentTripId,
          paidAmount: Number(paymentAmount)
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to log payment.");
      }

      setSuccessMessage(`Payment installment successfully recorded!`);
      setPaymentAmount("");
      
      onPaymentPosted();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed posting payment entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time calculated preview fields for immediate feedback
  const parsedWeight = parseFloat(weight) || 0;
  const parsedRate = parseFloat(rate) || 0;
  const parsedAdvance = parseFloat(advance) || 0;
  const parsedPurchase = parseFloat(purchaseAmount) || 0;
  const parsedFair = parseFloat(fair) || (parsedWeight * parsedRate);

  const calculatedAmount = parsedWeight * parsedRate;
  const remainingBalance = parsedFair - parsedAdvance;
  const projectedProfit = calculatedAmount - parsedPurchase;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="intake-panel-container" className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Panel Header & Custom Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers id="intake-header-icon" className="w-5 h-5 text-sky-600 animate-pulse" />
          <h2 id="intake-heading" className="font-sans font-bold text-slate-800 tracking-tight text-sm">
            INCOMING TRANSACTION PORTAL
          </h2>
        </div>
        
        {/* Navigation Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
          <button
            id="tab-trip-btn"
            onClick={() => { setActiveTab("trip"); clearMessages(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "trip"
                ? "bg-white text-sky-600 shadow-2xs border border-slate-150"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Trips Log
          </button>
          
          <button
            id="tab-expense-btn"
            onClick={() => { setActiveTab("expense"); clearMessages(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "expense"
                ? "bg-white text-sky-600 shadow-2xs border border-slate-150"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            Expenses
          </button>
          
          <button
            id="tab-payment-btn"
            onClick={() => { setActiveTab("payment"); clearMessages(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "payment"
                ? "bg-white text-sky-600 shadow-2xs border border-slate-150"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payments
          </button>
        </div>
      </div>

      {/* Forms Body */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[580px] lg:max-h-none">
        
        {/* User alerts */}
        {errorMessage && (
          <div id="error-message-box" className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-100 flex items-start gap-2 animate-fade-in">
            <span className="font-bold">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div id="success-message-box" className="p-3 mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-start gap-2 animate-fade-in">
            <span className="font-bold">Success:</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Trip Logs Intake */}
        {activeTab === "trip" && (
          <form id="trip-intake-form" onSubmit={handleTripSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Truck ID (No.) *</label>
                <input
                  id="input-truck-no"
                  type="text"
                  placeholder="e.g. HR-38-Q-4921"
                  required
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Route Descriptor *</label>
                <input
                  id="input-route"
                  type="text"
                  placeholder="e.g. Delhi to Mumbai"
                  required
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Logged *</label>
                <input
                  id="input-trip-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transport Client *</label>
                <input
                  id="input-transport"
                  type="text"
                  placeholder="e.g. Blue Dart Logistics"
                  required
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/40 rounded-lg border border-sky-150 space-y-3">
              <span className="text-xs font-bold text-sky-800 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" />
                Revenue & Calculation Ledger setup
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Agreed Fare (Calculated) *</label>
                  <input
                    id="input-fair"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Fare (₹)"
                    required
                    value={fair}
                    onChange={(e) => setFair(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Contract Advance (₹)</label>
                  <input
                    id="input-advance"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Advance (₹)"
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Payload Weight (Tonnes) *</label>
                  <input
                    id="input-weight"
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="e.g. 24.5"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Rate / Metric Ton (₹) *</label>
                  <input
                    id="input-rate"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Rate per Ton (₹)"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Volume/Container Type</label>
                  <input
                    id="input-volume"
                    type="text"
                    placeholder="e.g. 40ft Reefer"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Purchase/Base Amt (₹)</label>
                  <input
                    id="input-purchase-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Live Computations Preview Panel */}
            <div className="bg-sky-50/50 border border-sky-150 rounded-xl p-3 space-y-2 mt-2">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-widest block leading-none">
                Live Preview Calculations (Automatic)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Manifest Amount</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                    {formatINR(calculatedAmount)}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Remaining Balance</span>
                  <span className={`text-xs font-mono font-bold mt-0.5 ${remainingBalance > 0 ? "text-orange-600" : "text-slate-600"}`}>
                    {formatINR(remainingBalance)}
                  </span>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-110 p-2 rounded-lg flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase">Projected Net Profit</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Manifest amt minus base cost</span>
                </div>
                <span className={`text-sm font-sans font-extrabold ${projectedProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                  {formatINR(projectedProfit)}
                </span>
              </div>
            </div>

            <button
              id="submit-trip-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg font-sans font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all active:scale-98 disabled:bg-slate-350 disabled:pointer-events-none"
            >
              <PlusCircle className="w-4 h-4" />
              {isSubmitting ? "Processing Transaction..." : "Initialize Logistics Trip"}
            </button>
          </form>
        )}

        {/* Tab 2: Incident driver expenses allocation */}
        {activeTab === "expense" && (
          <form id="expense-intake-form" onSubmit={handleExpenseSubmit} className="space-y-4">
             <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Trip Linkage *</label>
              {isLoadingTrips ? (
                <div className="text-xs text-slate-400 py-1">Loading route roster...</div>
              ) : trips.length === 0 ? (
                <div className="text-xs text-red-500 border border-red-100 p-2 rounded bg-red-50">No active trips found. Register trip first.</div>
              ) : (
                <select
                  id="select-expense-trip"
                  value={expenseTripId}
                  onChange={(e) => setExpenseTripId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route} ({t.date})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Category *</label>
              <select
                id="select-expense-cat"
                value={expenseId}
                onChange={(e) => setExpenseId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
              >
                <option value="Diesel Purchase">Diesel Purchase</option>
                <option value="Highway Tolls">Highway Tolls</option>
                <option value="Driver Allowance">Driver Allowance</option>
                <option value="Maintenance & Parts">Maintenance & Parts</option>
                <option value="Other Miscellany">Other Miscellany</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Description *</label>
              <input
                id="input-expense-desc"
                type="text"
                placeholder="e.g. BPCL highway fuel fill-up receipt #2091"
                required
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cost / Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                <input
                  id="input-expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full text-xs py-2 pl-6 pr-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
            </div>

            <button
              id="submit-expense-btn"
              type="submit"
              disabled={isSubmitting || trips.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-sans font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all active:scale-98 disabled:bg-slate-350 disabled:pointer-events-none"
            >
              <Fuel className="w-4 h-4" />
              {isSubmitting ? "Allocating Funds..." : "File Operational Expense"}
            </button>
          </form>
        )}

        {/* Tab 3: Payments Posting Ledger */}
        {activeTab === "payment" && (
          <form id="payment-intake-form" onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Billing Trip Account *</label>
              {isLoadingTrips ? (
                <div className="text-xs text-slate-400 py-1">Loading billing options...</div>
              ) : trips.length === 0 ? (
                <div className="text-xs text-red-500 border border-red-100 p-2 rounded bg-red-50">No trips logged on system.</div>
              ) : (
                <select
                  id="select-payment-trip"
                  value={paymentTripId}
                  onChange={(e) => setPaymentTripId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route} ({t.date})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Installment Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                <input
                  id="input-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-xs py-2 pl-6 pr-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-slate-50 font-medium transition-all"
                />
              </div>
            </div>

            <button
              id="submit-payment-btn"
              type="submit"
              disabled={isSubmitting || trips.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-sans font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all active:scale-98 disabled:bg-slate-350 disabled:pointer-events-none"
            >
              <CreditCard className="w-4 h-4" />
              {isSubmitting ? "Validating Ledger..." : "Post Payment Installment"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
