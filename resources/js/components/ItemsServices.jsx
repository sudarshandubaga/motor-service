import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  DollarSign,
  Tag,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  Wrench,
  Percent
} from 'lucide-react';
import CategoryModal from './CategoryModal';

export default function ItemsServices({
  items = [],
  tenant,
  onSaveItem = () => {},
  onDeleteItem = () => {},
  isSaving = false,
  categories = [],
  onSaveCategory = () => {},
  onDeleteCategory = () => {},
  isSavingCategory = false
}) {
  const currency = tenant?.currency || '₹';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal State for Add / Edit Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Extract dynamic category options list
  const categoryOptions = useMemo(() => {
    const fromCats = (categories || []).map((c) => c.name);
    const fromItems = items.map((i) => i.category).filter(Boolean);
    const combined = Array.from(new Set([...fromCats, ...fromItems]));
    return combined.length > 0 ? combined : ['Engine & Lube', 'Brakes & Wheels', 'General Spare Parts'];
  }, [categories, items]);

  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    category: categoryOptions[0] || 'Engine & Lube',
    price: '',
    gst_percent: 18,
    is_active: true,
  });

  // Calculate stats for each category
  const categoryStats = useMemo(() => {
    const counts = { All: items.length };
    items.forEach((it) => {
      if (it.category) {
        counts[it.category] = (counts[it.category] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const categoryFilterList = useMemo(() => {
    return ['All', ...categoryOptions];
  }, [categoryOptions]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchCat = selectedCategory === 'All' || it.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        it.name?.toLowerCase().includes(term) ||
        (it.short_name && it.short_name.toLowerCase().includes(term)) ||
        (it.category && it.category.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      short_name: '',
      category: categoryOptions[0] || 'Engine & Lube',
      price: '',
      gst_percent: 18,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      short_name: item.short_name || '',
      category: item.category || categoryOptions[0] || 'Service',
      price: item.price,
      gst_percent: Number(item.gst_percent ?? 18),
      is_active: item.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    await onSaveItem(
      {
        name: formData.name.trim(),
        short_name: formData.short_name ? formData.short_name.toUpperCase().trim() : null,
        category: formData.category,
        price: Number(formData.price),
        gst_percent: Number(formData.gst_percent ?? 18),
        is_active: formData.is_active,
      },
      editingItem?.id
    );

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span>Services & Spare Parts Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure workshop labor packages, standard maintenance services, and auto replacement parts with GST rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Dynamic Categories Manager Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition-all cursor-pointer"
            title="Manage dynamic categories for services and spare parts"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Manage Categories</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
              {categories.length}
            </span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 ring-1 ring-amber-300/60 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Service / Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row gap-3.5 items-center justify-between shadow-xs">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service name, code or category..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
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

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categoryFilterList.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-transparent'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {categoryStats[cat] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Table vs Grid */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Grid or Table Presentation */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white hover:bg-slate-50/60 border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {item.short_name ? (
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-200/60">
                      {item.short_name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono italic">No SKU</span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.category || 'General'}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-amber-700 transition-colors">
                  {item.name}
                </h3>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 font-mono">
                    <Percent className="w-3 h-3 text-amber-600" />
                    <span>GST {Number(item.gst_percent ?? 18)}%</span>
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Standard Price</span>
                  <span className="font-mono text-base font-black text-slate-950">
                    {currency}{Number(item.price).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">No services or spare parts found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your category filter or search query.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code / SKU</th>
                  <th className="py-3 px-4">Service / Item Name</th>
                  <th className="py-3 px-4">Dynamic Category</th>
                  <th className="py-3 px-4 text-right">Standard Price</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {item.short_name || <span className="text-slate-300 font-normal italic">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>{item.category || 'General'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm">
                      {currency}{Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        <Percent className="w-3 h-3 text-amber-600" />
                        <span>{Number(item.gst_percent ?? 18)}%</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span>{item.is_active !== false ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-slate-400">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">No items found matching the selected filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingItem ? 'Edit Service / Item' : 'Add New Service / Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                  Service / Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Synthetic Engine Oil Change, Front Brake Pad Set"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Short Code / SKU is NOT required */}
                <div>
                  <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                    Short Code / SKU <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OIL-SYN"
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold text-[11px]">
                      Service Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                    >
                      {categoryOptions.map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Standard Price & GST Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                    Standard Price ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold text-[11px]">
                    GST Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gst_percent}
                    onChange={(e) => setFormData({ ...formData, gst_percent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value={0}>0% (Tax Exempt / Nil)</option>
                    <option value={5}>5% (GST 5%)</option>
                    <option value={12}>12% (GST 12%)</option>
                    <option value={18}>18% (Standard GST 18%)</option>
                    <option value={28}>28% (Automotive Parts 28%)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="item_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="item_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Available in POS Register (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
        isLoading={isSavingCategory}
      />

    </div>
  );
}
