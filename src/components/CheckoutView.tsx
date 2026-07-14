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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Address Form State
  const [address, setAddress] = useState<ShippingAddress>({
    nombre: user?.nombre || '',
    email: user?.email || '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
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

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (validateAddress()) {
        handleCreateOrderInDB();
      }
    }
  };

  const handleCreateOrderInDB = async () => {
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
      setStep(3);
    } catch (err) {
      setFormErrors('No se pudo registrar el pedido. Verifica tu conexión a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "573197995950";
    const itemsList = cartItems.length > 0 
      ? cartItems.map(item => `- ${item.producto.nombre} (${item.color_seleccionado}/${item.talla_seleccionada}) x${item.cantidad}`).join('\n')
      : "Items del pedido (ver en el panel)";

    const message = `🛍️ *NUEVO PEDIDO - STORE*\n\n` +
      `*ID del Pedido:* ${createdOrderId}\n` +
      `*Cliente:* ${address.nombre}\n` +
      `*Teléfono:* ${address.telefono}\n` +
      `*Dirección:* ${address.direccion}, ${address.ciudad}\n\n` +
      `*Productos:*\n${itemsList}\n\n` +
      `*Total a Pagar:* ${formatPrice(finalTotal)}\n\n` +
      `_Hola, acabo de realizar un pedido. Adjunto el ID para coordinar el pago._`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div id="checkout-view" className="lg:ml-64 ml-0 px-4 md:px-8 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Stepper bar */}
        <div id="checkout-stepper" className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { s: 1, label: 'Resumen', icon: ShoppingBag },
            { s: 2, label: 'Datos y Envío', icon: MapPin },
            { s: 3, label: 'Confirmación', icon: CheckCircle2 }
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
                {item.s < 3 && <ChevronRight className="w-4 h-4 text-gray-300 ml-2 hidden sm:block" />}
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

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button 
                  onClick={onNavigateHome}
                  className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                >
                  Continuar Comprando
                </button>
                <button
                  id="btn-checkout-to-shipping"
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow"
                >
                  Ingresar Datos de Envío
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING ADDRESS */}
          {step === 2 && (
            <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-black text-gray-950 mb-6 text-center lg:text-left">Datos Personales y Envío</h2>
              
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
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    value={address.direccion}
                    onChange={(e) => setAddress({ ...address, direccion: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="Calle 123 #45-67, Torre 1 Apto 101"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Ciudad / Municipio</label>
                  <input
                    type="text"
                    value={address.ciudad}
                    onChange={(e) => setAddress({ ...address, ciudad: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="Bogotá"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Código Postal (Opcional)</label>
                  <input
                    type="text"
                    value={address.codigo_postal}
                    onChange={(e) => setAddress({ ...address, codigo_postal: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="110111"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Número de WhatsApp (Celular)</label>
                  <input
                    type="tel"
                    value={address.telefono}
                    onChange={(e) => setAddress({ ...address, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-xs border-0 focus:ring-1 focus:ring-gray-300 text-gray-800"
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              {formErrors && <p className="text-xs font-bold text-[#E63946] mt-4">{formErrors}</p>}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold hover:text-gray-900 hover:border-gray-900 transition-colors cursor-pointer"
                >
                  Revisar Pedido
                </button>
                <button
                  id="btn-complete-order-db"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-900 hover:bg-[#E63946] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : 'Finalizar y Enviar'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & WHATSAPP REDIRECT */}
          {step === 3 && (
            <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-[32px] border border-gray-100 shadow-lg text-center flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-gray-950 tracking-tight leading-none mb-2">¡Pedido Registrado!</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-8">
                Tu pedido ha sido guardado con éxito. Para completar la compra y coordinar el pago, haz clic en el botón de WhatsApp a continuación.
              </p>

              <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl text-left max-w-md w-full space-y-4 font-semibold mb-10">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ID Único del Pedido:</span>
                  <span className="text-gray-900 font-black">{createdOrderId}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total a Pagar:</span>
                  <span className="text-gray-900 font-black">{formatPrice(finalTotal)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">Enviarás a:</span>
                  <span className="text-xs text-gray-800">{address.nombre}</span>
                  <span className="text-xs text-gray-500 font-medium truncate">{address.direccion}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  id="btn-send-whatsapp"
                  onClick={handleWhatsAppRedirect}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl text-sm font-black transition-all duration-300 shadow-xl flex items-center justify-center gap-3 cursor-pointer transform hover:scale-105"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Enviar Detalle a WhatsApp
                </button>
                
                <button
                  onClick={onNavigateHome}
                  className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest mt-2"
                >
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
