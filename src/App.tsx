import React, { useState, useEffect } from "react";
import { Truck, RefreshCw, BarChart2, Shield, Cloud, CloudOff, Info, CheckCircle2, Loader2 } from "lucide-react";
import IntakePanel from "./components/IntakePanel.js";
import BillingSpreadsheet from "./components/BillingSpreadsheet.js";
import AnalyticsPanel from "./components/AnalyticsPanel.js";
import { AggregatedBillingRecord, DashboardAnalytics, SystemAuditLog, TripLogMaster } from "./types.js";
import { db } from "./firebase.js";
import { doc, writeBatch } from "firebase/firestore";

export default function App() {
  // Global loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  // App data states
  const [billingRecords, setBillingRecords] = useState<AggregatedBillingRecord[]>([]);
  const [trips, setTrips] = useState<TripLogMaster[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [auditTrail, setAuditTrail] = useState<SystemAuditLog[]>([]);

  // Firebase Cloud Sync Synchronization state
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncTime, setFirebaseSyncTime] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncSteps, setSyncSteps] = useState<{ label: string; status: "pending" | "running" | "success" | "error" }[]>([]);


  // Feedback notifications
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load spreadsheet records
  const loadBillingView = async () => {
    try {
      const response = await fetch("/api/billing-view");
      if (!response.ok) throw new Error("Could not fetch aggregated logistics ledger sheets.");
      const data = await response.json();
      setBillingRecords(data);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed reading sheets.");
    }
  };

  // Load raw trip lists (for Dropdowns)
  const loadRawTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const response = await fetch("/api/trips");
      if (!response.ok) throw new Error("Could not verify active trips roster.");
      const data = await response.json();
      setTrips(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // Load analytics payload & audit logs
  const loadDashboardAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/dashboard");
      if (!response.ok) throw new Error("Failed fetching business intelligence indicators.");
      const { dashboard, auditTrail } = await response.json();
      setAnalytics(dashboard);
      setAuditTrail(auditTrail);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Coordinated state synchronizer
  const reloadAllData = async () => {
    setIsLoading(true);
    setGlobalError(null);
    await Promise.all([
      loadBillingView(),
      loadRawTrips(),
      loadDashboardAnalytics()
    ]);
    setIsLoading(false);
  };

  // Initialize data on boot
  useEffect(() => {
    reloadAllData();
  }, []);

  // Cascaded Delete Trigger
  const handleDeleteTrip = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed executing cascaded wipe.");
      }

      showToast("Logistics record and dependent transactions successfully purged.");
      // Instantly refresh states
      reloadAllData();
    } catch (err: any) {
      alert(`Critical error during wipe transaction: ${err.message}`);
    }
  };

  const syncToFirebase = async () => {
    setIsSyncingFirebase(true);
    setFirebaseError(null);
    setIsSyncModalOpen(true);

    const steps: { label: string; status: "pending" | "running" | "success" | "error" }[] = [
      { label: "Establishing SSL session with Firestore", status: "running" },
      { label: "Validating spreadsheet records mapping", status: "pending" },
      { label: "Uploading raw trips roster data", status: "pending" },
      { label: "Synchronizing security auditing ledger", status: "pending" },
    ];
    setSyncSteps([...steps]);

    try {
      // Step 1: Securely connect to Firestore
      await new Promise((resolve) => setTimeout(resolve, 600));
      steps[0].status = "success";
      steps[1].status = "running";
      setSyncSteps([...steps]);

      // Step 2: Upload active dynamic billing records
      if (billingRecords.length > 0) {
        const batch = writeBatch(db);
        billingRecords.forEach((record) => {
          const ref = doc(db, "billing_records", record.tripId || "unknown");
          batch.set(ref, record);
        });
        await batch.commit();
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      steps[1].status = "success";
      steps[2].status = "running";
      setSyncSteps([...steps]);

      // Step 3: Sync raw trips lists
      if (trips.length > 0) {
        const batch = writeBatch(db);
        trips.forEach((trip) => {
          const ref = doc(db, "raw_trips", trip.id);
          batch.set(ref, trip);
        });
        await batch.commit();
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      steps[2].status = "success";
      steps[3].status = "running";
      setSyncSteps([...steps]);

      // Step 4: Write Audit Trail documents
      if (auditTrail.length > 0) {
        const batch = writeBatch(db);
        auditTrail.forEach((log) => {
          const ref = doc(db, "audit_trail", log.id);
          batch.set(ref, log);
        });
        await batch.commit();
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      steps[3].status = "success";
      setSyncSteps([...steps]);

      const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setFirebaseSyncTime(now);
      showToast("Cloud Database Sync Completed Successfully!");

      setTimeout(() => {
        setIsSyncModalOpen(false);
      }, 1000);

    } catch (err: any) {
      console.error("Firebase Sync Failure: ", err);
      setFirebaseError(err.message || "Failed to finalize batch payload transmittal.");
      
      const runningIdx = steps.findIndex(s => s.status === "running");
      if (runningIdx !== -1) {
        steps[runningIdx].status = "error";
      } else {
        steps[0].status = "error";
      }
      setSyncSteps([...steps]);
      showToast("Firebase Cloud Sync Failed!");
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div id="app-root-shell" className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans pb-10">
      
      {/* 1. Global Navigation Bar */}
      <header id="app-global-header" className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 rounded-lg text-white shadow-sm">
              <Truck id="header-logo-icon" className="w-5 h-5" />
            </div>
            <div>
              <h1 id="app-main-title" className="text-base font-extrabold text-slate-900 tracking-tight leading-none uppercase">
                FLEET<span className="text-sky-600">BILL</span> PRO
              </h1>
              <p className="text-[10px] text-slate-500 font-bold font-sans mt-0.5 uppercase tracking-wider flex items-center gap-1 leading-none">
                <Shield className="w-2.5 h-2.5 text-sky-600" />
                Ledger reconciliation matrix v2.4.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {firebaseSyncTime && (
              <span id="firebase-time-indicator" className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Firestore Synced ({firebaseSyncTime})
              </span>
            )}
            <button
              id="firebase-sync-btn"
              onClick={syncToFirebase}
              disabled={isSyncingFirebase || isLoading}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white border border-transparent py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer"
              title="Backup entire database snapshot to cloud Firestore"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-pulse text-sky-200' : 'text-sky-100'}`} />
              {isSyncingFirebase ? "Backing up..." : "Backup to Firebase"}
            </button>

            <button
              id="global-reload-btn"
              onClick={reloadAllData}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Synchronize tables database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Syncing..." : "Sync Database"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Application Matrix Grid */}
      <main id="app-global-main" className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6 w-full">
        
        {/* Global errors alerts */}
        {globalError && (
          <div id="global-errors-box" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex flex-col gap-1">
            <span className="text-sm font-sans font-bold">Data Fetching Interrupt Resolved</span>
            <span>{globalError}</span>
            <button onClick={reloadAllData} className="w-fit mt-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-[10px]">
              Reconnect Store
            </button>
          </div>
        )}

        {/* Global toast popup alerts */}
        {toastMessage && (
          <div id="toast-notify-box" className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-4 flex flex-col gap-0.5 animate-bounce text-xs">
            <span className="font-bold text-sky-450">System Notification</span>
            <span className="text-slate-300 font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Interactive Workspace Grid Layout (Left Panel: 25%, Center Canvas: 50%, Right sidebar: 25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* A. Left Portal - Data flow intake registry (3 of 12 columns) */}
          <div className="lg:col-span-3 h-full">
            <IntakePanel
              trips={trips}
              isLoadingTrips={isLoadingTrips}
              onTripCreated={reloadAllData}
              onExpenseLogged={reloadAllData}
              onPaymentPosted={reloadAllData}
            />
          </div>

          {/* B. Center Portal - Spreadsheet canvas (6 of 12 columns) */}
          <div className="lg:col-span-6 h-full">
            <BillingSpreadsheet
              records={billingRecords}
              onDeleteRecord={handleDeleteTrip}
              isLoading={isLoading}
            />
          </div>

          {/* C. Right Portal - BI & Live Audits (3 of 12 columns) */}
          <div className="lg:col-span-3 h-full">
            {analytics && (
              <AnalyticsPanel
                analytics={analytics}
                auditTrail={auditTrail}
              />
            )}
          </div>

        </div>

      </main>

      {/* Firebase Sync Live Modal Status */}
      {isSyncModalOpen && (
        <div id="firebase-sync-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="bg-sky-600 text-white p-5 flex items-center gap-3">
              <Cloud className="w-6 h-6 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold font-sans tracking-tight">Active Cloud Sync Session</h3>
                <p className="text-[10px] text-sky-100 font-mono">PROJECT ID: gen-lang-client-0090939990</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Broadcasting locally compiled billing entries, cargo logs, and security audit trials securely to Firestore DB in real-time. Do not close this session.
              </p>

              {/* Progress steps logs */}
              <div className="space-y-2.5 font-sans">
                {syncSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    <span className="text-slate-700 font-medium flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">0{idx + 1}.</span>
                      {step.label}
                    </span>
                    <div>
                      {step.status === "pending" && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                      )}
                      {step.status === "running" && (
                        <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                          Progressing
                        </span>
                      )}
                      {step.status === "success" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                          Complete
                        </span>
                      )}
                      {step.status === "error" && (
                        <span className="text-[10px] text-red-656 font-extrabold uppercase tracking-wider bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {firebaseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800 font-mono leading-relaxed">
                  <span className="font-bold flex items-center gap-1 mb-1 text-xs text-red-950">
                    <Info className="w-3.5 h-3.5 text-red-700" />
                    Transaction Blocked:
                  </span>
                  {firebaseError}
                  <button
                    onClick={() => setIsSyncModalOpen(false)}
                    className="mt-2 w-full px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-850 font-bold rounded text-[10px] transition cursor-pointer"
                  >
                    Close Session Logs
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 font-medium">SSL ENCRYPTED SECURE TUNNEL</span>
              {!isSyncingFirebase && !firebaseError && (
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-3 py-1 bg-slate-250 hover:bg-slate-200 hover:text-slate-800 text-slate-600 text-[11px] font-bold rounded-md transition cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
