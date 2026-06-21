import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Activity, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { DashboardAnalytics, SystemAuditLog } from "../types";

interface AnalyticsPanelProps {
  analytics: DashboardAnalytics;
  auditTrail: SystemAuditLog[];
}

const COLORS = ["#0284c7", "#f97316", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPanel({
  analytics,
  auditTrail
}: AnalyticsPanelProps) {
  const { stats, tripProfitability, expenseBreakdown } = analytics;

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="analytics-panel-container" className="flex flex-col gap-4 h-full">
      
      {/* 1. Macro Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-50 border border-sky-150 p-3 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Net Profit</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span id="stat-net-profit" className="text-lg font-extrabold text-sky-950 font-sans tracking-tight">
              {formatCurrency(stats.totalProfit)}
            </span>
          </div>
          <p className="text-[9px] text-sky-650 font-medium mt-0.5">Payload vs base & fuel</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-110 p-3 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Remaining Bal.</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span id="stat-remaining-balance" className="text-lg font-extrabold text-emerald-950 font-sans tracking-tight">
              {formatCurrency(stats.totalRemainingBalance)}
            </span>
          </div>
          <p className="text-[9px] text-emerald-650 font-medium mt-0.5">Awaiting reconciliation</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Load Multiplier</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span id="stat-cargo-amount" className="text-sm font-bold text-slate-800 font-sans">
              {formatCurrency(stats.totalAmount)}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-normal mt-0.5">{stats.totalTrips} total line-trips</p>
        </div>

        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Accumulated Exp.</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span id="stat-accumulated-expenses" className="text-sm font-bold text-red-950 font-sans">
              {formatCurrency(stats.totalExpenses)}
            </span>
          </div>
          <p className="text-[9px] text-red-500 font-medium mt-0.5">Fuel, travel, driver fees</p>
        </div>
      </div>

      {/* 2. System status tracker */}
      <div id="system-status-indicator" className="bg-white border border-slate-200 shadow-2xs rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wide">
            SYSTEM STATUS: OPERATIONAL
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold font-mono">100% ONLINE</span>
        </div>
      </div>

      {/* 3. Bar Chart: Trip-wise Profitability */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <h3 className="text-xs font-sans font-bold text-slate-800 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
          Trip-wise Profitability (₹)
        </h3>
        <div className="h-[180px] w-full text-[9px] font-mono">
          {tripProfitability.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300">
              No trip metric assets logs found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tripProfitability}
                margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="truckNo" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), "P/L Margin"]}
                  contentStyle={{ fontSize: "10px", fontFamily: "sans-serif" }}
                />
                <Bar dataKey="profit" fill="#0284c7" radius={[3, 3, 0, 0]}>
                  {tripProfitability.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#0284c7" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Pie Chart: Expense Allocation Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <h3 className="text-xs font-sans font-bold text-slate-800 mb-2 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-orange-600" />
          Major Expense Breakdown (₹)
        </h3>
        <div className="h-[160px] flex items-center justify-center font-sans">
          {expenseBreakdown.every(e => e.value === 0) ? (
            <div className="text-[11px] text-slate-400">0.00 Total Expense Outlay.</div>
          ) : (
            <div className="flex w-full h-full items-center">
              <div className="w-[60%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ fontSize: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[40%] flex flex-col gap-1.5 justify-center pl-1">
                {expenseBreakdown.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[9px] text-slate-600 font-medium">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div className="truncate max-w-[80px]" title={entry.name}>{entry.name}</div>
                    <span className="text-slate-400 font-bold">({formatCurrency(entry.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Live System Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex-1 flex flex-col overflow-hidden max-h-[220px]">
        <div className="flex items-center gap-1 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <h3 className="text-xs font-sans font-bold text-slate-800">
            System Auditing Trails
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[170px]">
          {auditTrail.map((log) => {
            const isInit = log.user_action.includes("INITIATED");
            const isDelete = log.user_action.includes("DELETED");
            const isPay = log.user_action.includes("PAYMENT");
            const isExp = log.user_action.includes("EXPENSE");

            let badgeColor = "bg-slate-100 text-slate-600";
            if (isInit) badgeColor = "bg-sky-50 text-sky-700 border-sky-150";
            if (isDelete) badgeColor = "bg-red-50 text-red-700 border-red-150";
            if (isPay) badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-150";
            if (isExp) badgeColor = "bg-orange-50 text-orange-700 border-orange-150";

            return (
              <div
                key={log.id}
                className="p-2 border border-slate-100/60 rounded-lg text-[10px] font-medium flex flex-col gap-0.5 hover:bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[8px] uppercase tracking-wide ${badgeColor}`}>
                    {log.user_action}
                  </span>
                  <span className="text-slate-400 font-mono text-[8px]">
                    {new Date(log.date).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-700 font-medium mt-1">
                  Route: {log.route || "Global"}
                </div>
                {log.amount > 0 && (
                  <div className="text-slate-500">
                    Entity Val: <span className="font-bold text-slate-800">{formatCurrency(log.amount)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
