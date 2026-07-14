/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Ticket, Check } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (couponCode: string) => Promise<boolean>;
  onRemoveCoupon: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon
}: CartDrawerProps) {
  const [couponText, setCouponText] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate cart subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular;
    return acc + (price * item.cantidad);
  }, 0);

  // Calculate coupon discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.tipo === 'porcentaje') {
      // If there is category restriction
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

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponText.trim()) return;
    setCouponError('');
    setCouponSuccess(false);

    const success = await onApplyCoupon(couponText.toUpperCase());
    if (success) {
      setCouponSuccess(true);
      setCouponText('');
    } else {
      setCouponError('Código de cupón inválido, vencido o no aplicable.');
    }
  };

  const handleRemoveCouponClick = () => {
    onRemoveCoupon();
    setCouponSuccess(false);
    setCouponError('');
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-end">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Cart Container */}
      <div 
        id="cart-drawer-container" 
        className="relative w-full max-w-full sm:max-w-md bg-white h-screen flex flex-col justify-between shadow-2xl p-6 sm:p-8 z-50 rounded-none sm:rounded-l-[24px]"
        style={{ animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header */}
        <div id="cart-drawer-header" className="flex items-center justify-between pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1A1A1A] tracking-tighter">Bolsa de Compras</h2>
            <span className="bg-[#F2F2F5] text-[#1A1A1A] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cartItems.length}
            </span>
          </div>
          <button
            id="btn-close-cart"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div id="cart-items-list" className="flex-1 overflow-y-auto py-5 space-y-4">
          {cartItems.length === 0 ? (
            <div id="empty-cart-state" className="h-64 flex flex-col items-center justify-center text-center p-6">
              <span className="text-3xl mb-3">🛍️</span>
              <p className="text-xs font-bold text-[#1A1A1A]">Tu bolsa de compras está vacía</p>
              <p className="text-[11px] text-[#6C757D] mt-1 max-w-[200px]">Agrega algunos artículos minimalistas para iniciar tu compra.</p>
              <button 
                onClick={onClose}
                className="mt-4 px-5 py-2.5 bg-[#1A1A1A] text-white rounded-[12px] text-xs font-semibold hover:bg-[#E63946] transition-colors cursor-pointer"
              >
                Continuar Explorando
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => {
              const itemPrice = item.producto.precio_descuento !== null ? item.producto.precio_descuento : item.producto.precio_regular;
              return (
                <div 
                  key={idx} 
                  id={`cart-item-row-${idx}`}
                  className="flex gap-4 p-3 hover:bg-gray-50 rounded-[16px] border border-gray-100 transition-colors"
                >
                  {/* Thumb */}
                  <div className="w-16 h-20 rounded-[12px] overflow-hidden bg-gray-50 flex-shrink-0">
                    <img 
                      src={item.producto.imagenes[0]} 
                      alt={item.producto.nombre} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* Meta */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-[#1A1A1A] line-clamp-1 max-w-[150px]">{item.producto.nombre}</h4>
                        <button 
                          id={`btn-remove-cart-${idx}`}
                          onClick={() => onRemoveItem(idx)}
                          className="text-gray-400 hover:text-[#E63946] p-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-[#6C757D] mt-0.5 uppercase tracking-wider font-semibold">
                        {item.color_seleccionado} / {item.talla_seleccionada}
                      </p>
                    </div>

                    {/* Quantity Adjustment + Price Subtotal */}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-gray-200 rounded-[8px] bg-white h-7">
                        <button
                          onClick={() => onUpdateQuantity(idx, Math.max(1, item.cantidad - 1))}
                          className="px-2 text-gray-500 hover:text-[#1A1A1A] font-extrabold text-xs"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-1.5 text-[11px] font-black text-gray-850 min-w-[14px] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.cantidad + 1)}
                          className="px-2 text-gray-500 hover:text-[#1A1A1A] font-extrabold text-xs"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-[#1A1A1A]">
                        ${(itemPrice * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with checkout details and coupons */}
        {cartItems.length > 0 && (
          <div id="cart-drawer-footer" className="border-t border-gray-100 pt-5 space-y-4">
            
            {/* Promo coupons form */}
            <form id="coupon-form" onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={appliedCoupon ? `Aplicado: ${appliedCoupon.id}` : "Cupón Promocional..."}
                  value={couponText}
                  disabled={!!appliedCoupon}
                  onChange={(e) => setCouponText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F2F2F5] focus:bg-white border-0 focus:ring-1 focus:ring-gray-300 rounded-[12px] text-xs font-semibold text-[#1A1A1A] placeholder-[#6C757D] disabled:opacity-60"
                />
              </div>
              {appliedCoupon ? (
                <button
                  id="btn-remove-coupon"
                  type="button"
                  onClick={handleRemoveCouponClick}
                  className="px-3.5 bg-red-50 hover:bg-red-100 text-[#E63946] border border-red-100 rounded-[12px] text-xs font-bold transition-all cursor-pointer"
                >
                  Quitar
                </button>
              ) : (
                <button
                  id="btn-apply-coupon"
                  type="submit"
                  className="px-3.5 bg-[#1A1A1A] hover:bg-black text-white rounded-[12px] text-xs font-bold transition-all duration-300 cursor-pointer"
                >
                  Aplicar
                </button>
              )}
            </form>

            {/* Error or success validation feedback */}
            {couponError && <p className="text-[10px] font-semibold text-[#E63946]">{couponError}</p>}
            {couponSuccess && (
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> ¡Cupón aplicado correctamente!
              </p>
            )}

            {/* Price Calculations breakdown */}
            <div className="space-y-2 text-xs font-semibold text-[#6C757D] border-t border-gray-50 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#1A1A1A]">${subtotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Descuento de Cupón ({appliedCoupon.id})</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#1A1A1A] border-t border-gray-100 pt-2.5">
                <span>Total Estimado</span>
                <span>${finalTotal}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              id="btn-cart-checkout"
              onClick={onCheckout}
              className="w-full h-12 bg-[#1A1A1A] hover:bg-black text-white rounded-[16px] text-xs font-bold transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceder al Pago
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
