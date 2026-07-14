import { formatPrice } from "./lib/utils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  signOut, 
  onAuthStateChanged,
  syncUserProfile,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc
} from './firebase';
import { 
  getProductsFromDB, 
  getCouponsFromDB, 
  getHomeConfigFromDB, 
  getOrdersFromDB,
  addProductToDB,
  updateProductInDB,
  deleteProductFromDB,
  addCouponToDB,
  deleteCouponFromDB,
  createOrderInDB,
  updateOrderStatusInDB,
  updateHomeConfigInDB,
  reserveStockInDB,
  releaseStockInDB
} from './data/dbHelpers';
import { Product, Coupon, Order, CartItem, UserProfile, HomeBannerConfig, Review } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

export default function App() {
  // --- Navigation & Filter States ---
  const [currentPage, setCurrentPage] = useState<string>('home'); // 'home' | 'checkout' | 'admin'
  const [currentCategory, setCurrentCategory] = useState<string>('New in');
  const [currentGender, setCurrentGender] = useState<'Women' | 'Men'>('Women');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Dynamic Database States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeBannerConfig>({
    id: 'home_cms',
    banner1_texto: 'GET UP TO 50% For the holiday season',
    banner1_bg: '#F4EBE1',
    banner2_texto: 'GET UP TO 30% OFF SHIRTS ⚡',
    banner2_bg: '#AEE5E5'
  });

  // --- User & Cart States ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // --- Interactive UI States ---
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- 1. BOOTSTRAP AUTH & REAL-TIME FIRESTORE SUBSCRIPTIONS ---
  useEffect(() => {
    // A. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
        } catch (err) {
          console.error("Auth profile sync error:", err);
        }
      } else {
        setUser(null);
      }
    });

    // C. Real-time Products Sync
    const unsubscribeProducts = onSnapshot(collection(db, 'productos'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Product);
      });
      setProducts(items);
    }, (error) => {
      console.warn("Products sync warning:", error);
    });

    // D. Real-time Coupons Sync
    const unsubscribeCoupons = onSnapshot(collection(db, 'cupones'), (snapshot) => {
      const items: Coupon[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Coupon);
      });
      setCoupons(items);
    }, (error) => {
      console.warn("Coupons sync warning:", error);
    });

    // F. Real-time CMS config Sync
    const unsubscribeCMS = onSnapshot(doc(db, 'config', 'home_cms'), (snapshot) => {
      if (snapshot.exists()) {
        setHomeConfig(snapshot.data() as HomeBannerConfig);
      }
    }, (error) => {
      console.warn("CMS config sync warning:", error);
    });

    // F2. Real-time Reviews Sync
    const unsubscribeReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const items: Review[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(items);
    }, (error) => {
      console.warn("Reviews sync warning:", error);
    });

    // G. Pull local cart state
    const savedCart = localStorage.getItem('slate_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem('slate_cart');
      }
    }

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCoupons();
      unsubscribeCMS();
      unsubscribeReviews();
    };
  }, []);

  // --- Real-time Orders Sync depending on user status ---
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let unsubscribe: () => void;
    if (user.esAdmin) {
      // Admin: subscribe to all orders
      unsubscribe = onSnapshot(collection(db, 'pedidos'), (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Order);
        });
        setOrders(items);
      }, (error) => {
        console.warn("Admin orders sync warning:", error);
      });
    } else {
      // Regular user: subscribe to their own orders
      const q = query(collection(db, 'pedidos'), where('usuario_id', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Order);
        });
        setOrders(items);
      }, (error) => {
        console.warn("User orders sync warning:", error);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // --- SAVE CART STATE TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem('slate_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- RELEASE STOCK ON UNLOAD TO PREVENT STOCK LOCKING ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedCart = localStorage.getItem('slate_cart');
      if (savedCart) {
        try {
          const items: CartItem[] = JSON.parse(savedCart);
          items.forEach(item => {
            releaseStockInDB(item.producto.id, item.color_seleccionado, item.talla_seleccionada, item.cantidad);
          });
          localStorage.removeItem('slate_cart');
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // --- AUTH TRIGGERS ---
  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('home'); // Redirect back if admin was open
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // --- CART CONTROLS ---
  const handleAddToCart = async (product: Product, quantity = 1, color = '', size = '') => {
    // If no specific color or size provided, take the first available from variants
    const selectedColor = color || (product.variantes[0] ? product.variantes[0].color : 'Standard');
    const selectedSize = size || (product.variantes[0] ? product.variantes[0].talla : 'One-Size');

    const success = await reserveStockInDB(product.id, selectedColor, selectedSize, quantity);
    if (!success) {
      alert(`⚠️ ¡Lo sentimos! No queda suficiente stock de ${product.nombre} (${selectedColor} - Talla ${selectedSize}) disponible para reservar.`);
      return;
    }

    const existingIndex = cartItems.findIndex(
      item => item.producto.id === product.id && 
              item.color_seleccionado === selectedColor && 
              item.talla_seleccionada === selectedSize
    );

    let updatedCart: CartItem[] = [];
    if (existingIndex > -1) {
      const list = [...cartItems];
      list[existingIndex].cantidad += quantity;
      updatedCart = list;
    } else {
      updatedCart = [...cartItems, {
        producto: product,
        cantidad: quantity,
        color_seleccionado: selectedColor,
        talla_seleccionada: selectedSize
      }];
    }
    
    setCartItems(updatedCart);
    localStorage.setItem('slate_cart', JSON.stringify(updatedCart));
    
    // Auto feedback
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = async (idx: number, quantity: number) => {
    const list = [...cartItems];
    const item = list[idx];
    const oldQuantity = item.cantidad;
    const diff = quantity - oldQuantity;

    if (diff > 0) {
      // Trying to add more quantity -> Reserve more stock
      const success = await reserveStockInDB(item.producto.id, item.color_seleccionado, item.talla_seleccionada, diff);
      if (!success) {
        alert(`⚠️ ¡Lo sentimos! No queda suficiente stock disponible para aumentar la cantidad.`);
        return;
      }
    } else if (diff < 0) {
      // Decreasing quantity -> Release stock
      await releaseStockInDB(item.producto.id, item.color_seleccionado, item.talla_seleccionada, Math.abs(diff));
    }

    list[idx].cantidad = quantity;
    setCartItems(list);
    localStorage.setItem('slate_cart', JSON.stringify(list));
  };

  const handleRemoveItem = async (idx: number) => {
    const list = [...cartItems];
    const item = list[idx];
    
    // Release the stock
    await releaseStockInDB(item.producto.id, item.color_seleccionado, item.talla_seleccionada, item.cantidad);

    list.splice(idx, 1);
    setCartItems(list);
    localStorage.setItem('slate_cart', JSON.stringify(list));
  };

  // --- DISCOUNTS COUPON EVALUATION ---
  const handleApplyCoupon = async (code: string): Promise<boolean> => {
    const coupon = coupons.find(c => c.id === code);
    if (coupon) {
      // Check expiration if any
      const today = new Date().toISOString().split('T')[0];
      if (coupon.fecha_expiracion && today > coupon.fecha_expiracion) {
        return false;
      }
      setAppliedCoupon(coupon);
      return true;
    }
    return false;
  };

  // --- ORDER PLACEMENT ---
  const handlePlaceOrder = async (order: Order) => {
    await createOrderInDB(order);
  };

  // --- REVIEWS ---
  const handleAddReview = async (productId: string, rating: number, comentario: string) => {
    if (!user) return false;
    try {
      const reviewData: Omit<Review, 'id'> = {
        producto_id: productId,
        usuario_id: user.uid,
        usuario_nombre: user.nombre || user.email || 'Usuario',
        rating,
        comentario,
        fecha_creacion: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      return true;
    } catch (error) {
      console.error("Error adding review:", error);
      return false;
    }
  };

  // --- METRICS & FILTERED PRODUCTS ---
  const filteredProducts = products.filter(p => {
    const matchesGender = p.genero === currentGender;
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentCategory === 'New in') {
      return matchesGender && matchesSearch;
    } else {
      return matchesGender && p.categoria === currentCategory && matchesSearch;
    }
  });

  // Calculate cart counts
  const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  // Carousel product filter (Muestra de 2 productos destacados en tarjetas grandes con flechas)
  const promoItems = products.filter(p => p.genero === currentGender);
  const displayPromoPair = promoItems.length >= 2 
    ? [promoItems[carouselIndex % promoItems.length], promoItems[(carouselIndex + 1) % promoItems.length]]
    : promoItems;

  const nextPromoSlide = () => {
    if (promoItems.length <= 2) return;
    setCarouselIndex((prev) => (prev + 1) % promoItems.length);
  };

  const prevPromoSlide = () => {
    if (promoItems.length <= 2) return;
    setCarouselIndex((prev) => (prev - 1 + promoItems.length) % promoItems.length);
  };

  return (
    <div id="slate-storefront-app" className="bg-[#F8F9FA] min-h-screen relative font-sans text-gray-900">
      
      {/* Sticky Left Sidebar Navigation */}
      {currentPage !== 'admin' && (
        <Sidebar
          currentCategory={currentCategory}
          onCategoryChange={setCurrentCategory}
          isAdminUser={!!user?.esAdmin}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Top Navbar Actions Header */}
      {currentPage !== 'admin' && (
        <Header
          currentGender={currentGender}
          onGenderChange={setCurrentGender}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />
      )}

      {/* --- CONTENT ROUTER VIEWS --- */}
      <main id="main-content-window" className="relative transition-all duration-300">
        
        {/* VIEW 1: HOME CATALOG VIEW */}
        {currentPage === 'home' && (
          <div id="home-store-page" className="lg:ml-64 p-4 md:p-10 space-y-12 animate-fade-in bg-[#F8F9FA]">
            
            {/* Grid Banners Promocionales (dynamic CMS config) */}
            <section id="promo-banners-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banner Left */}
              <div 
                id="banner-promo-1"
                style={{ backgroundColor: homeConfig.banner1_bg || '#F4EBE1' }} 
                className="p-8 md:p-10 rounded-[16px] flex flex-col justify-center aspect-[2.2/1] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C757D]">Oferta Especial Boutique</span>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#1A1A1A] leading-tight max-w-[280px] mt-2 tracking-tight">
                  {homeConfig.banner1_texto || 'HASTA 50% DE DCTO por temporada navideña'}
                </h2>
                <button 
                  onClick={() => setCurrentCategory('Outlet')}
                  className="mt-5 text-[12px] font-bold underline underline-offset-4 tracking-wider uppercase text-[#1A1A1A] cursor-pointer text-left w-fit"
                >
                  COMPRAR AHORA
                </button>
              </div>

              {/* Banner Right */}
              <div 
                id="banner-promo-2"
                style={{ backgroundColor: homeConfig.banner2_bg || '#AEE5E5' }} 
                className="p-8 md:p-10 rounded-[16px] flex flex-col justify-center aspect-[2.2/1] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C757D]">Nueva Colección</span>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#1A1A1A] leading-tight max-w-[280px] mt-2 tracking-tight">
                  {homeConfig.banner2_texto || 'HASTA 30% DE DCTO EN CAMISAS ⚡'}
                </h2>
                <button 
                  onClick={() => setCurrentCategory('ActiveWear')}
                  className="mt-5 text-[12px] font-bold underline underline-offset-4 tracking-wider uppercase text-[#1A1A1A] cursor-pointer text-left w-fit"
                >
                  EXPLORAR OFERTAS
                </button>
              </div>
            </section>

            {/* Carrusel Lateral Destacados (Muestra de 2 productos grandes) */}
            {displayPromoPair.length > 0 && (
              <section id="featured-carousel-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-semibold text-[#6C757D] uppercase tracking-wider">Selección Premium</h3>
                    <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tighter mt-1">Productos Destacados</h2>
                  </div>
                  {/* Circle navigation arrows */}
                  <div className="flex gap-2">
                    <button 
                      onClick={prevPromoSlide}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-150/40 hover:bg-[#F2F2F5] rounded-full text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={nextPromoSlide}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-150/40 hover:bg-[#F2F2F5] rounded-full text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayPromoPair.map((p, idx) => (
                    <div 
                      key={p.id + idx}
                      onClick={() => setActiveProductDetail(p)}
                      className="group bg-white rounded-[16px] p-6 border border-gray-150/50 flex items-center gap-6 cursor-pointer hover:shadow-sm transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Big image preview */}
                      <div className="w-1/3 aspect-[3/4] rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img 
                          src={p.imagenes[0]} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between h-full py-2">
                        <div>
                          <span className="text-[10px] font-semibold text-[#6C757D] uppercase tracking-wider">{p.marca}</span>
                          <h4 className="text-[16px] font-bold text-[#1A1A1A] mt-1 line-clamp-2 leading-snug tracking-tight">{p.nombre}</h4>
                          <p className="text-[11px] text-[#6C757D] font-semibold uppercase tracking-wider mt-1">{p.categoria}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-4">
                          <div className="flex items-baseline gap-2">
                            {p.precio_descuento !== null ? (
                              <>
                                <span className="text-[16px] font-bold text-[#1A1A1A]">{formatPrice(p.precio_descuento)}</span>
                                <span className="text-[14px] text-[#6C757D] line-through">{formatPrice(p.precio_regular)}</span>
                              </>
                            ) : (
                              <span className="text-[16px] font-bold text-[#1A1A1A]">{formatPrice(p.precio_regular)}</span>
                            )}
                          </div>
                          <span className="text-[12px] font-bold text-[#1A1A1A] hover:text-[#E63946] underline underline-offset-4 flex items-center gap-1">
                            Explorar Artículo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Grid Productos */}
            <section id="products-catalog-section" className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tighter">
                  {currentCategory === 'New in' ? `Novedades` : `${currentCategory}`}
                </h2>
                <span className="text-[12px] text-[#6C757D] font-medium">
                  Mostrando {filteredProducts.length} productos
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div id="no-products-state" className="text-center py-16 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs font-bold text-gray-900 mt-2">No se encontraron artículos con estos criterios</p>
                  <p className="text-[11px] text-gray-400 mt-1">Intenta relajar los filtros o términos de búsqueda.</p>
                </div>
              ) : (
                <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      reviews={reviews.filter(r => r.producto_id === p.id)}
                      onProductClick={setActiveProductDetail}
                      onAddToCart={(product) => handleAddToCart(product, 1)}
                    />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

        {/* VIEW 2: MULTI-STEP CHECKOUT VIEW */}
        {currentPage === 'checkout' && (
          <CheckoutView
            cartItems={cartItems}
            appliedCoupon={appliedCoupon}
            user={user}
            onPlaceOrder={handlePlaceOrder}
            onClearCart={() => setCartItems([])}
            onNavigateHome={() => { setCurrentPage('home'); setAppliedCoupon(null); }}
          />
        )}

        {/* VIEW 3: ADMINISTRATIVE DASHBOARD */}
        {currentPage === 'admin' && (
          <AdminPanel
            products={products}
            orders={orders}
            coupons={coupons}
            homeConfig={homeConfig}
            user={user}
            onAddProduct={addProductToDB}
            onUpdateProduct={updateProductInDB}
            onDeleteProduct={deleteProductFromDB}
            onAddCoupon={addCouponToDB}
            onDeleteCoupon={deleteCouponFromDB}
            onUpdateOrderStatus={updateOrderStatusInDB}
            onUpdateHomeConfig={updateHomeConfigInDB}
            onClose={() => setCurrentPage('home')}
          />
        )}

      </main>

      {/* --- DRAWERS AND OVERLAYS MODALS --- */}

      {/* Side Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => { setIsCartOpen(false); setCurrentPage('checkout'); }}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon(null)}
      />

      {/* Floating detail model modal */}
      {activeProductDetail && (
        <ProductDetailsModal
          product={activeProductDetail}
          user={user}
          onClose={() => setActiveProductDetail(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Auth Modal for Email & Password */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => setUser(profile)}
      />

    </div>
  );
}
