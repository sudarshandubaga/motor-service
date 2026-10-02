import React from 'react';
import {
  Printer,
  X,
  Car,
  Receipt,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  Wrench,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function InvoiceReceiptModal({ sale, tenant, onClose }) {
  if (!sale) return null;

  const currency = tenant?.currency || '₹';
  const customer = sale.customer;
  const items = sale.items || [];

  const handlePrint = () => {
    const printContent = document.getElementById('printable-receipt');
    if (!printContent) {
      window.print();
      return;
    }

    try {
      // Create an isolated hidden print iframe to prevent modal backdrop or overflow from blocking print
      let printFrame = document.getElementById('a4-print-iframe');
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'a4-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      // Collect all current document styles and links
      const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((tag) => tag.outerHTML)
        .join('\n');

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Tax Invoice - ${sale.invoice_no}</title>
            ${styleTags}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              html, body {
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-receipt {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: visible !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body class="bg-white text-slate-900 font-sans antialiased">
            <div id="printable-receipt">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          console.warn('Iframe print error, falling back to window.print:', err);
          window.print();
        }
      }, 300);
    } catch (e) {
      console.warn('Print initialization error, falling back to window.print:', e);
      window.print();
    }
  };

  const invoiceDate = sale.created_at ? new Date(sale.created_at) : new Date();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 print-modal-container">

        {/* Top Control Bar (Dark Header for Modal - Hidden in Print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between no-print text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Tax Invoice #{sale.invoice_no}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Settled & Paid</span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Standard A4 Format Tax Invoice & Service Bill</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Container */}
        <div
          id="printable-receipt"
          className="p-6 sm:p-10 text-slate-900 bg-white space-y-6 max-w-full text-xs font-sans print:p-0 print:m-0 print:space-y-4"
        >

          {/* A4 INVOICE SHEET (with crisp borders) */}
          <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 print:border-slate-800 print:rounded-none print:p-6 print:space-y-4">

            {/* Header: Garage Branding & Tax Invoice Box */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 print:pb-4 print:border-slate-400">

              {/* Left: Garage Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black print:border print:border-black">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                      {tenant?.name || 'Motor Service Garage'}
                    </h1>
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                      Multi-Brand Automobile Care & Diagnostic Center
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed">
                  {tenant?.address || 'Main Road, Automobile Complex, Service Lane'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-mono pt-0.5">
                  {tenant?.phone && <span><strong>Phone:</strong> {tenant.phone}</span>}
                  {tenant?.email && <span><strong>Email:</strong> {tenant.email}</span>}
                  <span><strong>Domain:</strong> {tenant?.domain_name}</span>
                </div>
              </div>

              {/* Right: Invoice Particulars Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[240px] text-xs space-y-1.5 print:bg-white print:border-slate-400">
                <div className="bg-slate-950 text-white font-black text-center py-1 rounded text-xs uppercase tracking-widest print:bg-slate-200 print:text-black print:border print:border-black">
                  TAX INVOICE
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-semibold">Invoice No:</span>
                  <span className="font-mono font-black text-amber-700 text-sm">{sale.invoice_no}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Date of Issue:</span>
                  <span className="font-mono font-medium">{invoiceDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Issue Time:</span>
                  <span className="font-mono font-medium">{invoiceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Payment Mode:</span>
                  <span className="font-bold text-slate-900 uppercase font-mono">{sale.payment_method}</span>
                </div>
              </div>

            </div>

            {/* Customer & Vehicle Information Grid (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

              {/* Box 1: Billed To / Vehicle Details */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block border-b border-slate-200 pb-1">
                  Customer & Vehicle Details (Billed To)
                </span>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Customer Name:</span>
                    <strong className="text-slate-950 text-sm">{customer?.name || 'Walk-in Customer'}</strong>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-mono font-semibold">{customer?.mobile_no || '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-slate-500">Vehicle Plate:</span>
                    {customer?.vehicle_no ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono font-black text-xs bg-amber-400 text-slate-950 border border-amber-500 print:bg-slate-200 print:border-black">
                        {customer.vehicle_no}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not registered</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Vehicle Model:</span>
                    <span className="font-semibold text-slate-800">{customer?.vehicle_model || '—'}</span>
                  </div>
                  {customer?.address && (
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Address:</span>
                      <span className="text-slate-700 truncate max-w-[200px]">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Workshop & Job Summary */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block border-b border-slate-200 pb-1">
                  Job Reference & Workshop Details
                </span>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Workshop Center:</span>
                    <span className="font-bold text-slate-900">{tenant?.name || 'Authorized Service'}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Job Ticket Ref:</span>
                    <span className="font-mono text-slate-800">JOB-{sale.invoice_no}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-extrabold text-emerald-700 uppercase">Paid in Full</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-500">Billing Counter:</span>
                    <span className="font-medium text-slate-700">Terminal 01</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Line Items Table (Structured A4 Format) */}
            {/* Line Items Table (Structured A4 Format) */}
            <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300 print:bg-slate-200 print:border-slate-400">
                  <tr>
                    <th rowSpan={2} className="py-2.5 px-2 w-8 text-center border border-slate-300">#</th>
                    <th rowSpan={2} className="py-2.5 px-2.5 border border-slate-300">Service / Spare Part Item</th>
                    <th rowSpan={2} className="py-2.5 px-2 w-20 text-center border border-slate-300">Code</th>
                    <th rowSpan={2} className="py-2.5 px-2 w-14 text-center border border-slate-300">Qty</th>
                    <th rowSpan={2} className="py-2.5 px-2 w-20 text-right border border-slate-300">Unit Rate</th>
                    <th rowSpan={2} className="py-2.5 px-2.5 w-22 text-right border border-slate-300">Amount</th>
                    <th colSpan={2} className="py-2.5 px-2 w-16 text-center border border-slate-300">GST</th>
                    <th rowSpan={2} className="py-2.5 px-2.5 w-32 text-right font-black bg-slate-200/70 print:bg-slate-300/80">Subtotal (Amount inclusive GST)</th>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-2 w-16 text-center border border-slate-300">%</th>
                    <th className="py-2.5 px-2 w-16 text-center border border-slate-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                  {items.map((item, idx) => {
                    const lineSubtotal = Number(item.total_price || (item.unit_price * item.quantity));
                    const lineTax = item.tax_amount ? Number(item.tax_amount) : (lineSubtotal * Number(item.gst_percent ?? 18)) / 100;
                    const subtotalWithGst = lineSubtotal + lineTax;

                    return (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-2.5">
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-amber-800 font-semibold">
                          {item.short_name || '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {currency}{Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-slate-700">
                          {currency}{lineSubtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                          {Number(item.gst_percent ?? 18)}%
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                          {Number(lineTax).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950 bg-slate-50/80 print:bg-transparent">
                          {currency}{subtotalWithGst.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        No itemized services listed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Remarks (2 Columns) */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">

              {/* Left: Notes & Remarks */}
              <div className="flex-1 space-y-3">
                {sale.notes ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 print:bg-white print:border-slate-300">
                    <span className="font-bold text-slate-600 block text-[11px] mb-1">
                      Service Notes / Mechanic Observations:
                    </span>
                    <p className="leading-relaxed">{sale.notes}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 print:bg-white print:border-slate-300">
                    <span className="font-bold text-slate-600 block text-[11px] mb-0.5">
                      Service Undertaking:
                    </span>
                    <p className="text-[11px]">
                      Vehicle maintenance and repair services executed as per standard workshop specifications.
                    </p>
                  </div>
                )}

                {/* Loyalty Points Earning Badge */}
                {Number(sale.points_earned) > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/80 text-xs flex items-center justify-between print:border-slate-400 print:bg-white">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>⭐</span>
                      <span>Reward Points Earned on this Invoice:</span>
                    </span>
                    <span className="font-mono font-black text-amber-700">
                      +{Number(sale.points_earned).toFixed(1)} pts ({currency}{Number(sale.points_earned).toFixed(2)})
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p><strong>Payment Mode:</strong> {sale.payment_method}</p>
                  {sale.paid_amount && (
                    <p><strong>Tendered Amount:</strong> {currency}{Number(sale.paid_amount).toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Right: Calculations Box */}
              <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 print:bg-white print:border-slate-400">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal (Exclusive GST):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {currency}{Number(sale.subtotal).toFixed(2)}
                  </span>
                </div>

                {Number(sale.points_discount || sale.points_redeemed) > 0 && (
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Points Redeemed ({Number(sale.points_redeemed).toFixed(0)} pts):</span>
                    <span className="font-mono font-bold">
                      -{currency}{Number(sale.points_discount || sale.points_redeemed).toFixed(2)}
                    </span>
                  </div>
                )}

                {Number(sale.discount_amount) > Number(sale.points_discount || 0) && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>General Discount:</span>
                    <span className="font-mono font-bold">
                      -{currency}{(Number(sale.discount_amount) - Number(sale.points_discount || 0)).toFixed(2)}
                    </span>
                  </div>
                )}

                {Number(sale.tax_amount) > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total GST Tax:</span>
                    <span className="font-mono font-semibold">
                      +{currency}{Number(sale.tax_amount).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-baseline print:border-black">
                  <span className="text-sm font-black text-slate-950 uppercase">Grand Total:</span>
                  <span className="text-xl font-mono font-black text-amber-700 print:text-black">
                    {currency}{Number(sale.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Warranty & Terms Clauses */}
            <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 space-y-1 leading-relaxed print:border-slate-400">
              <span className="font-bold text-slate-700 block uppercase">Terms & Workshop Policy:</span>
              <p>1. Warranty on spare parts is governed by respective manufacturers. Electrical parts carry no warranty.</p>
              <p>2. Workshop service labor guarantee is valid for 30 days or 1,000 km from the date of invoice.</p>
              <p>3. Vehicle was tested, inspected, and delivered in satisfactory operating condition.</p>
            </div>

            {/* Authorized Signatures & Seal Section */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 print:border-slate-400 print:pt-6">
              <div className="text-center">
                <div className="h-12 border-b border-dashed border-slate-300 print:border-slate-500"></div>
                <span className="text-[11px] font-bold text-slate-700 block mt-2">Customer Signature</span>
                <span className="text-[9px] text-slate-400">Vehicle Received in Good Order</span>
              </div>

              <div className="text-center">
                <div className="h-12 border-b border-dashed border-slate-300 print:border-slate-500"></div>
                <span className="text-[11px] font-bold text-slate-700 block mt-2">Authorized Signatory</span>
                <span className="text-[9px] text-slate-400">For {tenant?.name || 'Motor Service Garage'}</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2 text-[10px] text-slate-400 font-mono">
              <span>This is a computer generated tax invoice &bull; Page 1 of 1</span>
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print A4 Invoice</span>
          </button>
        </div>

      </div>
    </div>
  );
}
