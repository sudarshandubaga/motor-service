import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Search,
  Receipt,
  Printer,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  X,
  Car,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  DollarSign,
  Wrench,
  Building,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { printReport } from '../utils/printReport';

export default function CashBook({
  sales = [],
  tenant,
  onViewInvoice = () => {}
}) {
  const currency = tenant?.currency || '₹';

  const [dateFilter, setDateFilter] = useState('All'); // 'Today', 'Yesterday', 'ThisWeek', 'ThisMonth', 'All'
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only Cash transactions
  const cashSales = useMemo(() => {
    return sales.filter((s) => s.payment_method?.toLowerCase() === 'cash');
  }, [sales]);

  // Date filtering logic
  const filteredCashSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return cashSales.filter((s) => {
      const saleDate = s.created_at ? new Date(s.created_at) : null;
      const saleDateStr = saleDate ? saleDate.toISOString().split('T')[0] : '';

      // Date match
      let matchDate = true;
      if (dateFilter === 'Today') {
        matchDate = saleDateStr === todayStr;
      } else if (dateFilter === 'Yesterday') {
        matchDate = saleDateStr === yesterdayStr;
      } else if (dateFilter === 'ThisWeek') {
        matchDate = saleDate && saleDate >= startOfWeek;
      } else if (dateFilter === 'ThisMonth') {
        matchDate = saleDate && saleDate >= startOfMonth;
      }

      // Search match
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.invoice_no?.toLowerCase().includes(q) ||
        (s.customer && s.customer.name?.toLowerCase().includes(q)) ||
        (s.customer && s.customer.mobile_no && s.customer.mobile_no.includes(q)) ||
        (s.customer && s.customer.vehicle_no && s.customer.vehicle_no.toLowerCase().includes(q));

      return matchDate && matchSearch;
    });
  }, [cashSales, dateFilter, searchTerm]);

  // Calculations
  const totalCashBilled = useMemo(() => {
    return filteredCashSales.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  }, [filteredCashSales]);

  const totalCashTendered = useMemo(() => {
    return filteredCashSales.reduce((acc, curr) => {
      const paid = Number(curr.paid_amount);
      return acc + (paid && paid > 0 ? paid : Number(curr.total_amount || 0));
    }, 0);
  }, [filteredCashSales]);

  const totalChangeReturned = useMemo(() => {
    return filteredCashSales.reduce((acc, curr) => {
      const paid = Number(curr.paid_amount);
      const total = Number(curr.total_amount || 0);
      if (paid && paid > total) {
        return acc + (paid - total);
      }
      return acc;
    }, 0);
  }, [filteredCashSales]);

  // Human-readable period label for print statement header
  const periodLabel = useMemo(() => {
    const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    if (dateFilter === 'Today') return `Today (${today})`;
    if (dateFilter === 'Yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return `Yesterday (${y.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })})`;
    }
    if (dateFilter === 'ThisWeek') return 'Current Week';
    if (dateFilter === 'ThisMonth') return `This Month (${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
    return 'All Records';
  }, [dateFilter]);

  const handlePrint = () => {
    printReport({
      elementId: 'cashbook-printable-area',
      title: `CashBook_${dateFilter}_${new Date().toISOString().split('T')[0]}`,
      orientation: 'portrait'
    });
  };

  return (
    <div id="cashbook-printable-area" className="space-y-6">

      {/* ============================================================== */}
      {/* 1. STANDARD A4 PRINT-ONLY LETTERHEAD & AUDIT HEADER             */}
      {/* ============================================================== */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                {tenant?.name || 'Motor Service Garage'}
              </h1>
            </div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Multi-Brand Automobile Care & Diagnostic Center
            </p>
            <p className="text-[11px] text-slate-600 max-w-lg leading-relaxed">
              {tenant?.address || 'Main Road, Automobile Complex, Service Lane'}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px] text-slate-600 font-mono pt-0.5">
              {tenant?.phone && <span><strong>Phone:</strong> {tenant.phone}</span>}
              {tenant?.email && <span><strong>Email:</strong> {tenant.email}</span>}
              <span><strong>Station Domain:</strong> {tenant?.domain_name || 'Main Counter'}</span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl p-3 min-w-[230px] text-right bg-slate-50/80">
            <div className="text-xs font-black uppercase tracking-widest text-slate-950 bg-slate-200/90 py-1 px-2 rounded mb-1.5 text-center border border-slate-300">
              CASH BOOK REPORT
            </div>
            <div className="text-[10px] text-slate-700 space-y-1 font-medium text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Period:</span>
                <span className="font-bold text-slate-900">{periodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Generated:</span>
                <span className="font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Receipts:</span>
                <span className="font-mono font-bold text-slate-900">{filteredCashSales.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. ON-SCREEN HEADER & PRINT TRIGGER (Hidden during print)      */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <span>Cash Book / Cash Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Daily cash receipts, customer cash tenders, change returned, and net counter cash drawer totals.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer hover:border-amber-400"
          title="Print official standard A4 cash book report"
        >
          <Printer className="w-4 h-4 text-slate-700" />
          <span>Print Cash Report (A4)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. EXECUTIVE FINANCIAL SUMMARY STRIP (Dual Screen & Print)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2.5 print:my-3">
        
        {/* Net Cash In Drawer */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Net Cash Revenue
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1 print:text-base print:text-emerald-800 print:mt-0.5">
            {currency}{totalCashBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Net cash settled in drawer
          </span>
        </div>

        {/* Total Cash Received */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Cash Tendered (Handed In)
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1 print:text-base print:text-slate-900 print:mt-0.5">
            {currency}{totalCashTendered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Physical cash handed by clients
          </span>
        </div>

        {/* Change Returned */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Change Returned Back
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1 print:text-base print:text-amber-800 print:mt-0.5">
            {currency}{totalChangeReturned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Change handed back to clients
          </span>
        </div>

        {/* Cash Invoices Count */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Cash Receipts Issued
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1 print:text-base print:text-slate-900 print:mt-0.5">
            {filteredCashSales.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Total cash bills in selected period
          </span>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. FILTER AND SEARCH BAR (Screen only, hidden on print)       */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-xs no-print">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer, vehicle plate..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'All', label: 'All Time' },
            { id: 'Today', label: 'Today' },
            { id: 'Yesterday', label: 'Yesterday' },
            { id: 'ThisWeek', label: 'This Week' },
            { id: 'ThisMonth', label: 'This Month' },
          ].map((period) => {
            const isSelected = dateFilter === period.id;
            return (
              <button
                key={period.id}
                onClick={() => setDateFilter(period.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent'
                }`}
              >
                {period.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* ============================================================== */}
      {/* 5. CASH BOOK LEDGER TABLE (A4 Compliant Layout)                */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs print:rounded-none print:border-slate-300 print:shadow-none print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-left border-collapse print:text-[10px]">
            <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 print:bg-slate-100 print:text-black print:text-[9px] print:border-slate-300">
              <tr>
                <th className="py-3 px-3 text-center w-8 print:py-2 print:px-2">#</th>
                <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Invoice #</th>
                <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Date & Time</th>
                <th className="py-3 px-4 print:py-2 print:px-3">Customer Details</th>
                <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Vehicle Plate</th>
                <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Bill Amount</th>
                <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Cash Recd</th>
                <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Change</th>
                <th className="py-3 px-4 text-right font-black print:py-2 print:px-2 whitespace-nowrap">Net Cash</th>
                <th className="py-3 px-4 text-right no-print">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {filteredCashSales.map((sale, index) => {
                const paid = Number(sale.paid_amount) || Number(sale.total_amount);
                const total = Number(sale.total_amount);
                const change = paid > total ? paid - total : 0;
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors print:break-inside-avoid print:hover:bg-transparent even:bg-slate-50/40 print:even:bg-slate-50/70">
                    <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px] print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-600">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap print:py-1.5 print:px-2.5 print:text-[9.5px] print:text-slate-900">
                      {sale.invoice_no}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap print:py-1.5 print:px-2.5 print:text-[9px]">
                      <span className="font-semibold text-slate-800 block print:text-slate-900">
                        {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 print:text-[8.5px] print:text-slate-500">
                        {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-3 print:whitespace-normal">
                      <div className="font-bold text-slate-900 print:text-[9.5px]">
                        {sale.customer?.name || 'Walk-in Customer'}
                      </div>
                      {sale.customer?.mobile_no && (
                        <div className="text-[11px] text-slate-500 font-mono print:text-[8.5px] print:text-slate-600">
                          {sale.customer.mobile_no}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-2.5">
                      {sale.customer?.vehicle_no ? (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-50 text-amber-900 border border-amber-200 print:border-slate-400 print:bg-transparent print:text-slate-900 print:px-1 print:py-0 print:text-[9px]">
                          {sale.customer.vehicle_no}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic print:text-slate-500 print:text-[9px]">No plate</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 print:py-1.5 print:px-2 print:text-[9.5px]">
                      {currency}{total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 print:py-1.5 print:px-2 print:text-[9.5px]">
                      {currency}{paid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700 font-semibold print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-700">
                      {change > 0 ? `${currency}${change.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap print:py-1.5 print:px-2 print:text-[10px] print:text-black">
                      {currency}{total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap no-print">
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCashSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 print:py-8">
                    No cash transactions recorded for the selected period.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Footer with Summary Totals */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-100/90 print:border-slate-400 text-slate-900">
              <tr className="print:break-inside-avoid">
                <td colSpan={5} className="py-3 px-4 font-black uppercase text-xs tracking-wider print:py-2 print:px-3 print:text-[9.5px]">
                  Total ({filteredCashSales.length} Transactions)
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 print:py-2 print:px-2 print:text-[10px]">
                  {currency}{totalCashBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 print:py-2 print:px-2 print:text-[10px]">
                  {currency}{totalCashTendered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-800 print:py-2 print:px-2 print:text-[10px] print:text-slate-900">
                  {currency}{totalChangeReturned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm whitespace-nowrap print:py-2 print:px-2 print:text-[11px] print:text-black">
                  {currency}{totalCashBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. FORMAL SIGN-OFF & VERIFICATION BLOCK (Print only)          */}
      {/* ============================================================== */}
      <div className="hidden print:block pt-8 mt-6 border-t border-slate-300 print-avoid-break">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-10">
            <div className="h-8"></div>
            <div className="border-t border-slate-500 pt-1.5">
              <p className="text-[11px] font-bold text-slate-900">Cashier / Counter In-Charge</p>
              <p className="text-[9px] text-slate-500">Prepared & Cash Drawer Counted</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-8"></div>
            <div className="border-t border-slate-500 pt-1.5">
              <p className="text-[11px] font-bold text-slate-900">Accounts & Audit Officer</p>
              <p className="text-[9px] text-slate-500">Verified & Reconciled</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-8"></div>
            <div className="border-t border-slate-500 pt-1.5">
              <p className="text-[11px] font-bold text-slate-900">Authorized Signatory</p>
              <p className="text-[9px] text-slate-500">For {tenant?.name || 'Motor Service Garage'}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
          <span>MotoService Pro Auto Care Management System &bull; Official Cash Book Register</span>
          <span>Computer-Generated Report &bull; {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

    </div>
  );
}
