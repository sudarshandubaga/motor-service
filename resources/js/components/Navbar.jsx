import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Receipt,
  LayoutDashboard,
  Package,
  Users,
  History,
  Calendar,
  Lock,
  LogOut,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ShoppingBag,
  Banknote,
  BookOpen,
  Layers,
  BarChart3,
  Settings
} from 'lucide-react';

export default function Navbar({
  currentTab,
  setCurrentTab,
  tenant,
  cartCount = 0,
  onOpenSubscriptionModal = () => { },
  onOpenSettings = () => { },
  onOpenChangePassword = () => { },
  onLogout = () => { },
  onOpenLogin = () => { }
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'master' | 'reports' | null
  const [mobileDropdown, setMobileDropdown] = useState(null); // 'master' | 'reports' | null
  const [currentTime, setCurrentTime] = useState(new Date());

  const navRef = useRef(null);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
        setMobileDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileDropdown(null);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const daysRemaining = tenant?.days_remaining ?? 0;
  const isExpired = tenant?.is_expired ?? false;
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  // Master dropdown items
  const masterItems = [
    {
      id: 'items',
      label: 'Service & Parts',
      subtitle: 'Parts inventory & labor rates',
      icon: Package,
      badge: 'Items'
    },
    {
      id: 'customers',
      label: 'Customers',
      subtitle: 'Client directory & vehicles',
      icon: Users,
      badge: 'Clients'
    },
  ];

  // Reports dropdown items
  const reportItems = [
    {
      id: 'sales',
      label: 'Invoices Archive',
      subtitle: 'Tax invoices & billing history',
      icon: History,
      badge: 'Bills'
    },
    {
      id: 'cashbook',
      label: 'Cash Book',
      subtitle: 'Cash drawer receipts & change',
      icon: Banknote,
      badge: 'Cash'
    },
    {
      id: 'daybook',
      label: 'Day Book',
      subtitle: 'Daily journal & payment audit',
      icon: Calendar,
      badge: 'Daily'
    },
    {
      id: 'ledger',
      label: 'Ledger (By Customer)',
      subtitle: 'Customer balance & statements',
      icon: BookOpen,
      badge: 'Accounts'
    },
  ];

  const isMasterActive = masterItems.some((i) => i.id === currentTab);
  const isReportsActive = reportItems.some((i) => i.id === currentTab);

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-xl text-slate-100 transition-colors"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">

          {/* Brand & Garage Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="relative group cursor-pointer"
              onClick={() => {
                setCurrentTab('dashboard');
                setActiveDropdown(null);
                setMobileDropdown(null);
              }}
              title="Go to Executive Dashboard"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-1 ring-amber-300/40 transform transition-transform group-hover:scale-105">
                <Wrench className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  MotoService <span className="text-amber-400 font-black">Pro</span>
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-xs flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-medium text-slate-300 truncate">{tenant?.name || 'Motor Service Garage'}</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Bar (Desktop Software Hierarchy) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">

            {/* 1. POS Direct Link */}
            <button
              id="menu-pos-btn"
              onClick={() => {
                setCurrentTab('pos');
                setActiveDropdown(null);
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${currentTab === 'pos'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-300/50'
                : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/70'
                }`}
            >
              <Receipt className={`w-4 h-4 ${currentTab === 'pos' ? 'text-slate-950 stroke-[2.5]' : ''}`} />
              <span>POS</span>

              {cartCount > 0 && (
                <span className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black ${currentTab === 'pos' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                  }`}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* 2. Master Dropdown */}
            <div className="relative">
              <button
                id="menu-master-btn"
                onClick={() => setActiveDropdown(activeDropdown === 'master' ? null : 'master')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${isMasterActive
                  ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/80 ring-1 ring-amber-500/30'
                  : activeDropdown === 'master'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <Layers className={`w-4 h-4 ${isMasterActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Master</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'master' ? 'rotate-180 text-amber-400' : ''
                    }`}
                />
                {isMasterActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                )}
              </button>

              {activeDropdown === 'master' && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-slate-900/98 border border-slate-800 shadow-2xl p-1.5 z-50 text-slate-200 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800/60 mb-1">
                    Master Registrations
                  </div>
                  <div className="space-y-0.5">
                    {masterItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentTab(item.id);
                            setActiveDropdown(null);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${isItemActive
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                            }`}
                        >
                          <div className={`p-1.5 rounded-lg ${isItemActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-tight">{item.label}</span>
                            <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Reports Dropdown */}
            <div className="relative">
              <button
                id="menu-reports-btn"
                onClick={() => setActiveDropdown(activeDropdown === 'reports' ? null : 'reports')}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${isReportsActive
                  ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700/80 ring-1 ring-emerald-500/30'
                  : activeDropdown === 'reports'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <BarChart3 className={`w-4 h-4 ${isReportsActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Reports</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'reports' ? 'rotate-180 text-emerald-400' : ''
                    }`}
                />
                {isReportsActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>

              {activeDropdown === 'reports' && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900/98 border border-slate-800 shadow-2xl p-1.5 z-50 text-slate-200 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800/60 mb-1">
                    Accounting & Garage Reports
                  </div>
                  <div className="space-y-0.5">
                    {reportItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentTab(item.id);
                            setActiveDropdown(null);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${isItemActive
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                            }`}
                        >
                          <div className={`p-1.5 rounded-lg ${isItemActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-tight">{item.label}</span>
                            <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.subtitle}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Dashboard */}
            <button
              id="menu-dashboard-btn"
              onClick={() => {
                setCurrentTab('dashboard');
                setActiveDropdown(null);
              }}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${currentTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80 ring-1 ring-slate-600'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </button>

          </nav>

          {/* Right Action: Real-time Clock, Subscription Badge, User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Live Clock / Date Badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold text-slate-200">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-[11px] text-slate-400">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Yearly Subscription Pill */}
            {tenant && (
              <div className="hidden sm:flex items-center">
                {isExpired ? (
                  <button
                    onClick={onOpenSubscriptionModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all shadow-xs cursor-pointer"
                    title="View subscription details"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Expired &bull; Plan Details</span>
                  </button>
                ) : isExpiringSoon ? (
                  <button
                    onClick={onOpenSubscriptionModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all shadow-xs cursor-pointer"
                    title="View subscription details"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{daysRemaining}d left &bull; Plan</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenSubscriptionModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all shadow-xs cursor-pointer"
                    title="View subscription details"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Yearly Active ({daysRemaining}d)</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Settings Icon Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
              title="Garage Settings & Customer Loyalty Points"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer ring-offset-1 ring-offset-slate-950 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 text-xs font-black uppercase shadow-xs">
                  {tenant?.name ? tenant.name.charAt(0) : 'M'}
                </div>
                <div className="hidden md:flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[100px]">
                    {tenant?.name?.split(' ')[0] || 'Garage'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">Admin</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/98 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200 backdrop-blur-2xl animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1 bg-slate-950/60 rounded-xl">
                    <p className="text-xs font-extrabold text-white truncate">{tenant?.name || 'Motor Service Garage'}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{tenant?.email || 'admin@example.com'}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/50">
                      <span className="text-slate-500">Domain:</span>
                      <span className="font-mono text-amber-400 font-bold">{tenant?.domain_name || 'subdomain'}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-semibold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Garage Settings & Points</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenSubscriptionModal();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Subscription Details</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenChangePassword();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Change Password</span>
                    </button>

                    <div className="border-t border-slate-800/80 my-1"></div>

                    <button
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Sub-Bar (Responsive Dropdowns) */}
        <div className="lg:hidden py-2 border-t border-slate-800/80 -mx-4 px-4 bg-slate-950/90">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {/* Mobile POS */}
            <button
              onClick={() => {
                setCurrentTab('pos');
                setMobileDropdown(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${currentTab === 'pos'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:bg-slate-900'
                }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-400">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Master Toggle */}
            <button
              onClick={() => setMobileDropdown(mobileDropdown === 'master' ? null : 'master')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${isMasterActive
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Master</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${mobileDropdown === 'master' ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Reports Toggle */}
            <button
              onClick={() => setMobileDropdown(mobileDropdown === 'reports' ? null : 'reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${isReportsActive
                ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reports</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${mobileDropdown === 'reports' ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Dashboard */}
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                setMobileDropdown(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${currentTab === 'dashboard'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Mobile Master Sub-Menu */}
          {mobileDropdown === 'master' && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1.5 animate-in fade-in">
              {masterItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileDropdown(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left cursor-pointer ${isItemActive
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile Reports Sub-Menu */}
          {mobileDropdown === 'reports' && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1.5 animate-in fade-in">
              {reportItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileDropdown(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left cursor-pointer ${isItemActive
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
