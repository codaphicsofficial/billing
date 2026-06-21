import React, { useState } from "react";
import { Search, ArrowUpDown, Trash2, ShieldAlert, FileText } from "lucide-react";
import { AggregatedBillingRecord } from "../types";

interface BillingSpreadsheetProps {
  records: AggregatedBillingRecord[];
  onDeleteRecord: (tripId: string) => void;
  isLoading: boolean;
}

type SortField = "date" | "truckNo" | "fair" | "remain" | "amount" | "pl";
type SortOrder = "asc" | "desc";

export default function BillingSpreadsheet({
  records,
  onDeleteRecord,
  isLoading
}: BillingSpreadsheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(val);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter items matching query
  const filteredRecords = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.truckNo.toLowerCase().includes(q) ||
      r.transport.toLowerCase().includes(q) ||
      r.route.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  });

  // Sort items
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Totals calculations for the spreadsheet summary row
  const totalFair = filteredRecords.reduce((acc, curr) => acc + curr.fair, 0);
  const totalAdvance = filteredRecords.reduce((acc, curr) => acc + curr.advance, 0);
  const totalRemain = filteredRecords.reduce((acc, curr) => acc + curr.remain, 0);
  const totalWeight = filteredRecords.reduce((acc, curr) => acc + curr.weight, 0);
  const totalAmount = filteredRecords.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredRecords.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalPurchase = filteredRecords.reduce((acc, curr) => acc + curr.purchaseAmount, 0);
  const totalExpenses = filteredRecords.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalPl = filteredRecords.reduce((acc, curr) => acc + curr.pl, 0);

  return (
    <div id="billing-spreadsheet-container" className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden">
      
      {/* Search Header and Operations Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600" />
          <div>
            <h2 id="spreadsheet-heading" className="font-sans font-bold text-slate-800 text-sm tracking-tight">
              OPERATIONAL LOGISTICS SPREADSHEET
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Real-time ledger reconciliation</p>
          </div>
        </div>

        {/* Real-time search query box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            id="spreadsheet-search-input"
            type="text"
            placeholder="Search truck, routings, transport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs py-1.5 pl-9 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white font-medium shadow-2xs"
          />
        </div>
      </div>

      {/* Spreadsheet Canvas Scroll Container */}
      <div className="flex-1 overflow-x-auto">
        <table id="billing-ledger-table" className="min-w-full border-collapse text-left text-slate-700">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3 border-r border-slate-200/60 sticky left-0 bg-slate-100 z-10 text-center w-12">Sl No</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("date")}>
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("truckNo")}>
                <div className="flex items-center gap-1">
                  Truck No
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("fair")}>
                <div className="flex items-center justify-end gap-1">
                  Fair
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Advance</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("remain")}>
                <div className="flex items-center justify-end gap-1">
                  Remain
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60">Transport</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Weight</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Rate</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("amount")}>
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Paid Amount</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Purchase Amount</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right">Expenses</th>
              <th className="py-2.5 px-3 border-r border-slate-200/60 text-right cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition" onClick={() => handleSort("pl")}>
                <div className="flex items-center justify-end gap-1">
                  P/L
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-450" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center w-14">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 text-[11px] font-sans font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400 bg-slate-50 font-medium">
                  Loading operational data sets...
                </td>
              </tr>
            ) : sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400 bg-slate-50 font-medium select-none">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="w-7 h-7 text-slate-300" />
                    <span>No records matching filter parameters discovered.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRecords.map((r) => {
                const isProfitable = r.pl > 1500;
                const isLoss = r.pl <= 0;
                
                return (
                  <tr
                    id={`row-trip-${r.slNo}`}
                    key={r.tripId}
                    className="hover:bg-slate-50 border-b border-slate-100 transition duration-150"
                  >
                    {/* Serial Number */}
                    <td className="py-2 px-3 border-r border-slate-100 text-center sticky left-0 bg-white group-hover:bg-slate-50 font-bold text-slate-500 w-12">
                      {r.slNo}
                    </td>
                    
                    {/* Date */}
                    <td className="py-2 px-3 border-r border-slate-100 font-mono text-slate-600 whitespace-nowrap">
                      {r.date}
                    </td>
                    
                    {/* Truck No */}
                    <td className="py-2 px-3 border-r border-slate-100 text-slate-800 font-bold font-sans">
                      {r.truckNo}
                    </td>
                    
                    {/* Fair calculated */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-sky-700 font-bold">
                      {formatCurrency(r.fair)}
                    </td>
                    
                    {/* Advance */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-slate-500">
                      {formatCurrency(r.advance)}
                    </td>
                    
                    {/* Remaining reconciliation */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-orange-600 font-bold">
                      {formatCurrency(r.remain)}
                    </td>
                    
                    {/* Transport name */}
                    <td className="py-2 px-3 border-r border-slate-100 truncate max-w-28 text-slate-800 font-bold whitespace-nowrap" title={r.transport}>
                      {r.transport}
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate">{r.route}</div>
                    </td>
                    
                    {/* Weight */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-mono text-slate-700 font-bold whitespace-nowrap">
                      {r.weight.toFixed(3)} t
                    </td>
                    
                    {/* Rate */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-mono text-slate-500">
                      {formatCurrency(r.rate)}
                    </td>
                    
                    {/* Total cargo Amount */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-emerald-700">
                      {formatCurrency(r.amount)}
                    </td>
                    
                    {/* Total paid installments so far */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-emerald-600 font-semibold">
                      {formatCurrency(r.paidAmount)}
                    </td>
                    
                    {/* Purchase/base asset quantity */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-slate-500">
                      {formatCurrency(r.purchaseAmount)}
                    </td>
                    
                    {/* Accumulated expenses */}
                    <td className="py-2 px-3 border-r border-slate-100 text-right text-red-500">
                      {formatCurrency(r.expenses)}
                    </td>
                    
                    {/* Profit Margin indicator */}
                    <td className={`py-2 px-3 border-r border-slate-100 text-right font-bold transition-all px-3.5 py-1.5 rounded-sm ${
                      isLoss
                        ? "bg-red-50 text-red-700" 
                        : isProfitable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-sky-700"
                    }`}>
                      {formatCurrency(r.pl)}
                    </td>

                    {/* Deletion control */}
                    <td className="py-2 px-3 text-center">
                      <button
                        id={`btn-delete-${r.tripId}`}
                        onClick={() => {
                          if (window.confirm(`Cascade Delete Trip: "${r.route}" and all dependent records?`)) {
                            onDeleteRecord(r.tripId);
                          }
                        }}
                        className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Delete logistics record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Total / Ledger bottom summary row */}
            {sortedRecords.length > 0 && (
              <tr id="table-summary-totals-row" className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-[11px] font-sans text-slate-800">
                <td colSpan={3} className="py-3 px-3 border-r border-slate-200/60 text-right font-bold uppercase tracking-wider text-[10px] text-slate-500 sticky left-0 bg-slate-100">
                  TOTAL RECONCILED
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-sky-750 font-bold">
                  {formatCurrency(totalFair)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-slate-650">
                  {formatCurrency(totalAdvance)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-orange-650 font-bold">
                  {formatCurrency(totalRemain)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-slate-400 font-normal italic">
                  -
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right font-mono text-slate-800">
                  {totalWeight.toFixed(3)} t
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-slate-400 font-normal">
                  -
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-emerald-700">
                  {formatCurrency(totalAmount)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-emerald-600">
                  {formatCurrency(totalPaid)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-slate-600">
                  {formatCurrency(totalPurchase)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-red-500">
                  {formatCurrency(totalExpenses)}
                </td>
                <td className="py-3 px-3 border-r border-slate-200/60 text-right text-emerald-800 bg-emerald-100/30">
                  {formatCurrency(totalPl)}
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
