import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen,
  Search,
  User,
  Car,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Receipt,
  Printer,
  ChevronDown,
  X,
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { printReport } from '../utils/printReport';

export default function CustomerLedger({
  customers,
  sales,
  tenant,
  onViewInvoice = () => {},
  onBillCustomer = () => {}
}) {
  const currency = tenant?.currency || '₹';

  // Selected customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customers.length > 0 ? String(customers[0].id) : ''
  );

  // Search combobox state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered customers for combobox
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 30);
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.mobile_no && c.mobile_no.includes(q)) ||
        (c.vehicle_no && c.vehicle_no.toLowerCase().includes(q)) ||
        (c.vehicle_model && c.vehicle_model.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [customers, customerSearchQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  // All sales for this specific customer
  const customerSales = useMemo(() => {
    if (!selectedCustomerId) return [];
    return sales
      .filter((s) => s.customer_id === Number(selectedCustomerId))
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)); // Chronological for ledger
  }, [sales, selectedCustomerId]);

  // Aggregate metrics
  const totalBilled = useMemo(() => {
    return customerSales.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
  }, [customerSales]);

  const totalDiscount = useMemo(() => {
    return customerSales.reduce((acc, curr) => acc + Number(curr.discount_amount || 0), 0);
  }, [customerSales]);

  const totalSubtotal = useMemo(() => {
    return customerSales.reduce((acc, curr) => acc + Number(curr.subtotal || curr.total_amount || 0), 0);
  }, [customerSales]);

  const handlePrint = () => {
    printReport({
      elementId: 'customer-ledger-printable-area',
      title: `Statement_${selectedCustomer?.name?.replace(/\s+/g, '_') || 'Customer'}`,
      orientation: 'portrait'
    });
  };

  return (
    <div id="customer-ledger-printable-area" className="space-y-6">

      {/* STANDARD A4 PRINT-ONLY LETTERHEAD & AUDIT HEADER */}
      {selectedCustomer && (
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1 flex-1">
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                {tenant?.name || 'Motor Service Garage'}
              </h1>
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

            <div className="border border-slate-800 rounded-xl p-3 min-w-[240px] text-right bg-slate-50/80">
              <div className="text-xs font-black uppercase tracking-widest text-slate-950 bg-slate-200/90 py-1 px-2 rounded mb-1.5 text-center border border-slate-300">
                STATEMENT OF ACCOUNT
              </div>
              <div className="text-[10px] text-slate-700 space-y-1 font-medium text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Client:</span>
                  <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                </div>
                {selectedCustomer.vehicle_no && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Vehicle:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCustomer.vehicle_no}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Generated:</span>
                  <span className="font-mono">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Customer Account Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Individual statement of account, vehicle repair history, and transaction ledger by customer.
          </p>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBillCustomer(selectedCustomer.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Bill This Client</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer hover:border-amber-400"
              title="Print official standard A4 account statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement (A4)</span>
            </button>
          </div>
        )}
      </div>

      {/* Customer Selector Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs no-print" ref={dropdownRef}>
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
          Select or Search Customer Account
        </label>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={customerSearchQuery}
            onChange={(e) => {
              setCustomerSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.vehicle_no || 'No Plate'})` : 'Type customer name, phone, or vehicle plate...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Results */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(String(c.id));
                    setCustomerSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer border ${
                    selectedCustomerId === String(c.id)
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                      : 'hover:bg-slate-50 border-transparent text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-800 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{c.name}</span>
                        {c.vehicle_no && (
                          <span className="px-2 py-0.2 rounded font-mono font-black text-[10px] bg-amber-100 text-amber-950 border border-amber-300">
                            {c.vehicle_no}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {c.vehicle_model && <span>{c.vehicle_model} &bull; </span>}
                        <span className="font-mono">{c.mobile_no || 'No mobile listed'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400">
                    Open Ledger &rarr;
                  </span>
                </button>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No customer found matching "{customerSearchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedCustomer ? (
        <>
          {/* Customer Profile & Vehicle Header Card (Screen Only) */}
          <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden no-print">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Client Info */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl uppercase shadow-lg shadow-amber-500/20 shrink-0">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-white tracking-tight">{selectedCustomer.name}</h2>
                    {selectedCustomer.vehicle_no && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-xs tracking-wider uppercase shadow-xs">
                        {selectedCustomer.vehicle_no}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    {selectedCustomer.vehicle_model && (
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <Car className="w-3.5 h-3.5 text-amber-400" />
                        <span>{selectedCustomer.vehicle_model}</span>
                      </span>
                    )}
                    {selectedCustomer.mobile_no && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.mobile_no}</span>
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.email}</span>
                      </span>
                    )}
                  </div>
                  {selectedCustomer.address && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary Badges */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 min-w-[130px] text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Lifetime Billed</span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    {currency}{totalBilled.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 min-w-[110px] text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Invoices</span>
                  <span className="text-lg font-black font-mono text-white">
                    {customerSales.length}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 min-w-[110px] text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Balance Due</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    Settled
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* PRINT-ONLY CLIENT ACCOUNT SUMMARY STRIP (Clean black & white A4 Box) */}
          <div className="hidden print:block my-3 p-3 bg-slate-50/90 border border-slate-300 rounded-lg text-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-[10px]">
                <div><span className="text-slate-500 font-semibold">Client Name:</span> <strong className="text-slate-950 font-bold">{selectedCustomer.name}</strong></div>
                {selectedCustomer.mobile_no && <div><span className="text-slate-500 font-semibold">Mobile:</span> <span className="font-mono">{selectedCustomer.mobile_no}</span></div>}
                {selectedCustomer.email && <div><span className="text-slate-500 font-semibold">Email:</span> {selectedCustomer.email}</div>}
                {selectedCustomer.address && <div><span className="text-slate-500 font-semibold">Address:</span> {selectedCustomer.address}</div>}
              </div>
              <div className="space-y-1 text-[10px] text-right">
                {selectedCustomer.vehicle_no && (
                  <div><span className="text-slate-500 font-semibold">Vehicle Reg No:</span> <span className="font-mono font-bold text-slate-950">{selectedCustomer.vehicle_no}</span></div>
                )}
                {selectedCustomer.vehicle_model && (
                  <div><span className="text-slate-500 font-semibold">Vehicle Model:</span> {selectedCustomer.vehicle_model}</div>
                )}
                <div><span className="text-slate-500 font-semibold">Total Lifetime Billed:</span> <span className="font-mono font-bold text-slate-950">{currency}{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div><span className="text-slate-500 font-semibold">Total Invoices:</span> <span className="font-mono font-bold">{customerSales.length} Invoices</span></div>
                <div><span className="text-slate-500 font-semibold">Account Status:</span> <span className="font-bold text-emerald-800 uppercase">Settled (All Cleared)</span></div>
              </div>
            </div>
          </div>

          {/* Ledger Statement Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs print:rounded-none print:border-slate-300 print:shadow-none print:overflow-visible">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between no-print">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Statement of Account ({customerSales.length} Transactions)
                </h3>
                <p className="text-xs text-slate-500">Chronological service orders and payment vouchers</p>
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs text-left border-collapse print:text-[10px]">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 print:bg-slate-100 print:text-black print:text-[9px] print:border-slate-300">
                  <tr>
                    <th className="py-3 px-3 text-center w-8 print:py-2 print:px-2">#</th>
                    <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 print:py-2 print:px-2.5 whitespace-nowrap">Invoice #</th>
                    <th className="py-3 px-4 print:py-2 print:px-3">Services / Parts Provided</th>
                    <th className="py-3 px-4 print:py-2 print:px-2 whitespace-nowrap">Payment Mode</th>
                    <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Subtotal</th>
                    <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Discount</th>
                    <th className="py-3 px-4 text-right print:py-2 print:px-2 whitespace-nowrap">Debit (Billed)</th>
                    <th className="py-3 px-4 text-right font-black print:py-2 print:px-2 whitespace-nowrap">Credit (Paid)</th>
                    <th className="py-3 px-4 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {customerSales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors print:break-inside-avoid print:hover:bg-transparent even:bg-slate-50/40 print:even:bg-slate-50/70">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px] print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-600">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap print:py-1.5 print:px-2.5 print:text-[9px]">
                        <span className="font-semibold text-slate-800 block print:text-slate-900">
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 print:text-[8.5px] print:text-slate-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap print:py-1.5 print:px-2.5 print:text-[9.5px] print:text-slate-900">
                        {sale.invoice_no}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate print:py-1.5 print:px-3 print:max-w-none print:whitespace-normal print:text-[9px]">
                        {sale.items && sale.items.length > 0 ? (
                          <>
                            <span className="print:hidden">
                              {sale.items[0].item_name}
                              {sale.items.length > 1 && (
                                <span className="text-amber-700 font-bold ml-1">+{sale.items.length - 1} items</span>
                              )}
                            </span>
                            <span className="hidden print:inline text-slate-900 font-medium">
                              {sale.items.map((it) => it.item_name).join(', ')}
                            </span>
                          </>
                        ) : (
                          'Service bill'
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap print:py-1.5 print:px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 print:border-0 print:p-0 print:bg-transparent print:text-slate-900 print:text-[9px]">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 print:py-1.5 print:px-2 print:text-[9.5px]">
                        {currency}{Number(sale.subtotal || sale.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 print:py-1.5 print:px-2 print:text-[9.5px] print:text-slate-700">
                        {Number(sale.discount_amount) > 0 ? `-${currency}${Number(sale.discount_amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 print:py-1.5 print:px-2 print:text-[9.5px]">
                        {currency}{Number(sale.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 whitespace-nowrap print:py-1.5 print:px-2 print:text-[10px] print:text-black">
                        {currency}{Number(sale.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap no-print">
                        <button
                          onClick={() => onViewInvoice(sale)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {customerSales.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 print:py-8">
                        No invoices recorded for {selectedCustomer.name} yet. Click "Bill This Client" above to create their first ticket.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Table Footer with Summary Totals */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-100/90 print:border-slate-400 text-slate-900">
                  <tr className="print:break-inside-avoid">
                    <td colSpan={5} className="py-3 px-4 font-black uppercase text-xs tracking-wider print:py-2 print:px-3 print:text-[9.5px]">
                      Account Grand Total ({customerSales.length} Transactions)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 print:py-2 print:px-2 print:text-[10px]">
                      {currency}{totalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 print:py-2 print:px-2 print:text-[10px] print:text-slate-900">
                      {totalDiscount > 0 ? `-${currency}${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 print:py-2 print:px-2 print:text-[10px]">
                      {currency}{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm whitespace-nowrap print:py-2 print:px-2 print:text-[11px] print:text-black">
                      {currency}{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FORMAL SIGN-OFF & VERIFICATION BLOCK (Print only) */}
          <div className="hidden print:block pt-8 mt-6 border-t border-slate-300 print-avoid-break">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="space-y-10">
                <div className="h-8"></div>
                <div className="border-t border-slate-500 pt-1.5">
                  <p className="text-[11px] font-bold text-slate-900">Accountant / Cashier</p>
                  <p className="text-[9px] text-slate-500">Prepared & Audited</p>
                </div>
              </div>
              <div className="space-y-10">
                <div className="h-8"></div>
                <div className="border-t border-slate-500 pt-1.5">
                  <p className="text-[11px] font-bold text-slate-900">Customer Acknowledgment</p>
                  <p className="text-[9px] text-slate-500">Sign & Stamp</p>
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
              <span>MotoService Pro Auto Care Management System &bull; Customer Account Statement</span>
              <span>Computer-Generated Report &bull; {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No Customer Selected</p>
          <p className="text-xs text-slate-400 mt-1">Search and select a customer above to view their statement of account.</p>
        </div>
      )}

    </div>
  );
}
