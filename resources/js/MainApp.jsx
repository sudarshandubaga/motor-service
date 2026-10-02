import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ItemsServices from './components/ItemsServices';
import Customers from './components/Customers';
import SalesHistory from './components/SalesHistory';
import CashBook from './components/CashBook';
import DayBook from './components/DayBook';
import CustomerLedger from './components/CustomerLedger';
import InvoiceReceiptModal from './components/InvoiceReceiptModal';
import AuthModals from './components/AuthModals';
import SubscriptionModal from './components/SubscriptionModal';
import SubscriptionLockScreen from './components/SubscriptionLockScreen';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import {
  RefreshCw,
  Wrench,
  Receipt,
  LayoutDashboard,
  Package,
  Users,
  History,
  TrendingUp,
  Plus,
  Car,
  ShieldCheck,
  Calendar,
  Sparkles,
  Command,
  Banknote,
  BookOpen
} from 'lucide-react';

export default function MainApp() {
  const [currentTab, setCurrentTab] = useState('pos'); // Start directly on POS for swift billing

  // Global State for the active tenant resolved from domain
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cross-module state (e.g. preselect customer when clicking 'Bill Customer' in Directory)
  const [preselectedCustomerId, setPreselectedCustomerId] = useState(null);

  // Modals & Active Invoice
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Loading indicators
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all domain-scoped data
  const fetchData = useCallback(async () => {
    try {
      const meRes = await axios.get('/api/me');
      const currentTenant = meRes.data.tenant;
      setTenant(currentTenant);

      // When subscription is expired, all functionality is locked
      if (currentTenant?.is_expired) {
        setIsLoading(false);
        return;
      }

      const [statsRes, itemsRes, customersRes, salesRes, catsRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/items'),
        axios.get('/api/customers'),
        axios.get('/api/sales'),
        axios.get('/api/categories'),
      ]);

      setStats(statsRes.data);
      setItems(itemsRes.data.items || []);
      setCustomers(customersRes.data || []);
      setSales(salesRes.data.data || salesRes.data || []);
      setCategories(catsRes.data.categories || []);
    } catch (err) {
      console.error('Failed to load application data:', err);
      addToast('Error loading garage data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // POS Sale Operation
  const handleCompleteSale = async (payload, onSuccess) => {
    try {
      setIsProcessingSale(true);
      const res = await axios.post('/api/sales', payload);
      const createdSale = res.data.sale;
      addToast(`Invoice ${createdSale.invoice_no} generated successfully!`);
      setActiveInvoice(createdSale);

      if (onSuccess) onSuccess();

      const [statsRes, salesRes, customersRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/sales'),
        axios.get('/api/customers'),
      ]);
      setStats(statsRes.data);
      setSales(salesRes.data.data || salesRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to process sale', 'error');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Settings Operation (Loyalty Points & Profile)
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleSaveSettings = async (settingsPayload) => {
    try {
      setIsSavingSettings(true);
      const res = await axios.put('/api/settings', settingsPayload);
      setTenant(res.data.tenant);
      addToast('Settings & Point percentage saved successfully!');
      setSettingsModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Item Operations
  const handleSaveItem = async (data, id) => {
    try {
      setIsSavingItem(true);
      if (id) {
        await axios.put(`/api/items/${id}`, data);
        addToast('Service/Item updated successfully');
      } else {
        await axios.post('/api/items', data);
        addToast('New Service/Item created successfully');
      }
      const itemsRes = await axios.get('/api/items');
      setItems(itemsRes.data.items || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save item', 'error');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await axios.delete(`/api/items/${id}`);
      addToast('Service/Item deleted');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete item', 'error');
    }
  };

  // Category Operations
  const handleSaveCategory = async (data, id) => {
    try {
      setIsSavingCategory(true);
      if (id) {
        await axios.put(`/api/categories/${id}`, data);
        addToast('Category updated successfully');
      } else {
        await axios.post('/api/categories', data);
        addToast('New category created successfully');
      }
      const catsRes = await axios.get('/api/categories');
      setCategories(catsRes.data.categories || []);
      const itemsRes = await axios.get('/api/items');
      setItems(itemsRes.data.items || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save category', 'error');
      throw err;
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      setIsSavingCategory(true);
      await axios.delete(`/api/categories/${id}`);
      addToast('Category deleted');
      const catsRes = await axios.get('/api/categories');
      setCategories(catsRes.data.categories || []);
      const itemsRes = await axios.get('/api/items');
      setItems(itemsRes.data.items || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete category', 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Customer Operations
  const handleSaveCustomer = async (data, id) => {
    try {
      setIsSavingCustomer(true);
      if (id) {
        await axios.put(`/api/customers/${id}`, data);
        addToast('Customer updated successfully');
      } else {
        await axios.post('/api/customers', data);
        addToast('Customer created successfully');
      }
      const custRes = await axios.get('/api/customers');
      setCustomers(custRes.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      await axios.delete(`/api/customers/${id}`);
      addToast('Customer removed');
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete customer', 'error');
    }
  };

  const handleQuickAddCustomer = async (customerData) => {
    try {
      const res = await axios.post('/api/customers', customerData);
      addToast(`Customer ${res.data.customer.name} registered!`);
      const custRes = await axios.get('/api/customers');
      setCustomers(custRes.data || []);
      return res.data.customer;
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add customer', 'error');
      return null;
    }
  };

  const handleBillCustomer = (customerId) => {
    setPreselectedCustomerId(customerId);
    setCurrentTab('pos');
    addToast('Customer selected in POS terminal');
  };

  // Auth Operations
  const handleLogin = async (credentials) => {
    try {
      const res = await axios.post('/api/login', credentials);
      addToast('Logged in successfully!');
      await fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
      throw err;
    }
  };

  const handleChangePassword = async (data) => {
    try {
      const res = await axios.post('/api/change-password', data);
      addToast(res.data.message || 'Password changed successfully!');
    } catch (err) {
      const msg = err.response?.data?.errors?.current_password?.[0] ||
                  err.response?.data?.message ||
                  'Failed to change password';
      addToast(msg, 'error');
      throw err;
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      const res = await axios.post('/api/forgot-password', { email });
      addToast(res.data.message || 'Reset token generated!');
      return res.data;
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to process forgot password', 'error');
      throw err;
    }
  };

  const handleResetPassword = async (payload) => {
    try {
      const res = await axios.post('/api/reset-password', payload);
      addToast(res.data.message || 'Password reset successfully!');
      await fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reset password', 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      addToast('Logged out');
      setLoginModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
          <Wrench className="w-8 h-8 animate-bounce stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-2.5 font-bold text-sm text-slate-200">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>Starting {tenant?.name || 'MotoService Pro'} Station...</span>
        </div>
      </div>
    );
  }

  // If subscription is expired, lock down the entire software completely: zero functionality works
  if (tenant?.is_expired) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <SubscriptionLockScreen
          tenant={tenant}
          onRefresh={fetchData}
          onLogout={handleLogout}
          addToast={addToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const currency = tenant?.currency || '₹';

  // Section title helpers
  const tabTitles = {
    pos: { title: 'POS Billing Register', subtitle: 'Fast checkout & receipt counter', icon: Receipt },
    dashboard: { title: 'Executive Overview', subtitle: 'Garage metrics, revenue & activity', icon: LayoutDashboard },
    items: { title: 'Services & Spare Parts', subtitle: 'Labor rates & parts inventory', icon: Package },
    customers: { title: 'Customer Directory', subtitle: 'Vehicle records & contact history', icon: Users },
    sales: { title: 'Invoices Archive', subtitle: 'Searchable sales receipts & tickets', icon: History },
    cashbook: { title: 'Cash Book Register', subtitle: 'Cash receipts, change & drawer accounting', icon: Banknote },
    daybook: { title: 'Daily Sales Day Book', subtitle: 'Day-by-day sales journal & payment mode audit', icon: Calendar },
    ledger: { title: 'Customer Account Ledger', subtitle: 'Individual client billing history & balance statements', icon: BookOpen },
  };

  const ActiveIcon = tabTitles[currentTab]?.icon || Receipt;

  return (
    <div className="min-h-screen bg-slate-100/75 flex flex-col text-slate-900 font-sans">
      
      {/* Top Dark Header Command Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        tenant={tenant}
        onOpenSubscriptionModal={() => setSubscriptionModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenChangePassword={() => setChangePasswordModalOpen(true)}
        onLogout={handleLogout}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Sub-Header Context Bar */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-10 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            
            {/* Section Breadcrumb */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-extrabold text-slate-900">
                  {tabTitles[currentTab]?.title}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-500 hidden md:inline">
                  {tabTitles[currentTab]?.subtitle}
                </span>
              </div>
            </div>

            {/* Quick Stats Pill Strip */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                <span className="text-slate-400 text-[11px]">Today:</span>
                <span className="font-mono font-bold text-amber-700">
                  {currency}{Number(stats?.today_revenue || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                <span className="text-slate-400 text-[11px]">Invoices:</span>
                <span className="font-mono font-bold text-slate-900">
                  {stats?.today_sales_count || 0}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                <span className="text-slate-400 text-[11px]">Clients:</span>
                <span className="font-mono font-bold text-slate-900">
                  {customers.length}
                </span>
              </div>

              {/* Fast switch to POS button if not already there */}
              {currentTab !== 'pos' && (
                <button
                  onClick={() => setCurrentTab('pos')}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Go to POS</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-10 py-5 sm:py-6">
        
        {/* Module 4: POS Billing */}
        {currentTab === 'pos' && (
          <POS
            items={items}
            customers={customers}
            tenant={tenant}
            onCompleteSale={handleCompleteSale}
            onQuickAddCustomer={handleQuickAddCustomer}
            isProcessingSale={isProcessingSale}
            preselectedCustomerId={preselectedCustomerId}
            onClearPreselectedCustomer={() => setPreselectedCustomerId(null)}
            categories={categories}
          />
        )}

        {/* Dashboard */}
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            tenant={tenant}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSubscriptionModal={() => setSubscriptionModalOpen(true)}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
          />
        )}

        {/* Module 2: Items & Services */}
        {currentTab === 'items' && (
          <ItemsServices
            items={items}
            tenant={tenant}
            onSaveItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            isSaving={isSavingItem}
            categories={categories}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            isSavingCategory={isSavingCategory}
          />
        )}

        {/* Module 3: Customers */}
        {currentTab === 'customers' && (
          <Customers
            customers={customers}
            tenant={tenant}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onBillCustomer={handleBillCustomer}
            isSaving={isSavingCustomer}
          />
        )}

        {/* Sales Invoices Archive */}
        {currentTab === 'sales' && (
          <SalesHistory
            sales={sales}
            tenant={tenant}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
            onRefreshSales={fetchData}
          />
        )}

        {/* Cash Book */}
        {currentTab === 'cashbook' && (
          <CashBook
            sales={sales}
            tenant={tenant}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
          />
        )}

        {/* Day Book */}
        {currentTab === 'daybook' && (
          <DayBook
            sales={sales}
            tenant={tenant}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
          />
        )}

        {/* Customer Ledger */}
        {currentTab === 'ledger' && (
          <CustomerLedger
            customers={customers}
            sales={sales}
            tenant={tenant}
            onViewInvoice={(sale) => setActiveInvoice(sale)}
            onBillCustomer={handleBillCustomer}
          />
        )}

      </main>

      {/* Printable Invoice / Receipt Modal */}
      <InvoiceReceiptModal
        sale={activeInvoice}
        tenant={tenant}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Subscription Details & Plan Status Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        tenant={tenant}
        stats={stats}
      />

      {/* Settings Modal (Loyalty Points & Garage Profile) */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        tenant={tenant}
        onSaveSettings={handleSaveSettings}
        isSaving={isSavingSettings}
      />

      {/* Auth Modals: Login, Change Password, Forgot/Reset Password */}
      <AuthModals
        loginOpen={loginModalOpen}
        changePasswordOpen={changePasswordModalOpen}
        forgotPasswordOpen={forgotPasswordModalOpen}
        onCloseAll={() => {
          setLoginModalOpen(false);
          setChangePasswordModalOpen(false);
          setForgotPasswordModalOpen(false);
        }}
        onLogin={handleLogin}
        onChangePassword={handleChangePassword}
        onForgotPassword={handleForgotPassword}
        onResetPassword={handleResetPassword}
        activeTenant={tenant}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
