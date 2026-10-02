import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Percent,
  Coins,
  Store,
  Phone,
  MapPin,
  DollarSign,
  Save,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Receipt
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  tenant,
  onSaveSettings = () => {},
  isSaving = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currency: '₹',
    point_percentage: 0,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        currency: tenant.currency || '₹',
        point_percentage: Number(tenant.point_percentage ?? 0),
      });
    }
  }, [tenant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings({
      ...formData,
      point_percentage: Number(formData.point_percentage) || 0,
    });
  };

  const sampleSubtotal = 1000;
  const samplePointsEarned = ((sampleSubtotal * (Number(formData.point_percentage) || 0)) / 100).toFixed(1);
  const sampleRupeeValue = Number(samplePointsEarned).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center ring-1 ring-amber-500/20">
              <Settings className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">
                System & Garage Settings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure customer loyalty points, billing preferences & business profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">

          {/* SECTION 1: Customer Loyalty Points System */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500 text-slate-950">
                  <Coins className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Customer Reward Points Program
                  </h4>
                  <span className="text-[11px] font-bold text-amber-800">
                    1 Point = {formData.currency || '₹'}1 Discount
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-900 border border-amber-400/50">
                Auto-Credit on POS
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-slate-800 font-bold block text-xs">
                Point Percentage (1 point = {formData.currency || '₹'}1) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 5 (5% = 50 pts on ₹1,000 subtotal)"
                  value={formData.point_percentage}
                  onChange={(e) => setFormData({ ...formData, point_percentage: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-slate-950 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10 shadow-xs"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold">
                  %
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                When an invoice is generated for a customer, reward points are automatically calculated and credited on the bill’s <strong>subtotal (exclusive of GST)</strong>.
              </p>
            </div>

            {/* Live Calculation Preview */}
            <div className="p-3 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-slate-700 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Example Billing Calculation:</span>
              </div>
              <p className="text-slate-600 leading-normal">
                If subtotal is <span className="font-mono font-bold text-slate-900">{formData.currency}1,000.00</span> (exclusive of GST) at <span className="font-mono font-bold text-amber-700">{formData.point_percentage || 0}%</span>:
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-slate-800 font-medium">
                <span>Customer Earns:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{samplePointsEarned} Points ({formData.currency}{sampleRupeeValue} discount on future bills)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[10px] pt-0.5">
                <span>Redemption Rule:</span>
                <span className="text-slate-700 font-semibold">
                  Reflects directly on subtotal without reducing GST
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Garage Workshop Profile */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-600" />
              <span>Garage Business Information</span>
            </h4>

            <div>
              <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                Garage / Workshop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                  Billing Currency Symbol
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                Workshop Address
              </label>
              <textarea
                rows={2}
                placeholder="Shop No., Street, City, State, PIN"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Settings...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
