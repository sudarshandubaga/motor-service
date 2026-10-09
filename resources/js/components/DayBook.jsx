import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Receipt,
  Search,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  TrendingUp,
  Percent,
  Clock,
  Car,
  FileSpreadsheet,
  X,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { printReport } from '../utils/printReport';

export default function DayBook({
  sales = [],
  tenant,
  onViewInvoice = () => {}
}) {
  const currency = tenant?.currency || '₹';

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter sales for the selected date and optional search term
  const filteredDaySales = useMemo(() => {
    return sales.filter((s) => {
      if (!s.created_at) return false;
      const sDateStr = new Date(s.created_at).toISOString().split('T')[0];
      if (sDateStr !== selectedDate) return false;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      return (
        s.invoice_no?.toLowerCase().includes(q) ||
        (s.customer && s.customer.name?.toLowerCase().includes(q)) ||
        (s.customer && s.customer.mobile_no && s.customer.mobile_no.includes(q)) ||
        (s.customer && s.customer.vehicle_no && s.customer.vehicle_no.toLowerCase().includes(q)) ||
        (s.payment_method && s.payment_method.toLowerCase().includes(q))
      );
    });
  }, [sales, selectedDate, searchTerm]);

  // Aggregate day financial metrics
  const dayGrossSubtotal = useMemo(() => {
    return filteredDaySales.reduce((acc, curr) => acc + Number(curr.subtotal || curr.total_amount || 0), 0);
  }, [filteredDaySales]);

  const dayDiscountTotal = useMemo(() => {
    return filteredDaySales.reduce((acc, curr) => acc + Number(curr.discount_amount || 0), 0);
  }, [filteredDaySales]);

  const dayTaxTotal = useMemo(() => {
    return filteredDaySales.reduce((acc, curr) => acc + Number(curr.tax_amount || 0), 0);
  }, [filteredDaySales]);

  const dayNetTotal = useMemo(() => {
    return filteredDaySales.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  }, [filteredDaySales]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      Cash: { amount: 0, count: 0 },
      UPI: { amount: 0, count: 0 },
      Card: { amount: 0, count: 0 },
      'Bank Transfer': { amount: 0, count: 0 },
    };

    filteredDaySales.forEach((s) => {
      const m = s.payment_method || 'Cash';
      const amt = Number(s.total_amount || 0);
      if (breakdown[m]) {
        breakdown[m].amount += amt;
        breakdown[m].count += 1;
      } else {
        breakdown[m] = { amount: amt, count: 1 };
      }
    });

    return breakdown;
  }, [filteredDaySales]);

  const formattedDateTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handlePrint = () => {
    printReport({
      elementId: 'daybook-printable-area',
      title: `DayBook_${selectedDate}`,
      orientation: 'portrait'
    });
  };

  return (
    <div id="daybook-printable-area" className="space-y-6">
      
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
              <span><strong>Station Domain:</strong> {tenant?.domain_name || 'Main Branch'}</span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl p-3 min-w-[240px] text-right bg-slate-50/80">
            <div className="text-xs font-black uppercase tracking-widest text-slate-950 bg-slate-200/90 py-1 px-2 rounded mb-1.5 text-center border border-slate-300">
              DAY BOOK / SALES JOURNAL
            </div>
            <div className="text-[10px] text-slate-700 space-y-1 font-medium text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Journal Date:</span>
                <span className="font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Day:</span>
                <span className="font-semibold text-slate-800">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Generated:</span>
                <span className="font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Invoices:</span>
                <span className="font-mono font-bold text-slate-900">{filteredDaySales.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. ON-SCREEN HEADER & DATE SELECTOR (Hidden in Print)          */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span>Day Book / Daily Sales Journal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Chronological register of all services billed and payments recorded for any chosen date.
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-bold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer hover:border-amber-400"
            title="Print official standard A4 day book"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Day Book (A4)</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. DAY OVERVIEW FINANCIAL CARDS (Dual Screen & Print)           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2.5 print:my-3">
        
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Net Day Billing
          </span>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1 print:text-base print:text-slate-950 print:mt-0.5">
            {currency}{dayNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            {filteredDaySales.length} {filteredDaySales.length === 1 ? 'invoice' : 'invoices'} on {new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Gross Subtotal
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1 print:text-base print:text-slate-900 print:mt-0.5">
            {currency}{dayGrossSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Before discounts and taxes
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Discounts Allowed
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1 print:text-base print:text-emerald-800 print:mt-0.5">
            {currency}{dayDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Customer rebates & concessions
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:bg-slate-50/70 print:shadow-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block print:text-[9px] print:text-slate-700">
            Tax / GST Collected
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1 print:text-base print:text-slate-900 print:mt-0.5">
            {currency}{dayTaxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block print:text-[8.5px] print:text-slate-600">
            Total tax billed for the day
          </span>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. PAYMENT METHOD BREAKDOWN STRIP                               */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs print:rounded-lg print:border-slate-300 print:p-2.5 print:my-2.5 print:space-y-1.5 print:shadow-none">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider block print:text-[9.5px]">
          Day Payment Mode Breakdown & Collections
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
          {[
            { id: 'Cash', label: 'Cash', icon: Banknote, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 print:bg-transparent print:border-slate-300 print:text-slate-900' },
            { id: 'UPI', label: 'UPI / QR', icon: QrCode, color: 'text-amber-800 bg-amber-50 border-amber-200 print:bg-transparent print:border-slate-300 print:text-slate-900' },
            { id: 'Card', label: 'Card Swipe', icon: CreditCard, color: 'text-indigo-800 bg-indigo-50 border-indigo-200 print:bg-transparent print:border-slate-300 print:text-slate-900' },
            { id: 'Bank Transfer', label: 'Bank / NEFT', icon: Building, color: 'text-purple-800 bg-purple-50 border-purple-200 print:bg-transparent print:border-slate-300 print:text-slate-900' },
          ].map((mode) => {
            const Icon = mode.icon;
            const data = paymentBreakdown[mode.id] || { amount: 0, count: 0 };
            return (
              <div key={mode.id} className={`p-3 rounded-xl border ${mode.color} print:p-2 print:rounded-md`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold print:text-[9px]">{mode.label}</span>
                  <Icon className="w-4 h-4 opacity-80 print:hidden" />
                </div>
                <div className="text-base font-black font-mono mt-2 print:mt-0.5 print:text-[11px]">
                  {currency}{data.amount.toFixed(2)}
                </div>
                <span className="text-[10px] opacity-80 block mt-0.5 print:text-[8px] print:opacity-100">
                  {data.count} {data.count === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. SEARCH FILTER BAR (Screen only)                             */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between shadow-xs no-print">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer, vehicle or mode..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredDaySales.length}</span> entries for {new Date(selectedDate).toLocaleDateString()}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. DAY JOURNAL TABLE (A4 Compliant Layout)                     */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs print:rounded-none print:border-slate-300 print:shadow-none print:overflow-visible">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between no-print">
          <h2 className="font-extrabold text-sm text-slate-900">
            Day Journal Entries ({filteredDaySales.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {formattedDateTitle}
          </span>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-left border-collapse print:text-[10px]">
            <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 print:bg-slate-100 print:text-black print:text-[9px] print:border-slate-300">
              <tr>
                <th className="py-3 px-3 text-center w-8 print:py-2 print:px-2">#</th>
                <th className="py-3 px-4 print:py-2 print:px-2 whitespace-nowrap">Time</th>
                <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Invoice #</th>
                <th className="py-3 px-4 print:py-2 print:px-3">Customer Details</th>
                <th className="py-3 px-4 print:py-2 print:px-2 whitespace-nowrap">Vehicle Plate</th>
                <th className="py-3 px-4 print:py-2 print:px-3">Particulars</th>
                <th className="py-3 px-4 print:py-2 print:px-2 whitespace-nowrap">Mode</th>
                <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Subtotal</th>
                <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Discount</th>
                <th className="py-3 px-4 text-right font-black print:py-2 print:px-2 whitespace-nowrap">Net Total</th>
                <th className="py-3 px-4 text-right no-print">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {filteredDaySales.map((sale, index) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors print:break-inside-avoid print:hover:bg-transparent even:bg-slate-50/40 print:even:bg-slate-50/70">
                  <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px] print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-600">
                    {index + 1}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap print:py-1.5 print:px-2 print:text-[9px]">
                    {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap print:py-1.5 print:px-2.5 print:text-[9.5px] print:text-slate-900">
                    {sale.invoice_no}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-3 print:whitespace-normal">
                    <span className="font-bold text-slate-900 block print:text-[9.5px]">{sale.customer?.name || 'Walk-in Customer'}</span>
                    {sale.customer?.mobile_no && (
                      <span className="text-[10px] text-slate-500 font-mono print:text-[8.5px] print:text-slate-600">{sale.customer.mobile_no}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-2">
                    {sale.customer?.vehicle_no ? (
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-50 text-amber-900 border border-amber-200 print:border-slate-400 print:bg-transparent print:text-slate-900 print:px-1 print:py-0 print:text-[9px]">
                        {sale.customer.vehicle_no}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic print:text-slate-500 print:text-[9px]">No plate</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate print:py-1.5 print:px-3 print:max-w-none print:whitespace-normal print:text-[9px]">
                    {sale.items && sale.items.length > 0 ? (
                      <span>
                        {sale.items[0].item_name}
                        {sale.items.length > 1 && (
                          <span className="text-amber-700 font-bold ml-1 print:text-slate-900">+{sale.items.length - 1} more</span>
                        )}
                      </span>
                    ) : (
                      'Service bill'
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 print:border-0 print:p-0 print:bg-transparent print:text-slate-900 print:text-[9px]">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700 print:py-1.5 print:px-2 print:text-[9.5px]">
                    {currency}{Number(sale.subtotal || sale.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-700">
                    {Number(sale.discount_amount) > 0 ? `-${currency}${Number(sale.discount_amount).toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap print:py-1.5 print:px-2 print:text-[10px] print:text-black">
                    {currency}{Number(sale.total_amount).toFixed(2)}
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
              ))}

              {filteredDaySales.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 print:py-8">
                    No transactions recorded on {formattedDateTitle}.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table Footer with Summary Totals */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-100/90 print:border-slate-400 text-slate-900">
              <tr className="print:break-inside-avoid">
                <td colSpan={7} className="py-3 px-4 font-black uppercase text-xs tracking-wider print:py-2 print:px-3 print:text-[9.5px]">
                  Day Grand Total ({filteredDaySales.length} Entries)
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 print:py-2 print:px-2 print:text-[10px]">
                  {currency}{dayGrossSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 print:py-2 print:px-2 print:text-[10px] print:text-slate-900">
                  {dayDiscountTotal > 0 ? `-${currency}${dayDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm whitespace-nowrap print:py-2 print:px-2 print:text-[11px] print:text-black">
                  {currency}{dayNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. FORMAL SIGN-OFF & VERIFICATION BLOCK (Print only)          */}
      {/* ============================================================== */}
      <div className="hidden print:block pt-8 mt-6 border-t border-slate-300 print-avoid-break">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-10">
            <div className="h-8"></div>
            <div className="border-t border-slate-500 pt-1.5">
              <p className="text-[11px] font-bold text-slate-900">Prepared By (Counter Executive)</p>
              <p className="text-[9px] text-slate-500">Day Journal Registered</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-8"></div>
            <div className="border-t border-slate-500 pt-1.5">
              <p className="text-[11px] font-bold text-slate-900">Audited & Verified By</p>
              <p className="text-[9px] text-slate-500">Accounts & Stock Reconciliation</p>
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
          <span>MotoService Pro Auto Care Management System &bull; Official Daily Sales Journal</span>
          <span>Computer-Generated Report &bull; {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

    </div>
  );
}
