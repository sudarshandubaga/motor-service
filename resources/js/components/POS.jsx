import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  UserPlus,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Car,
  RefreshCw,
  X,
  Check,
  Tag,
  Percent,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  ChevronDown,
  User,
  Phone,
  FileText,
  Coins
} from 'lucide-react';

export default function POS({
  items,
  customers,
  tenant,
  onCompleteSale,
  onQuickAddCustomer,
  isProcessingSale,
  preselectedCustomerId,
  onClearPreselectedCustomer,
  categories: categoriesList = []
}) {
  const currency = tenant?.currency || '₹';

  // Search & Category Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Customer selection & Searchable Combobox State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Add Customer inline modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile_no: '',
    email: '',
    address: '',
    vehicle_no: '',
    vehicle_model: '',
  });

  // Sync preselected customer from external tabs (e.g., Customer Directory)
  useEffect(() => {
    if (preselectedCustomerId) {
      setSelectedCustomerId(String(preselectedCustomerId));
    }
  }, [preselectedCustomerId]);

  // Cart state: array of { item, quantity, unit_price }
  const [cart, setCart] = useState([]);  // Discount & Notes & Loyalty Points
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [notes, setNotes] = useState('');

  // Payment method & cash tendered
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');

  // Reset points redeemed when customer changes
  useEffect(() => {
    setPointsRedeemed(0);
  }, [selectedCustomerId]);

  // Extract unique categories with item counts
  const categoryStats = useMemo(() => {
    const counts = { All: items.filter((it) => it.is_active !== false).length };
    items.forEach((it) => {
      if (it.is_active !== false && it.category) {
        counts[it.category] = (counts[it.category] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const categories = useMemo(() => {
    const fromItems = Object.keys(categoryStats);
    const fromProps = (categoriesList || []).map((c) => c.name);
    return Array.from(new Set([...fromItems, ...fromProps]));
  }, [categoryStats, categoriesList]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchCat = selectedCategory === 'All' || it.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        it.name?.toLowerCase().includes(term) ||
        (it.short_name && it.short_name.toLowerCase().includes(term)) ||
        (it.category && it.category.toLowerCase().includes(term));
      return matchCat && matchSearch && it.is_active !== false;
    });
  }, [items, selectedCategory, searchTerm]);

  // Filtered customers for searchable dropdown
  const filteredDropdownCustomers = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 30);
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.mobile_no && c.mobile_no.includes(q)) ||
        (c.vehicle_no && c.vehicle_no.toLowerCase().includes(q)) ||
        (c.vehicle_model && c.vehicle_model.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [customers, clientSearchQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          unit_price: Number(item.price),
          gst_percent: Number(item.gst_percent ?? 18),
        },
      ];
    });
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.item.id === itemId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPointsRedeemed(0);
    setNotes('');
    setPaidAmount('');
    if (onClearPreselectedCustomer) onClearPreselectedCustomer();
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const customerAvailablePoints = Number(selectedCustomer?.points || 0);
  const maxRedeemablePoints = Math.min(customerAvailablePoints, subtotal);
  const ptsRedeemed = Math.min(Number(pointsRedeemed) || 0, maxRedeemablePoints);
  const ptsDiscount = ptsRedeemed; // 1 point = ₹1
  const manualDiscount = Number(discountAmount) || 0;
  const totalDiscount = manualDiscount + ptsDiscount;

  // Auto-calculate GST according to each line item's GST % without point discount deduction
  const taxAmount = useMemo(() => {
    const rawTax = cart.reduce((acc, curr) => {
      const lineSub = curr.unit_price * curr.quantity;
      const lineGst = Number(curr.item.gst_percent ?? 18);
      return acc + (lineSub * lineGst) / 100;
    }, 0);
    return Math.round(rawTax * 100) / 100;
  }, [cart]);

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const grandTotal = Math.max(0, Math.round((taxableAmount + taxAmount) * 100) / 100);

  // Projected points earned on subtotal (exclusive GST)
  const projectedPointsEarned = useMemo(() => {
    if (!selectedCustomer) return 0;
    const ptPct = Number(tenant?.point_percentage ?? 0);
    if (ptPct <= 0) return 0;
    return Math.round(((subtotal * ptPct) / 100) * 10) / 10;
  }, [selectedCustomer, tenant?.point_percentage, subtotal]);

  const changeDue = useMemo(() => {
    const paid = Number(paidAmount);
    if (!paid || paid < grandTotal) return 0;
    return paid - grandTotal;
  }, [paidAmount, grandTotal]);

  const handleApplyDiscountPercent = (pct) => {
    const calculated = (subtotal * pct) / 100;
    setDiscountAmount(Math.round(calculated));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const payload = {
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      items: cart.map((i) => {
        const lineSub = i.unit_price * i.quantity;
        const lineGst = Number(i.item.gst_percent ?? 18);
        const lineTax = Math.round(((lineSub * lineGst) / 100) * 100) / 100;
        return {
          item_id: i.item.id,
          item_name: i.item.name,
          short_name: i.item.short_name || null,
          unit_price: i.unit_price,
          quantity: i.quantity,
          gst_percent: lineGst,
          tax_amount: lineTax,
          total_price: lineSub,
        };
      }),
      subtotal,
      discount_amount: manualDiscount,
      points_redeemed: ptsRedeemed,
      points_discount: ptsDiscount,
      tax_amount: taxAmount,
      total_amount: grandTotal,
      payment_method: paymentMethod,
      paid_amount: paidAmount ? Number(paidAmount) : grandTotal,
      notes,
    };

    onCompleteSale(payload, () => {
      clearCart();
    });
  };

  const handleCreateQuickCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.vehicle_no) {
      alert('Customer name and vehicle registration plate are required.');
      return;
    }

    const created = await onQuickAddCustomer(newCustomer);
    if (created) {
      setSelectedCustomerId(String(created.id));
      setClientSearchQuery('');
      setIsClientDropdownOpen(false);
      setIsCustomerModalOpen(false);
      setNewCustomer({
        name: '',
        mobile_no: '',
        email: '',
        address: '',
        vehicle_no: '',
        vehicle_model: '',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      
      {/* LEFT: Item & Service Catalog (Fills wide screens with 7 to 8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Search & Categories Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-xs">
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services, spare parts, or code (e.g. OIL-SYN, BRAKE, AC, FILTER)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</span>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count = categoryStats[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Item Cards Grid - Fully fills screen width (2, 3, or 4 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const inCart = cart.find((i) => i.item.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  inCart
                    ? 'bg-amber-50/80 border-amber-400/90 shadow-sm ring-1 ring-amber-400/30'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {item.short_name ? (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
                        {item.short_name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">Service</span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {item.category || 'General'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                    {item.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 font-mono">
                      <span>GST {Number(item.gst_percent ?? 18)}%</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Unit Rate</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {currency}{Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      inCart
                        ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/20'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{inCart ? `Add (${inCart.quantity})` : 'Add'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No services or parts match "{searchTerm}"</p>
              <p className="text-slate-400 mt-1">Try another keyword or select "All" categories.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: Live Bill & POS Checkout Register (Pinned on widescreen) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative sticky top-16">
        
        <div className="space-y-4">
          
          {/* Header of Bill Register */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/20">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm tracking-tight">Active Bill Register</h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in current ticket
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Selection with SEARCHABLE CLIENT DROPDOWN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                Client & Vehicle Record
              </span>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Quick Add</span>
              </button>
            </div>

            {selectedCustomer ? (
              /* Selected Customer Card */
              <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs truncate">
                        {selectedCustomer.name}
                      </span>
                      {selectedCustomer.vehicle_no && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-[10px] tracking-wider uppercase shadow-xs">
                          {selectedCustomer.vehicle_no}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {selectedCustomer.vehicle_model && <span>{selectedCustomer.vehicle_model} &bull; </span>}
                      <span className="font-mono">{selectedCustomer.mobile_no || 'No contact number'}</span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded text-[10px]">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>{Number(selectedCustomer.points || 0).toFixed(1)} Pts ({currency}{Number(selectedCustomer.points || 0).toFixed(2)})</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCustomerId('');
                    setClientSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
                  title="Change customer"
                >
                  <span>Change</span>
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ) : (
              /* Interactive Searchable Client Combobox Dropdown */
              <div className="relative" ref={clientDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    placeholder="Search client by name, mobile, vehicle plate..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-20 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {clientSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setClientSearchQuery('')}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Search Results Dropdown Menu */}
                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in zoom-in-95">
                    
                    {/* Walk-in Customer (Guest) Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setClientSearchQuery('');
                        setIsClientDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-900 text-slate-600 flex items-center justify-center font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 block">
                            Walk-in Customer (Guest Ticket)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Immediate billing without saved vehicle record
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                        Guest
                      </span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    {/* Filtered Clients List */}
                    {filteredDropdownCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(String(c.id));
                          setClientSearchQuery('');
                          setIsClientDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 text-left transition-colors cursor-pointer group border border-transparent hover:border-amber-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate group-hover:text-amber-900">
                                {c.name}
                              </span>
                              {c.vehicle_no && (
                                <span className="px-2 py-0.2 rounded font-mono font-black text-[10px] bg-amber-100 text-amber-950 border border-amber-300">
                                  {c.vehicle_no}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              {c.vehicle_model && <span>{c.vehicle_model} &bull; </span>}
                              <span className="font-mono">{c.mobile_no || 'No mobile listed'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-800">
                            Select &rarr;
                          </span>
                        </div>
                      </button>
                    ))}

                    {filteredDropdownCustomers.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                        <p>No client found matching "{clientSearchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClientDropdownOpen(false);
                            setIsCustomerModalOpen(true);
                            setNewCustomer((prev) => ({
                              ...prev,
                              name: isNaN(clientSearchQuery) ? clientSearchQuery : '',
                              vehicle_no: !isNaN(clientSearchQuery) ? '' : clientSearchQuery.toUpperCase(),
                              mobile_no: !isNaN(clientSearchQuery) ? clientSearchQuery : ''
                            }));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                        >
                          + Register "{clientSearchQuery}" as New Client
                        </button>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsClientDropdownOpen(false);
                          setIsCustomerModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-amber-700 hover:text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Register New Customer</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-64 xl:max-h-72 2xl:max-h-80 overflow-y-auto pr-1">
            {cart.map(({ item, quantity, unit_price }) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    {item.short_name && (
                      <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-1 rounded text-[10px]">
                        {item.short_name}
                      </span>
                    )}
                    <span className="font-mono">{currency}{unit_price.toFixed(2)} each</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                      GST {Number(item.gst_percent ?? 18)}%
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                  <button
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-slate-900 w-5 text-center font-mono">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right shrink-0 w-24">
                  <span className="font-mono font-black text-slate-900 text-xs block">
                    {currency}{(unit_price * quantity).toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 block">
                    Incl. GST: {currency}{((unit_price * quantity) * (1 + Number(item.gst_percent ?? 18) / 100)).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                  title="Remove from bill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4 space-y-2">
                <Receipt className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">The bill is currently empty</p>
                <p className="text-[11px] text-slate-400">
                  Select services or spare parts from the catalog on the left to add to invoice.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Bill Calculations & Payment Options */}
        <div className="border-t border-slate-200/90 pt-4 mt-4 space-y-4">
          
          {/* Subtotal, Discount & Tax Inputs */}
          <div className="space-y-2 text-xs text-slate-600 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Items Subtotal (Exclusive GST):</span>
              <span className="font-mono font-bold text-slate-900">{currency}{subtotal.toFixed(2)}</span>
            </div>

            {/* Loyalty Points Redemption (1 pt = ₹1) */}
            {selectedCustomer && customerAvailablePoints > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60 bg-amber-500/10 -mx-3.5 px-3.5 py-2.5 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-950 font-bold text-xs">
                      Redeem Points ({customerAvailablePoints.toFixed(1)} pts avail):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={maxRedeemablePoints}
                      step="1"
                      value={pointsRedeemed || ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Math.min(maxRedeemablePoints, Math.max(0, Number(e.target.value) || 0));
                        setPointsRedeemed(val);
                      }}
                      className="w-20 bg-white border border-amber-300 rounded-lg px-2 py-1 text-right font-mono text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setPointsRedeemed(pointsRedeemed > 0 ? 0 : maxRedeemablePoints)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {pointsRedeemed > 0 ? 'Clear' : 'Redeem Max'}
                    </button>
                  </div>
                </div>
                {ptsRedeemed > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold pt-0.5">
                    <span>Points Discount (1 pt = {currency}1):</span>
                    <span className="font-mono font-bold">-{currency}{ptsDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* General Discount with Quick % Buttons */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">General Discount ({currency}):</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-right font-mono text-slate-900 text-xs focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyDiscountPercent(pct)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-300 cursor-pointer"
                  >
                    {pct === 0 ? 'Clear' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Calculated GST Tax Breakdown (Point discount reflects on subtotal without reflecting GST amount) */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-bold">Total GST Tax:</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (Itemized)
                </span>
              </div>
              <span className="font-mono font-bold text-amber-800">
                +{currency}{taxAmount.toFixed(2)}
              </span>
            </div>

            {/* Projected Points Earned on this invoice for customer */}
            {projectedPointsEarned > 0 && (
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs text-amber-800 font-semibold bg-amber-50/50 -mx-3.5 px-3.5 py-1.5 rounded-b-xl">
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>Customer Earns on Subtotal:</span>
                </div>
                <span className="font-mono font-black">+{projectedPointsEarned} pts ({currency}{projectedPointsEarned.toFixed(2)})</span>
              </div>
            )}
          </div>

          {/* Grand Total Ribbon */}
          <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                Total Payable
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Net Bill Amount
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {currency}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
              Select Payment Method
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'UPI', icon: QrCode },
                { id: 'Card', icon: CreditCard },
                { id: 'Bank Transfer', icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="truncate">{m.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered & Change calculation */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cash Received:</label>
                  <input
                    type="number"
                    placeholder={grandTotal.toFixed(2)}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Change Due:</span>
                  <div className="text-emerald-700 font-mono font-black text-sm py-1">
                    {currency}{changeDue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold">Quick:</span>
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: `${currency}500`, val: 500 },
                  { label: `${currency}1000`, val: 1000 },
                  { label: `${currency}2000`, val: 2000 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaidAmount(String(item.val))}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-700 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes field */}
          <input
            type="text"
            placeholder="Service notes, vehicle odometer / km, or mechanic remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
          />

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessingSale}
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              cart.length === 0 || isProcessingSale
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 ring-1 ring-amber-300/60 transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isProcessingSale ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing & Generating Bill...</span>
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Complete Bill &bull; {currency}{grandTotal.toFixed(2)}</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Quick Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Register Customer & Vehicle</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={newCustomer.mobile_no}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mobile_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Vehicle Number Plate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 12 AB 1234"
                    value={newCustomer.vehicle_no}
                    onChange={(e) => setNewCustomer({ ...newCustomer, vehicle_no: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maruti Swift / Hyundai i20"
                    value={newCustomer.vehicle_model}
                    onChange={(e) => setNewCustomer({ ...newCustomer, vehicle_model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
