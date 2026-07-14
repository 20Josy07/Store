/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Percent, 
  Layers, 
  Check, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Product, Coupon, Order, HomeBannerConfig, ProductVariant } from '../types';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  homeConfig: HomeBannerConfig;
  user: { uid: string; email: string; nombre: string; esAdmin: boolean } | null;
  onAddProduct: (p: Product) => Promise<void>;
  onUpdateProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddCoupon: (c: Coupon) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: 'pendiente' | 'enviado' | 'entregado') => Promise<void>;
  onUpdateHomeConfig: (cfg: HomeBannerConfig) => Promise<void>;
  onClose: () => void;
}

export default function AdminPanel({
  products,
  orders,
  coupons,
  homeConfig,
  user,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCoupon,
  onDeleteCoupon,
  onUpdateOrderStatus,
  onUpdateHomeConfig,
  onClose
}: AdminPanelProps) {

  // Safeguard/Middleware Check
  if (!user || !user.esAdmin) {
    return (
      <div className="ml-64 p-8 min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
        <div className="w-16 h-16 bg-red-50 text-[#E63946] rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Access Unauthorized</h1>
        <p className="text-xs text-gray-500 max-w-sm mb-6">
          The admin dashboard requires authenticated administrator roles. Please sign in with your admin credentials to gain access.
        </p>
        <button 
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-[#E63946] transition-colors cursor-pointer"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'coupons' | 'cms'>('dashboard');

  // Product Form states
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Product>({
    id: '',
    nombre: '',
    marca: '',
    categoria: 'Clothing',
    genero: 'Women',
    precio_regular: 0,
    precio_descuento: null,
    imagenes: [''],
    descripcion: '',
    variantes: []
  });
  const [newVariant, setNewVariant] = useState<ProductVariant>({ color: '', talla: '', stock: 0 });

  // Coupon Form States
  const [couponForm, setCouponForm] = useState<Coupon>({
    id: '',
    tipo: 'porcentaje',
    valor: 0,
    fecha_expiracion: '',
    categoria_restringida: null
  });

  // CMS Form States
  const [cmsForm, setCmsForm] = useState<HomeBannerConfig>({
    id: 'home_cms',
    banner1_texto: homeConfig.banner1_texto || '',
    banner1_bg: homeConfig.banner1_bg || '',
    banner2_texto: homeConfig.banner2_texto || '',
    banner2_bg: homeConfig.banner2_bg || ''
  });

  const [notif, setNotif] = useState('');

  useEffect(() => {
    if (homeConfig) {
      setCmsForm({
        id: 'home_cms',
        banner1_texto: homeConfig.banner1_texto,
        banner1_bg: homeConfig.banner1_bg,
        banner2_texto: homeConfig.banner2_texto,
        banner2_bg: homeConfig.banner2_bg
      });
    }
  }, [homeConfig]);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 3000);
  };

  // --- KPI Metrics Calculations ---
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter(o => o.estado === 'pendiente').length;
  
  // Count low stock variants (stock <= 5)
  let lowStockCount = 0;
  products.forEach(p => {
    p.variantes.forEach(v => {
      if (v.stock <= 5) lowStockCount++;
    });
  });

  // Count unique users from orders
  const activeUsers = new Set(orders.map(o => o.usuario_id)).size;

  // --- PRODUCTS CRUD HANDLERS ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.id || !productForm.nombre || !productForm.marca) {
      alert("Please fill in ID (SKU), Name and Brand!");
      return;
    }

    if (productForm.variantes.length === 0) {
      alert("Please add at least one product Variant (Color, Size, Stock)!");
      return;
    }

    try {
      if (isEditingProduct) {
        await onUpdateProduct(productForm);
        showNotification("Product updated successfully!");
      } else {
        await onAddProduct(productForm);
        showNotification("Product created successfully!");
      }
      resetProductForm();
    } catch (err) {
      alert("Error saving product: " + err);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      nombre: '',
      marca: '',
      categoria: 'Clothing',
      genero: 'Women',
      precio_regular: 0,
      precio_descuento: null,
      imagenes: [''],
      descripcion: '',
      variantes: []
    });
    setNewVariant({ color: '', talla: '', stock: 0 });
    setIsEditingProduct(false);
  };

  const handleEditProduct = (p: Product) => {
    setProductForm({ ...p });
    setIsEditingProduct(true);
  };

  const handleDeleteProductClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await onDeleteProduct(id);
      showNotification("Product deleted.");
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.color || !newVariant.talla || newVariant.stock < 0) {
      alert("Please fill in color and size!");
      return;
    }
    setProductForm({
      ...productForm,
      variantes: [...productForm.variantes, { ...newVariant }]
    });
    setNewVariant({ color: '', talla: '', stock: 0 });
  };

  const handleRemoveVariant = (idx: number) => {
    const list = [...productForm.variantes];
    list.splice(idx, 1);
    setProductForm({ ...productForm, variantes: list });
  };

  // --- COUPON HANDLERS ---
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.id || couponForm.valor <= 0 || !couponForm.fecha_expiracion) {
      alert("Please provide Coupon code, valid amount and expiration date!");
      return;
    }

    try {
      await onAddCoupon(couponForm);
      showNotification("Coupon created!");
      setCouponForm({
        id: '',
        tipo: 'porcentaje',
        valor: 0,
        fecha_expiracion: '',
        categoria_restringida: null
      });
    } catch (err) {
      alert("Error saving coupon: " + err);
    }
  };

  const handleDeleteCouponClick = async (id: string) => {
    if (confirm("Delete this coupon code?")) {
      await onDeleteCoupon(id);
      showNotification("Coupon deleted.");
    }
  };

  // --- CMS CONTENIDO HANDLER ---
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateHomeConfig(cmsForm);
      showNotification("CMS Banners updated successfully!");
    } catch (err) {
      alert("Error saving CMS configuration: " + err);
    }
  };

  return (
    <div id="admin-panel" className="ml-64 p-8 bg-gray-50 min-h-screen">
      
      {/* Floating success prompt */}
      {notif && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> {notif}
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight leading-none">Admin Control Center</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1.5 uppercase tracking-wider">Configure store catalogs, metrics & banners</p>
        </div>
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow cursor-pointer"
        >
          <X className="w-4 h-4" /> Exit Dashboard
        </button>
      </div>

      {/* Internal Navigation Menu Tabs */}
      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'dashboard', label: 'Dashboard Metric', icon: TrendingUp },
          { id: 'products', label: 'Product Catalog', icon: Layers },
          { id: 'orders', label: 'Order Tracking', icon: Clock },
          { id: 'coupons', label: 'Discount Codes', icon: Percent },
          { id: 'cms', label: 'CMS Home Banners', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <div id="admin-dashboard-tab" className="space-y-8">
          {/* Metricas Grid KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Sales</span>
                <p className="text-xl font-black text-gray-950 mt-1">${totalSales.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pending Orders</span>
                <p className="text-xl font-black text-gray-950 mt-1">{pendingOrders} pending</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Low Stock alerts</span>
                <p className="text-xl font-black text-gray-950 mt-1">{lowStockCount} alerts</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Active Clients</span>
                <p className="text-xl font-black text-gray-950 mt-1">{activeUsers} clients</p>
              </div>
            </div>
          </div>

          {/* Quick Info panel */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm text-left">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Admin Overview</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
              Welcome to your clothing boutique management panel. From here you can update the Unsplash images representing the catalog, track client transactions, issue percentage or fixed coupon codes, and edit your promotional banners dynamically.
            </p>
          </div>
        </div>
      )}

      {/* --- PRODUCTS CRUD TAB --- */}
      {activeTab === 'products' && (
        <div id="admin-products-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Left */}
          <div className="lg:col-span-1 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">
              {isEditingProduct ? 'Edit Catalog Product' : 'Add Catalog Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Product SKU / ID</label>
                <input
                  type="text"
                  value={productForm.id}
                  disabled={isEditingProduct}
                  onChange={(e) => setProductForm({ ...productForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850 placeholder-gray-400 disabled:opacity-50"
                  placeholder="e.g. prod_w_jacket_1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="e.g. Ribbed Knit Cardigan"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Brand Name</label>
                <input
                  type="text"
                  value={productForm.marca}
                  onChange={(e) => setProductForm({ ...productForm, marca: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="e.g. STUDIO MINIMAL"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Category</label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl text-xs border-0 text-gray-850 cursor-pointer"
                  >
                    {['Clothing', 'Shoes', 'Accessories', 'ActiveWear', 'Outlet'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Gender</label>
                  <select
                    value={productForm.genero}
                    onChange={(e) => setProductForm({ ...productForm, genero: e.target.value as any })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl text-xs border-0 text-gray-850 cursor-pointer"
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Regular Price ($)</label>
                  <input
                    type="number"
                    value={productForm.precio_regular || ''}
                    onChange={(e) => setProductForm({ ...productForm, precio_regular: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                    placeholder="90"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Offer Price ($)</label>
                  <input
                    type="number"
                    value={productForm.precio_descuento || ''}
                    onChange={(e) => setProductForm({ ...productForm, precio_descuento: parseFloat(e.target.value) || null })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                    placeholder="Offer or null"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.imagenes[0] || ''}
                  onChange={(e) => setProductForm({ ...productForm, imagenes: [e.target.value] })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                <textarea
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850 resize-none"
                  placeholder="Tell clients details about materials, feel..."
                />
              </div>

              {/* Variant Section Builder */}
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[10px] uppercase font-black text-gray-900 block mb-2">Build Inventory Variants</span>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <input
                    type="text"
                    value={newVariant.color}
                    onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                    placeholder="Color"
                    className="px-2.5 py-2 bg-gray-50 rounded-lg text-[10px] border-0 text-gray-850"
                  />
                  <input
                    type="text"
                    value={newVariant.talla}
                    onChange={(e) => setNewVariant({ ...newVariant, talla: e.target.value })}
                    placeholder="Size"
                    className="px-2.5 py-2 bg-gray-50 rounded-lg text-[10px] border-0 text-gray-850"
                  />
                  <input
                    type="number"
                    value={newVariant.stock || ''}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                    placeholder="Stock"
                    className="px-2.5 py-2 bg-gray-50 rounded-lg text-[10px] border-0 text-gray-850"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-[10px] font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                >
                  + Append Variant to List
                </button>

                {/* Added variants display lists */}
                {productForm.variantes.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {productForm.variantes.map((v, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-[10px] font-semibold text-gray-600">
                        <span>{v.color} / {v.talla} ({v.stock} units)</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-[#E63946] hover:bg-red-50 p-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3">
                {isEditingProduct && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-xl text-xs font-bold transition-all duration-300 shadow"
                >
                  {isEditingProduct ? 'Update Product' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>

          {/* List Right */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">Product Inventory Catalog</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-[10px] uppercase font-black text-gray-400">
                      <th className="py-3">SKU</th>
                      <th className="py-3">Details</th>
                      <th className="py-3">Category</th>
                      <th className="py-3">Price</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p.id} className="text-xs text-gray-700 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-gray-900">{p.id}</td>
                        <td className="py-3.5 flex items-center gap-3">
                          <img src={p.imagenes[0]} alt="" referrerPolicy="no-referrer" className="w-9 h-11 rounded-lg object-cover bg-gray-50" />
                          <div>
                            <p className="font-bold text-gray-950">{p.nombre}</p>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">{p.marca} ({p.genero})</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-semibold">{p.categoria}</td>
                        <td className="py-3.5 font-bold">
                          {p.precio_descuento !== null ? (
                            <span className="text-[#E63946]">${p.precio_descuento}</span>
                          ) : (
                            <span>${p.precio_regular}</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 hover:bg-gray-150 text-gray-500 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(p.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-[#E63946] rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- ORDERS LIST TAB --- */}
      {activeTab === 'orders' && (
        <div id="admin-orders-tab" className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">Client Transaction Invoices</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] uppercase font-black text-gray-400">
                  <th className="py-3">Order ID</th>
                  <th className="py-3">Client</th>
                  <th className="py-3">Order Date</th>
                  <th className="py-3">Items Summary</th>
                  <th className="py-3">Total Charged</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Action State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">No transactions recorded in Firestore yet.</td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 font-mono font-black text-gray-900">{o.id}</td>
                      <td className="py-4">
                        <p className="font-bold text-gray-950">{o.direccion_envio?.nombre}</p>
                        <span className="text-[10px] text-gray-400 block">{o.direccion_envio?.email}</span>
                      </td>
                      <td className="py-4 text-gray-500 font-medium">
                        {new Date(o.fecha_creacion).toLocaleDateString()}
                      </td>
                      <td className="py-4 font-semibold max-w-xs">
                        <div className="space-y-0.5">
                          {o.items.map((it, idx) => (
                            <p key={idx} className="truncate text-gray-600">
                              • {it.nombre} ({it.color}/{it.talla}) x{it.cantidad}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 font-black text-gray-900">${o.total.toFixed(2)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                          o.estado === 'pendiente' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          o.estado === 'enviado' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          value={o.estado}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any).then(() => showNotification("Order status modified."))}
                          className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-750 cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- DISCOUNTS TAB --- */}
      {activeTab === 'coupons' && (
        <div id="admin-coupons-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coupon Form Left */}
          <div className="lg:col-span-1 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm h-fit">
            <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">Create Promotion Coupon</h3>
            
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={couponForm.id}
                  onChange={(e) => setCouponForm({ ...couponForm, id: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="e.g. SPECIAL30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Coupon Type</label>
                  <select
                    value={couponForm.tipo}
                    onChange={(e) => setCouponForm({ ...couponForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl text-xs border-0 text-gray-850 cursor-pointer"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Fixed Val ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={couponForm.valor || ''}
                    onChange={(e) => setCouponForm({ ...couponForm, valor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850"
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Restricted Category</label>
                <select
                  value={couponForm.categoria_restringida || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, categoria_restringida: e.target.value || null })}
                  className="w-full px-3 py-3 bg-gray-50 rounded-xl text-xs border-0 text-gray-850 cursor-pointer"
                >
                  <option value="">No restriction (All products)</option>
                  {['Clothing', 'Shoes', 'Accessories', 'ActiveWear', 'Outlet'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={couponForm.fecha_expiracion}
                  onChange={(e) => setCouponForm({ ...couponForm, fecha_expiracion: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-850 text-gray-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-xl text-xs font-bold transition-all duration-300 shadow cursor-pointer"
              >
                Create Coupon code
              </button>
            </form>
          </div>

          {/* Active Coupons Right */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm h-fit">
            <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">Active Coupons List</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 text-[10px] uppercase font-black text-gray-400">
                    <th className="py-3">Coupon Code</th>
                    <th className="py-3">Discount Type</th>
                    <th className="py-3">Discount Value</th>
                    <th className="py-3">Restricted Category</th>
                    <th className="py-3">Expiration Date</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-750 font-semibold">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-gray-900">{c.id}</td>
                      <td className="py-3.5 capitalize">{c.tipo}</td>
                      <td className="py-3.5 font-black text-gray-950">
                        {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`}
                      </td>
                      <td className="py-3.5 text-gray-400 font-semibold">
                        {c.categoria_restringida || 'None'}
                      </td>
                      <td className="py-3.5 text-gray-500">{c.fecha_expiracion}</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteCouponClick(c.id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-[#E63946] rounded-lg transition-colors cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- CMS TAB --- */}
      {activeTab === 'cms' && (
        <div id="admin-cms-tab" className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm max-w-2xl">
          <h3 className="text-sm font-black text-gray-900 mb-5 border-b border-gray-100 pb-3">CMS Contenido Home (Banners Promocionales)</h3>
          
          <form onSubmit={handleSaveCMS} className="space-y-6">
            
            {/* Banner 1 */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest block border-b border-gray-200 pb-2">Banner 1 Details (Home Left)</span>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Promo Banner text</label>
                <input
                  type="text"
                  value={cmsForm.banner1_texto}
                  onChange={(e) => setCmsForm({ ...cmsForm, banner1_texto: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="e.g. GET UP TO 50% For the holiday season"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Background Hex color</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cmsForm.banner1_bg}
                    onChange={(e) => setCmsForm({ ...cmsForm, banner1_bg: e.target.value })}
                    className="w-full max-w-[150px] px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-gray-300 text-gray-850"
                    placeholder="#F4EBE1"
                  />
                  <div className="w-10 h-10 rounded-xl border border-gray-200" style={{ backgroundColor: cmsForm.banner1_bg }} />
                </div>
              </div>
            </div>

            {/* Banner 2 */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest block border-b border-gray-200 pb-2">Banner 2 Details (Home Right)</span>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Promo Banner text</label>
                <input
                  type="text"
                  value={cmsForm.banner2_texto}
                  onChange={(e) => setCmsForm({ ...cmsForm, banner2_texto: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-gray-300 text-gray-850"
                  placeholder="e.g. GET UP TO 30% OFF SHIRTS ⚡"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Background Hex color</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cmsForm.banner2_bg}
                    onChange={(e) => setCmsForm({ ...cmsForm, banner2_bg: e.target.value })}
                    className="w-full max-w-[150px] px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-gray-300 text-gray-850"
                    placeholder="#AEE5E5"
                  />
                  <div className="w-10 h-10 rounded-xl border border-gray-200" style={{ backgroundColor: cmsForm.banner2_bg }} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-xl text-xs font-bold transition-all duration-300 shadow cursor-pointer"
            >
              Save Promotional Changes
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
