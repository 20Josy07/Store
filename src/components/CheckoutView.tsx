import { formatPrice } from "../lib/utils";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, MapPin, CreditCard, CheckCircle2, Home } from 'lucide-react';
import { CartItem, Coupon, ShippingAddress, Order, OrderItem } from '../types';

interface CheckoutViewProps {
  cartItems: CartItem[];
  appliedCoupon: Coupon | null;
  user: { uid: string; email: string; nombre: string; esAdmin: boolean } | null;
  onPlaceOrder: (order: Order) => Promise<void>;
  onClearCart: () => void;
  onNavigateHome: () => void;
}

export default function CheckoutView({
  cartItems,
  appliedCoupon,
  user,
  onPlaceOrder,
  onClearCart,
  onNavigateHome
}: CheckoutViewProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Address Form State
  const [address, setAddress] = useState<ShippingAddress>({
    nombre: user?.nombre || '',
    email: user?.email || '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
  });

  // Credit Card Form State
  const [card, setCard] = useState({
    name: user?.nombre || '',
    number: '',
    expiry: '',
    cvv: '',
  });

  const [formErrors, setFormErrors] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate pricing
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular;
    return acc + (price * item.cantidad);
  }, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.tipo === 'porcentaje') {
      if (appliedCoupon.categoria_restringida) {
        const restrictedItems = cartItems.filter(item => item.producto.categoria === appliedCoupon.categoria_restringida);
        const restrictedSubtotal = restrictedItems.reduce((acc, item) => {
          const price = item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular;
          return acc + (price * item.cantidad);
        }, 0);
        discountAmount = (restrictedSubtotal * appliedCoupon.valor) / 100;
      } else {
        discountAmount = (subtotal * appliedCoupon.valor) / 100;
      }
    } else if (appliedCoupon.tipo === 'fijo') {
      discountAmount = Math.min(subtotal, appliedCoupon.valor);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Address form validation
  const validateAddress = (): boolean => {
    if (!address.nombre.trim() || !address.email.trim() || !address.direccion.trim() || !address.ciudad.trim() || !address.codigo_postal.trim() || !address.telefono.trim()) {
      setFormErrors('Por favor, completa todos los campos de la dirección de envío.');
      return false;
    }
    if (!address.email.includes('@')) {
      setFormErrors('Por favor, ingresa un correo electrónico válido.');
      return false;
    }
    setFormErrors('');
    return true;
  };

  // Card validation
  const validateCard = (): boolean => {
    if (!card.name.trim() || !card.number.trim() || !card.expiry.trim() || !card.cvv.trim()) {
      setFormErrors('Por favor, completa todos tus datos de pago.');
      return false;
    }
    if (card.number.replace(/\s+/g, '').length < 16) {
      setFormErrors('El número de tarjeta debe tener 16 dígitos.');
      return false;
    }
    if (card.cvv.length < 3) {
      setFormErrors('El CVV debe tener 3 o 4 dígitos.');
      return false;
    }
    setFormErrors('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateAddress()) setStep(3);
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) return;

    setIsSubmitting(true);
    setFormErrors('');

    // Prepare order data
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderItems: OrderItem[] = cartItems.map(item => ({
      producto_id: item.producto.id,
      nombre: item.producto.nombre,
      marca: item.producto.marca,
      precio_unitario: item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular,
      cantidad: item.cantidad,
      imagen: item.producto.imagenes[0],
      color: item.color_seleccionado,
      talla: item.talla_seleccionada,
    }));

    const newOrder: Order = {
      id: orderId,
      usuario_id: user?.uid || 'anonymous',
      items: orderItems,
      total: finalTotal,
      estado: 'pendiente',
      fecha_creacion: new Date().toISOString(),
      direccion_envio: address,
    };

    try {
      await onPlaceOrder(newOrder);
      setCreatedOrderId(orderId);
      onClearCart();
      setStep(4);
    } catch (err) {
      setFormErrors('No se pudo procesar el pedido. Verifica tu conexión a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="checkout-view" className="lg:ml-64 ml-0 px-4 md:px-8 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Stepper bar */}
        <div id="checkout-stepper" className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { s: 1, label: 'Resumen', icon: ShoppingBag },
            { s: 2, label: 'Envío', icon: MapPin },
            { s: 3, label: 'Pago', icon: CreditCard },
            { s: 4, label: 'Recibo', icon: CheckCircle2 }
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = step > item.s;
            const isActive = step === item.s;
            return (
              <div key={item.s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted 
                    ? 'bg-gray-900 text-[#AEE5E5]' 
                    : isActive 
                      ? 'bg-[#E63946] text-white ring-4 ring-red-100' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : item.s}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${
                  isActive ? 'text-gray-950' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                {item.s < 4 && <ChevronRight className="w-4 h-4 text-gray-300 ml-2 hidden sm:block" />}
              </div>
            );
          })}
        </div>

        {/* Grid Contents */}
        <div id="checkout-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* STEP 1: SUMMARY */}
          {step === 1 && (
            <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-950 mb-6">Revisa el Resumen de tu Pedido</h2>
              
              <div className="space-y-4 border-b border-gray-100 pb-6 mb-6">
                {cartItems.map((item, idx) => {
                  const price = item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular;
                  return (
                    <div key={idx} className="flex items-center gap-4 py-1.5">
                      <img 
                        src={item.producto.imagenes[0]} 
                        alt={item.producto.nombre} 
                        referrerPolicy="no-referrer"
                        className="w-16 h-20 rounded-xl object-cover" 
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-950">{item.producto.nombre}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                          Talla: {item.talla_seleccionada} / Color: {item.color_seleccionado}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                          {formatPrice(price)} x {item.cantidad}
                        </p>
                      </div>
                      <span className="text-xs font-black text-gray-950">
                        {formatPrice(price * item.cantidad)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2 text-xs font-semibold text-gray-500 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal del Carrito</span>
                  <span className="text-gray-950">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Cupón de Descuento ({appliedCoupon.id})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-950 border-t border-gray-100 pt-3">
                  <span>Total del Pedido</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  onClick={onNavigateHome}
                  className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                >
                  Volver a la Tienda
                </button>
                <button
                  id="btn-checkout-to-shipping"
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow"
                >
                  Confirmar Artículos y Continuar
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING ADDRESS */}
          {step === 2 && (
            <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-950 mb-6">Ingresa la Dirección de Envío</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={address.nombre}
                    onChange={(e) => setAddress({ ...address, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Correo Electrónico de Contacto</label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    value={address.direccion}
                    onChange={(e) => setAddress({ ...address, direccion: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="Avenida Providencia 1234, Apt 401"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={address.ciudad}
                    onChange={(e) => setAddress({ ...address, ciudad: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="Santiago"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={address.codigo_postal}
                    onChange={(e) => setAddress({ ...address, codigo_postal: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="7500000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Número de Teléfono</label>
                  <input
                    type="tel"
                    value={address.telefono}
                    onChange={(e) => setAddress({ ...address, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              {formErrors && <p className="text-xs font-bold text-[#E63946] mt-4">{formErrors}</p>}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                >
                  Volver al Resumen
                </button>
                <button
                  id="btn-checkout-to-payment"
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY */}
          {step === 3 && (
            <>
              {/* Payment Card Customizer */}
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-950 mb-6">Detalles de la Tarjeta de Pago</h2>
                  
                  <form onSubmit={handleCompleteOrder} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre del Titular</label>
                      <input
                        type="text"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                        placeholder="JANE DOE"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Número de Tarjeta</label>
                      <input
                        type="text"
                        value={card.number}
                        maxLength={19}
                        onChange={(e) => {
                          // Simple space formatting for card
                          const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const matches = v.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];
                          for (let i = 0, len = match.length; i < len; i += 4) {
                            parts.push(match.substring(i, i + 4));
                          }
                          setCard({ ...card, number: parts.length > 0 ? parts.join(' ') : v });
                        }}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                        placeholder="4512 8812 3456 7890"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Fecha de Expiración</label>
                        <input
                          type="text"
                          value={card.expiry}
                          placeholder="MM/YY"
                          maxLength={5}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            }
                            setCard({ ...card, expiry: val });
                          }}
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Código de Seguridad (CVV)</label>
                        <input
                          type="password"
                          value={card.cvv}
                          maxLength={4}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </form>

                  {formErrors && <p className="text-xs font-bold text-[#E63946] mt-4">{formErrors}</p>}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                  >
                    Volver al Envío
                  </button>
                  <button
                    id="btn-place-order"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow flex items-center gap-2"
                  >
                    {isSubmitting ? 'Verificando...' : `Pagar ${formatPrice(finalTotal)}`}
                  </button>
                </div>
              </div>

              {/* Minimalist Visual Credit Card Mockup */}
              <div className="lg:col-span-1 flex flex-col justify-between gap-6">
                <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 p-6 rounded-[24px] text-white shadow-xl relative aspect-[1.58/1] overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12" />
                  
                  <div className="flex justify-between items-start">
                    <span className="font-display font-black text-lg tracking-widest text-white">SLATE.</span>
                    <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">E-Commerce</span>
                  </div>

                  <div className="mt-10 font-mono text-base tracking-widest select-none">
                    {card.number || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex justify-between items-end mt-8 border-t border-white/10 pt-4">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider opacity-40 font-semibold block">Titular</span>
                      <span className="text-xs tracking-wider uppercase font-bold max-w-[120px] truncate block">
                        {card.name || 'JANE DOE'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-wider opacity-40 font-semibold block">Vence</span>
                      <span className="text-xs font-bold">{card.expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* Short review box */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">Resumen de Entrega</h3>
                  <div className="space-y-1.5 text-xs text-gray-500 font-semibold">
                    <p className="text-gray-900">{address.nombre}</p>
                    <p className="truncate">{address.direccion}</p>
                    <p>{address.ciudad}, {address.codigo_postal}</p>
                    <p className="pt-2 border-t border-gray-50 text-gray-900 mt-2 font-black flex justify-between">
                      <span>Total a cobrar:</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 4 && (
            <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-[32px] border border-gray-100 shadow-lg text-center flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-950 tracking-tight leading-none mb-2">¡Pedido Confirmado!</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                Gracias por comprar en SLATE. Tu pedido ha sido registrado en nuestros sistemas y ya se encuentra en proceso.
              </p>

              <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl text-left max-w-md w-full space-y-3 font-semibold mb-8">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ID de Referencia del Pedido:</span>
                  <span className="text-gray-900 font-bold">{createdOrderId}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Destinatario:</span>
                  <span className="text-gray-900">{address.nombre}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Dirección de Entrega:</span>
                  <span className="text-gray-900 max-w-[200px] truncate text-right">{address.direccion}</span>
                </div>
                <div className="flex justify-between text-xs text-[#E63946] font-bold">
                  <span>Total Pagado:</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between text-xs text-emerald-600 font-extrabold">
                  <span>Entrega Estimada:</span>
                  <span>2-4 Días Hábiles</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  id="btn-return-home"
                  onClick={onNavigateHome}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow flex items-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Volver a la Tienda
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
