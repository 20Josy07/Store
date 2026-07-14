/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart
}: ProductCardProps) {
  const hasDiscount = product.precio_descuento !== null && product.precio_descuento !== undefined;
  const totalStock = product.variantes ? product.variantes.reduce((acc, v) => acc + v.stock, 0) : 0;
  const isAgotado = totalStock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAgotado) return;
    onAddToCart(product);
  };

  const translateCategory = (cat: string) => {
    const map: Record<string, string> = {
      'New in': 'Novedades',
      'Clothing': 'Ropa',
      'Shoes': 'Calzado',
      'Accessories': 'Accesorios',
      'ActiveWear': 'Deporte',
      'Outlet': 'Outlet'
    };
    return map[cat] || cat;
  };

  // Assign background colors to stage matching the "Natural Tones" palette:
  // Women -> soft pink (#FDECEF)
  // Shoes category -> cool slate-blue (#F4F5F7)
  // Others -> warm neutral gray (#F2F2F5)
  const stageBg = product.genero === 'Women' 
    ? 'bg-[#FDECEF]' 
    : product.categoria === 'Shoes' 
      ? 'bg-[#F4F5F7]' 
      : 'bg-[#F2F2F5]';

  return (
    <div 
      id={`product-card-${product.id}`}
      onClick={() => onProductClick(product)}
      className="group relative flex flex-col cursor-pointer transition-all duration-300"
    >
      {/* Product Image Stage */}
      <div className={`relative aspect-[3/4] w-full overflow-hidden ${stageBg} rounded-[16px] flex items-center justify-center`}>
        <img
          src={product.imagenes[0]}
          alt={product.nombre}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover object-center transition-all duration-700 group-hover:scale-105 rounded-[16px] ${isAgotado ? 'opacity-40 grayscale-[30%]' : ''}`}
        />

        {/* Brand Tag overlay */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm text-[9px] font-bold tracking-wider text-gray-800 uppercase">
          {product.marca}
        </div>

        {/* Promo tag if discount */}
        {hasDiscount && !isAgotado && (
          <div className="absolute top-4 right-4 bg-[#E63946] text-white px-3 py-1.5 rounded-full shadow-sm text-[10px] font-extrabold tracking-wider animate-pulse">
            OFERTA
          </div>
        )}

        {/* AGOTADO elegant overlay */}
        {isAgotado && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center rounded-[16px] z-10">
            <span className="bg-black/80 text-white border border-white/20 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">
              Agotado
            </span>
          </div>
        )}

        {/* Hover quick add floating bag button (elegant white circle with shadow) */}
        {!isAgotado && (
          <button
            id={`btn-quick-add-${product.id}`}
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white hover:text-[#E63946] text-gray-900 rounded-full flex items-center justify-center shadow-lg transform translate-y-12 group-hover:translate-y-0 transition-all duration-300 opacity-0 md:group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4 text-[#1A1A1A]" />
          </button>
        )}
      </div>

      {/* Product Meta Info */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] text-[#6C757D] uppercase tracking-wider font-semibold">
            {product.marca} • {translateCategory(product.categoria)}
          </span>
          <h3 className="text-[14px] text-[#1A1A1A] font-medium mt-1 line-clamp-1 group-hover:text-gray-700 transition-colors">
            {product.nombre}
          </h3>
        </div>

        {/* Prices Row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-2">
            {hasDiscount ? (
              <>
                <span className="text-[16px] font-semibold text-[#1A1A1A]">
                  ${product.precio_descuento}
                </span>
                <span className="text-[14px] text-[#6C757D] line-through">
                  ${product.precio_regular}
                </span>
              </>
            ) : (
              <span className="text-[16px] font-semibold text-[#1A1A1A]">
                ${product.precio_regular}
              </span>
            )}
          </div>

          {/* Quick Add link (Visible on mobile/tablet) */}
          {isAgotado ? (
            <span className="text-[10px] font-bold text-[#E63946] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
              Agotado
            </span>
          ) : (
            <button 
              id={`btn-mobile-add-${product.id}`}
              onClick={handleAddToCart}
              className="md:hidden text-[12px] font-bold text-gray-950 hover:text-[#E63946] underline underline-offset-4"
            >
              + Añadir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
