import { formatPrice, getColorStyle } from "../lib/utils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Menu,
  Layers, 
  Clock, 
  Percent, 
  Calendar,
  Trash2, 
  Edit, 
  Check, 
  AlertCircle, 
  Upload, 
  RefreshCw, 
  LogOut, 
  ChevronDown,
  Package,
  AlertTriangle,
  Users,
  ShieldAlert,
  Search,
  ExternalLink,
  Plus
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
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

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'inventario' | 'pedidos' | 'config' | 'cupones'>('inventario');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchTermInventory, setSearchTermInventory] = useState('');
  const [searchTermOrders, setSearchTermOrders] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product Form states
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'porcentaje'|'fijo'>('porcentaje');
  const [newCouponValue, setNewCouponValue] = useState(10);
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
    materiales: '',
    cuidado: '',
    envio: '',
    variantes: []
  });
  const [newVariant, setNewVariant] = useState<ProductVariant>({ color: '', talla: '', stock: 0 });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // --- AUTH SHIELD & LOADING SCREEN ---
  if (user === undefined) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!user || !user.esAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-red-950/40 text-red-500 border border-red-900/40 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-3">Acceso Restringido</h1>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-8">
          El panel de control requiere privilegios de administrador autenticado. Por favor, inicia sesión con una cuenta autorizada para acceder a la gestión de inventario y pedidos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  // --- INVENTORY STATISTICS CALCULATIONS ---
  const totalProducts = products.length;

  // En stock: Any product with total variant stock > 0
  const productsInStock = products.filter(p => {
    const totalStock = p.variantes.reduce((acc, v) => acc + v.stock, 0);
    return totalStock > 0;
  }).length;

  // Stock bajo: Any product with at least one variant having stock between 1 and 5
  const productsLowStock = products.filter(p => {
    return p.variantes.some(v => v.stock > 0 && v.stock <= 5);
  }).length;

  // Agotados: Any product with total variant stock === 0 (or no variants declared)
  const productsOutOfStock = products.filter(p => {
    if (p.variantes.length === 0) return true;
    const totalStock = p.variantes.reduce((acc, v) => acc + v.stock, 0);
    return totalStock === 0;
  }).length;

  // --- DYNAMIC REFLECTION OF UPDATE EVENTS ---
  const handleRefreshData = () => {
    showToast("¡Datos actualizados del servidor en tiempo real!", "info");
  };

  // --- PRODUCT CRUD HANDLERS ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.id || !productForm.nombre || !productForm.marca) {
      showToast("Por favor, completa el SKU, Nombre y Marca.", "error");
      return;
    }

    if (productForm.variantes.length === 0) {
      showToast("Debes añadir al menos una variante de inventario.", "error");
      return;
    }

    if (!productForm.imagenes[0]) {
      showToast("Por favor, proporciona una URL de imagen o sube un archivo.", "error");
      return;
    }

    try {
      if (isEditingProduct) {
        await onUpdateProduct(productForm);
        showToast(`Producto "${productForm.nombre}" actualizado con éxito.`);
      } else {
        await onAddProduct(productForm);
        showToast(`Producto "${productForm.nombre}" creado con éxito.`);
      }
      resetProductForm();
    } catch (err) {
      showToast("Error al guardar el producto: " + err, "error");
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
      materiales: '',
      cuidado: '',
      envio: '',
      variantes: []
    });
    setNewVariant({ color: '', talla: '', stock: 0 });
    setIsEditingProduct(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditProduct = (p: Product) => {
    setProductForm({ ...p });
    setIsEditingProduct(true);
    // Smooth scroll to top form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Editando producto: " + p.nombre, "info");
  };

  const handleDeleteProductClick = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}" de forma permanente?`)) {
      try {
        await onDeleteProduct(id);
        showToast(`Producto "${nombre}" eliminado del catálogo.`);
      } catch (err) {
        showToast("Error al eliminar producto: " + err, "error");
      }
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.color || !newVariant.talla || newVariant.stock < 0) {
      showToast("Completa Color, Talla y Stock para la variante.", "error");
      return;
    }
    
    // Check if variant combination already exists
    const exists = productForm.variantes.some(
      v => v.color.toLowerCase() === newVariant.color.toLowerCase() && 
           v.talla.toLowerCase() === newVariant.talla.toLowerCase()
    );

    if (exists) {
      showToast("Esta combinación de Color y Talla ya ha sido agregada.", "error");
      return;
    }

    setProductForm({
      ...productForm,
      variantes: [...productForm.variantes, { ...newVariant }]
    });
    setNewVariant({ color: '', talla: '', stock: 0 });
    showToast("Variante añadida correctamente.");
  };

  const handleRemoveVariant = (idx: number) => {
    const list = [...productForm.variantes];
    list.splice(idx, 1);
    setProductForm({ ...productForm, variantes: list });
    showToast("Variante removida de la lista provisional.");
  };

  // --- BASE64 IMAGE UPLOADER ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("La imagen supera el límite de 2MB. Intenta con una más pequeña.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({
          ...prev,
          imagenes: [reader.result as string]
        }));
        showToast("Imagen cargada y procesada con éxito.");
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGOUT ACTION ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Sesión cerrada correctamente. Redirigiendo...", "info");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      showToast("Error al cerrar sesión: " + err, "error");
    }
  };

  return (
    <div id="admin-dashboard-container" className="bg-[#FAFBFD] min-h-screen font-sans text-slate-800 flex relative overflow-x-hidden">
      
      {/* TOAST CONTAINER */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-3 border animate-fade-in transition-all duration-300 ${
              t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150/40' :
              t.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-150/40' :
              'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {t.type === 'success' && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
            {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            {t.type === 'info' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span className="text-[12px] font-semibold leading-relaxed">{t.message}</span>
          </div>
        ))}
      </div>

      {/* OVERLAY (móvil) */}
      {isMobileSidebarOpen && (
        <div 
          id="mobile-overlay"
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden transition-all duration-300" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-950 text-slate-200 flex flex-col justify-between py-8 px-6 z-40 transition-transform duration-300 border-r border-slate-900 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo */}
            <div id="sidebar-logo-container" className="flex items-center gap-3 mb-10 px-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center font-black text-white text-sm">
                S
              </div>
              <div>
                <span className="text-lg font-black tracking-tighter text-white font-sans block leading-none">SLATE.</span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1 block">Panel de Control</span>
              </div>
            </div>

            {/* Menú */}
            <div id="sidebar-menu-group" className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
                Menú de Gestión
              </p>
              <nav className="space-y-1.5">
                <button
                  id="menu-btn-inventario"
                  onClick={() => { setActiveTab('inventario'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'inventario'
                      ? 'bg-red-600/90 text-white shadow-lg shadow-red-900/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  Inventario
                </button>
                <button
                  id="menu-btn-pedidos"
                  onClick={() => { setActiveTab('pedidos'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'pedidos'
                      ? 'bg-red-600/90 text-white shadow-lg shadow-red-900/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  Pedidos
                </button>
                <button
                  id="menu-btn-config"
                  onClick={() => { setActiveTab('config'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'config'
                      ? 'bg-red-600/90 text-white shadow-lg shadow-red-900/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  Configuración Home
                </button>
                <button
                  id="menu-btn-cupones"
                  onClick={() => { setActiveTab('cupones'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'cupones'
                      ? 'bg-red-600/90 text-white shadow-lg shadow-red-900/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Percent className="w-4 h-4 shrink-0" />
                  Cupones
                </button>
              </nav>
            </div>
          </div>

          {/* Perfil del administrador */}
          <div id="sidebar-admin-profile" className="border-t border-slate-900 pt-6 mt-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-700 uppercase">
                {user.nombre ? user.nombre.slice(0, 2) : 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.nombre || 'Administrador'}</p>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Perfil de Admin</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div id="admin-main-window" className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header id="admin-header" className="bg-white border-b border-slate-150/50 h-20 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-slate-100/10">
          <div className="flex items-center gap-4">
            {/* Botón menú (móvil) */}
            <button 
              id="mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 lg:hidden transition-colors cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Título de la página */}
            <div>
              <h1 id="page-header-title" className="text-lg font-black text-slate-900 tracking-tight leading-none capitalize">
                {activeTab}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest hidden sm:block">
                {activeTab === 'inventario' ? 'Control de catálogo de productos' : activeTab === 'pedidos' ? 'Seguimiento de compras y envíos' : activeTab === 'config' ? 'Ajustes del Inicio' : 'Gestión de Códigos de Descuento'}
              </p>
            </div>
          </div>

          {/* Perfil usuario / Menú desplegable */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <span className="text-xs font-bold text-slate-500 hidden sm:block">{user.email}</span>
            <button 
              id="user-profile-dropdown-trigger"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-150/60 border border-slate-200/50 flex items-center justify-center text-slate-700 font-black text-xs transition-all uppercase cursor-pointer"
            >
              {user.nombre ? user.nombre.slice(0, 2) : 'AD'}
            </button>

            {/* Menú desplegable dropdown */}
            {isUserDropdownOpen && (
              <div 
                id="user-dropdown-menu"
                className="absolute right-0 top-12 w-48 bg-white border border-slate-200/60 rounded-2xl shadow-xl py-2.5 z-30 animate-fade-in"
              >
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Sesión activa</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{user.nombre}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Ir a la Tienda
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50 mt-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT AREA */}
        <main id="admin-content-viewport" className="p-6 sm:p-8 space-y-8 flex-1">
          
          {/* SECCIÓN INVENTARIO */}
          {activeTab === 'inventario' && (
            <div id="seccion-inventario-content" className="space-y-8 animate-fade-in">
              
              {/* Estadísticas */}
              <div id="estadisticas-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-150/40 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total productos</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{totalProducts}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-150/40 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">En stock</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{productsInStock}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-150/40 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Stock bajo</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{productsLowStock}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-150/40 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Agotados</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{productsOutOfStock}</p>
                  </div>
                </div>
              </div>

              {/* Formulario & Catálogo Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* Formulario Producto */}
                <div id="formulario-producto-card" className="xl:col-span-1 bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Ficha de artículo</h3>
                    <h2 className="text-base font-black text-slate-900 mt-1">
                      {isEditingProduct ? 'Actualizar Producto' : 'Crear Nuevo Producto'}
                    </h2>
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SKU / ID Único</label>
                      <input
                        type="text"
                        value={productForm.id}
                        disabled={isEditingProduct}
                        onChange={(e) => setProductForm({ ...productForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 placeholder-slate-400 disabled:opacity-60"
                        placeholder="ej. prod_w_jersey_blue"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre</label>
                        <input
                          type="text"
                          value={productForm.nombre}
                          onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800"
                          placeholder="Jersey de Punto"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Marca</label>
                        <input
                          type="text"
                          value={productForm.marca}
                          onChange={(e) => setProductForm({ ...productForm, marca: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800"
                          placeholder="SLATE. Original"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Categoría</label>
                        <select
                          value={productForm.categoria}
                          onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs text-slate-700 cursor-pointer"
                        >
                          {['Clothing', 'Shoes', 'Accessories', 'ActiveWear', 'Outlet'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Género</label>
                        <select
                          value={productForm.genero}
                          onChange={(e) => setProductForm({ ...productForm, genero: e.target.value as any })}
                          className="w-full px-3 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs text-slate-700 cursor-pointer"
                        >
                          <option value="Women">Mujer</option>
                          <option value="Men">Hombre</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Regular ($)</label>
                        <input
                          type="number"
                          value={productForm.precio_regular || ''}
                          onChange={(e) => setProductForm({ ...productForm, precio_regular: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800"
                          placeholder="89.90"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descuento ($)</label>
                        <input
                          type="number"
                          value={productForm.precio_descuento || ''}
                          onChange={(e) => setProductForm({ ...productForm, precio_descuento: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800"
                          placeholder="No tiene"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Descripción</label>
                        <textarea
                          value={productForm.descripcion}
                          onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 resize-none"
                          placeholder="Describe la pieza..."
                          required
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Información Detallada</h3>
                          <span className="text-[9px] text-slate-400 font-medium">Vacío = No se muestra</span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Materiales y Ética</label>
                              <button 
                                type="button"
                                onClick={() => setProductForm({ ...productForm, materiales: "Tejido con fibras orgánicas 100% certificadas, utilizando procesos sostenibles y tintes a base de agua." })}
                                className="text-[9px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Cargar Plantilla
                              </button>
                            </div>
                            <textarea
                              value={productForm.materiales || ''}
                              onChange={(e) => setProductForm({ ...productForm, materiales: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 resize-none"
                              placeholder="Fibras orgánicas, procesos sostenibles..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Instrucciones de Cuidado</label>
                              <button 
                                type="button"
                                onClick={() => setProductForm({ ...productForm, cuidado: "Lavar a máquina en ciclos fríos y delicados. No usar blanqueador. Secar en secadora a baja temperatura." })}
                                className="text-[9px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Cargar Plantilla
                              </button>
                            </div>
                            <textarea
                              value={productForm.cuidado || ''}
                              onChange={(e) => setProductForm({ ...productForm, cuidado: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 resize-none"
                              placeholder="Lavar en frío, no usar blanqueador..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Envío y Devoluciones</label>
                              <button 
                                type="button"
                                onClick={() => setProductForm({ ...productForm, envio: "Disfruta de envío premium neutro en carbono. Despachos en 2-4 días hábiles. Devoluciones en 30 días." })}
                                className="text-[9px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Cargar Plantilla
                              </button>
                            </div>
                            <textarea
                              value={productForm.envio || ''}
                              onChange={(e) => setProductForm({ ...productForm, envio: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 resize-none"
                              placeholder="Tiempos de entrega, políticas..."
                            />
                          </div>
                        </div>
                      </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Imagen del Producto</label>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={productForm.imagenes[0] || ''}
                          onChange={(e) => setProductForm({ ...productForm, imagenes: [e.target.value] })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/30 rounded-xl text-xs focus:ring-1 focus:ring-slate-300 text-slate-800 placeholder-slate-400"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      {/* Subir imagen */}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-400 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <p className="text-[10px] font-bold text-slate-500">Subir imagen local</p>
                            <p className="text-[9px] text-slate-400">Archivos menores a 2MB</p>
                          </div>
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </div>

                      {/* Vista previa */}
                      {productForm.imagenes[0] && (
                        <div id="imagen-vista-previa" className="relative mt-3 rounded-xl overflow-hidden border border-slate-200/60 aspect-video bg-slate-50 flex items-center justify-center">
                          <img 
                            src={productForm.imagenes[0]} 
                            alt="Vista previa" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => setProductForm(prev => ({ ...prev, imagenes: [''] }))}
                            className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-lg hover:bg-slate-950 transition-colors cursor-pointer"
                            title="Eliminar imagen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Builder de Variantes (Define Stock) */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Variantes de Stock</span>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newVariant.color}
                          onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                          placeholder="Color"
                          className="px-3 py-2 bg-slate-50 border border-slate-200/30 rounded-lg text-[10px] focus:ring-1 focus:ring-slate-300 text-slate-800"
                        />
                        <input
                          type="text"
                          value={newVariant.talla}
                          onChange={(e) => setNewVariant({ ...newVariant, talla: e.target.value })}
                          placeholder="Talla"
                          className="px-3 py-2 bg-slate-50 border border-slate-200/30 rounded-lg text-[10px] focus:ring-1 focus:ring-slate-300 text-slate-800"
                        />
                        <input
                          type="number"
                          value={newVariant.stock || ''}
                          onChange={(e) => setNewVariant({ ...newVariant, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                          placeholder="Stock"
                          className="px-3 py-2 bg-slate-50 border border-slate-200/30 rounded-lg text-[10px] focus:ring-1 focus:ring-slate-300 text-slate-800"
                          min="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="w-full py-2 border border-dashed border-slate-200 hover:border-slate-900 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-all duration-300 cursor-pointer"
                      >
                        + Añadir Variante
                      </button>

                      {/* Lista de variantes agregadas */}
                      {productForm.variantes.length > 0 && (
                        <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {productForm.variantes.map((v, index) => (
                            <div key={index} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-[10px] font-semibold text-slate-600 border border-slate-100">
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-3 h-3 rounded-full ${getColorStyle(v.color)} border border-slate-200`} />
                                <span className="truncate">{v.color} - Talla {v.talla} ({v.stock} uds)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {isEditingProduct && (
                        <button
                          type="button"
                          onClick={resetProductForm}
                          className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-slate-950 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow cursor-pointer"
                      >
                        {isEditingProduct ? 'Actualizar' : 'Crear Producto'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Lista Productos */}
                <div id="lista-productos-card" className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Catálogo General</h3>
                      <h2 className="text-base font-black text-slate-900 mt-1">Lista de Productos</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Buscar producto..."
                          value={searchTermInventory}
                          onChange={(e) => setSearchTermInventory(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300 w-full sm:w-48"
                        />
                      </div>
                      <button
                        id="btn-actualizar-inventario"
                        onClick={handleRefreshData}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Actualizar</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table id="tabla-productos" className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-3">Pieza</th>
                          <th className="py-3">Precio</th>
                          <th className="py-3">Stock</th>
                          <th className="py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.filter(p => 
                          p.nombre.toLowerCase().includes(searchTermInventory.toLowerCase()) || 
                          p.marca.toLowerCase().includes(searchTermInventory.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTermInventory.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-bold">No se encontraron productos coincidentes.</td>
                          </tr>
                        ) : (
                          products
                            .filter(p => 
                              p.nombre.toLowerCase().includes(searchTermInventory.toLowerCase()) || 
                              p.marca.toLowerCase().includes(searchTermInventory.toLowerCase()) ||
                              p.id.toLowerCase().includes(searchTermInventory.toLowerCase())
                            )
                            .map(p => {
                            const totalStock = p.variantes.reduce((acc, v) => acc + v.stock, 0);
                            return (
                              <tr key={p.id} className="text-xs text-slate-700 hover:bg-slate-50/40 transition-colors">
                                <td className="py-3.5 flex items-center gap-3">
                                  <div className="w-10 h-12 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                    <img src={p.imagenes[0]} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{p.nombre}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">SKU: {p.id} | {p.marca}</span>
                                      <div className="flex gap-1 ml-1">
                                        {Array.from(new Set(p.variantes.map(v => v.color))).map((c, i) => (
                                          <span key={i} className={`w-2 h-2 rounded-full ${getColorStyle(c)} border border-slate-200`} title={c} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 font-bold">
                                  {p.precio_descuento !== null ? (
                                    <div className="flex flex-col">
                                      <span className="text-red-500">{formatPrice(p.precio_descuento)}</span>
                                      <span className="text-[10px] text-slate-400 line-through">{formatPrice(p.precio_regular)}</span>
                                    </div>
                                  ) : (
                                    <span>{formatPrice(p.precio_regular)}</span>
                                  )}
                                </td>
                                <td className="py-3.5">
                                  <div className="flex flex-col gap-1">
                                    <span className={`font-black uppercase text-[10px] ${
                                      totalStock === 0 ? 'text-red-500' :
                                      totalStock <= 5 ? 'text-amber-500' :
                                      'text-emerald-600'
                                    }`}>
                                      {totalStock === 0 ? 'Agotado' : `${totalStock} uds`}
                                    </span>
                                    <span className="text-[9px] text-slate-400 max-w-[150px] truncate block leading-none">
                                      {p.variantes.map(v => `${v.color}(${v.talla}):${v.stock}`).join(', ')}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 text-right space-x-1">
                                  <button
                                    onClick={() => handleEditProduct(p)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                    title="Editar producto"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProductClick(p.id, p.nombre)}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                    title="Eliminar producto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SECCIÓN PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div id="seccion-pedidos-content" className="space-y-6 animate-fade-in">
              
              {/* Encabezado */}
              <div id="encabezado-pedidos" className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Gestión de Pedidos</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Monitorea las órdenes de compra entrantes y gestiona su despacho en tiempo real.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar pedido o cliente..."
                      value={searchTermOrders}
                      onChange={(e) => setSearchTermOrders(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300 w-full sm:w-48 lg:w-64"
                    />
                  </div>
                  <button
                    id="btn-actualizar-pedidos"
                    onClick={handleRefreshData}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualizar
                  </button>
                </div>
              </div>

              {/* Tabla Pedidos */}
              <div id="tabla-pedidos-card" className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-3">Pedido</th>
                        <th className="py-3">Items</th>
                        <th className="py-3">Total</th>
                        <th className="py-3">Estado</th>
                        <th className="py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {orders.filter(o => 
                        o.id.toLowerCase().includes(searchTermOrders.toLowerCase()) || 
                        o.direccion_envio?.nombre.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
                        o.direccion_envio?.telefono.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
                        o.direccion_envio?.email.toLowerCase().includes(searchTermOrders.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">No se encontraron pedidos coincidentes.</td>
                        </tr>
                      ) : (
                        orders
                          .filter(o => 
                            o.id.toLowerCase().includes(searchTermOrders.toLowerCase()) || 
                            o.direccion_envio?.nombre.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
                            o.direccion_envio?.telefono.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
                            o.direccion_envio?.email.toLowerCase().includes(searchTermOrders.toLowerCase())
                          )
                          .map(o => (
                            <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-4">
                                <p className="font-mono font-black text-slate-900 text-xs">{o.id}</p>
                                <p className="text-[10px] font-bold text-slate-800 mt-1">{o.direccion_envio?.nombre}</p>
                                <span className="text-[9px] text-slate-400 block">{new Date(o.fecha_creacion).toLocaleDateString()} {new Date(o.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                            <td className="py-4 font-semibold max-w-xs">
                              <div className="space-y-1">
                                {o.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-6 h-8 rounded bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                                      <img src={it.imagen} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="truncate text-[10px] text-slate-600 block">
                                      {it.nombre} ({it.color}/{it.talla}) <strong className="text-slate-800">x{it.cantidad}</strong>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 font-black text-slate-900">{formatPrice(o.total)}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase inline-block border ${
                                o.estado === 'pendiente' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                o.estado === 'enviado' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {o.estado}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <select
                                value={o.estado}
                                onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any).then(() => showToast(`Pedido ${o.id.slice(0,8)}... actualizado a ${e.target.value}.`))}
                                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-slate-300"
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

            </div>
          )}

          {/* TAB 3: CONFIGURACIÓN HOME */}
          {activeTab === 'config' && (
            <div id="seccion-config-content" className="space-y-6 animate-fade-in">
              <div id="encabezado-config" className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm">
                <h2 className="text-base font-black text-slate-900">Configuración del Inicio (CMS)</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Gestiona los textos y fondos de las tarjetas promocionales del inicio.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm max-w-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Banner 1 (Oferta Especial)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Texto del Banner</label>
                      <input
                        type="text"
                        value={homeConfig.banner1_texto || ''}
                        onChange={(e) => onUpdateHomeConfig({ ...homeConfig, banner1_texto: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Color de Fondo (Hex)</label>
                      <input
                        type="text"
                        value={homeConfig.banner1_bg || ''}
                        onChange={(e) => onUpdateHomeConfig({ ...homeConfig, banner1_bg: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                        placeholder="#F4EBE1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 mt-6">Banner 2 (Nueva Colección)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Texto del Banner</label>
                      <input
                        type="text"
                        value={homeConfig.banner2_texto || ''}
                        onChange={(e) => onUpdateHomeConfig({ ...homeConfig, banner2_texto: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Color de Fondo (Hex)</label>
                      <input
                        type="text"
                        value={homeConfig.banner2_bg || ''}
                        onChange={(e) => onUpdateHomeConfig({ ...homeConfig, banner2_bg: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                        placeholder="#AEE5E5"
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => showToast('Configuración del Home guardada en Firestore')}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CUPONES */}
          {activeTab === 'cupones' && (
            <div id="seccion-cupones-content" className="space-y-6 animate-fade-in">
              <div id="encabezado-cupones" className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Gestión de Cupones</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Crea y administra códigos de descuento promocionales.</p>
                </div>
              </div>

              {/* Lista Cupones */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150/40 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{c.id}</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          {c.tipo === 'porcentaje' ? `${c.valor}% DCTO` : `$${c.valor} DCTO`}
                        </p>
                        {c.categoria_restringida && (
                          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full mt-2 inline-block font-semibold">Sólo {c.categoria_restringida}</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteCoupon(c.id).then(() => showToast(`Cupón ${c.id} eliminado.`))}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Formulario Crear Nuevo Cupón */}
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col gap-3 justify-center transition-colors min-h-[100px]">
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        placeholder="Código (ej. VERANO20)" 
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as 'porcentaje'|'fijo')}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                        >
                          <option value="porcentaje">Porcentaje (%)</option>
                          <option value="fijo">Fijo ($)</option>
                        </select>
                        <input 
                          type="number" 
                          min={1}
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-300"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if(!newCouponCode.trim()) return;
                          const nuevoCupon: Coupon = {
                            id: newCouponCode.trim().toUpperCase(),
                            tipo: newCouponType,
                            valor: newCouponValue,
                            fecha_expiracion: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                            categoria_restringida: null
                          };
                          onAddCoupon(nuevoCupon).then(() => {
                            showToast(`Cupón ${nuevoCupon.id} creado.`);
                            setNewCouponCode('');
                            setNewCouponValue(10);
                          });
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center justify-center gap-1">
                          <Plus className="w-4 h-4" /> Crear Cupón
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
