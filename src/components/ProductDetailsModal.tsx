/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, ShieldCheck, Truck, RefreshCw, ShoppingCart } from 'lucide-react';
import { Product, ProductVariant } from '../types';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color: string, size: string) => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart
}: ProductDetailsModalProps) {
  // Extract unique colors and sizes from variants
  const colors = Array.from(new Set(product.variantes.map(v => v.color)));
  const sizes = Array.from(new Set(product.variantes.map(v => v.talla)));

  // States
  const [selectedImage, setSelectedImage] = useState(product.imagenes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('materials');

  // Sync selected image if product changes
  useEffect(() => {
    setSelectedImage(product.imagenes[0]);
    if (colors.length > 0) setSelectedColor(colors[0]);
    if (sizes.length > 0) setSelectedSize(sizes[0]);
    setQuantity(1);
  }, [product]);

  // Find stock for selected variant
  const currentVariant = product.variantes.find(
    v => v.color === selectedColor && v.talla === selectedSize
  );
  const availableStock = currentVariant ? currentVariant.stock : 0;

  // Materials and care content templates
  const materialsText = "Woven from 100% GOTS certified organic fibers, utilizing local rainfall irrigation methods and colored with organic water-based dyes. High-density weave offers durable structures with zero skin-irritant synthetics.";
  const careText = "Machine wash on cold/delicate cycles with phosphate-free liquid detergent. Do not bleach. Tumble dry on minimal heat or hang flat under ambient shade to maintain fiber elasticity.";
  const shippingText = "Enjoy complimentary premium carbon-neutral home delivery on all purchases above $100. Standard courier dispatches take 2-4 business days. Returns accepted within 30 days of arrival.";

  const handleAdd = () => {
    if (availableStock <= 0) {
      alert("This specific size and color is currently out of stock!");
      return;
    }
    onAddToCart(product, quantity, selectedColor, selectedSize);
    onClose();
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  return (
    <div id="product-details-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        id="product-details-container" 
        className="bg-white rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-2xl"
      >
        {/* Close Button */}
        <button
          id="btn-close-details"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-all duration-200 z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Gallery */}
        <div id="details-gallery" className="w-full md:w-1/2 flex flex-col gap-4">
          {/* Breadcrumbs */}
          <nav className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <span className="hover:text-gray-600 cursor-pointer">Store</span>
            <span>/</span>
            <span className="hover:text-gray-600 cursor-pointer">{product.categoria}</span>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[120px]">{product.nombre}</span>
          </nav>

          {/* Large Main Image */}
          <div className="relative aspect-[4/5] rounded-[16px] overflow-hidden bg-gray-50 border border-gray-100">
            <img
              src={selectedImage}
              alt={product.nombre}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
          </div>

          {/* Thumbnail Strip */}
          {product.imagenes.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {product.imagenes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-[12px] overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img ? 'border-[#1A1A1A] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Customizations */}
        <div id="details-customizer" className="w-full md:w-1/2 flex flex-col justify-between pt-4">
          <div>
            {/* Header / Brand info */}
            <span className="text-xs font-black text-gray-400 tracking-wider uppercase">
              {product.marca}
            </span>
            <h1 className="text-2xl font-black text-gray-950 mt-1 tracking-tight leading-none">
              {product.nombre}
            </h1>

            {/* Price section */}
            <div className="flex items-center gap-3 mt-3">
              {product.precio_descuento !== null ? (
                <>
                  <span className="text-xl font-black text-[#E63946]">
                    ${product.precio_descuento}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${product.precio_regular}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-950">
                  ${product.precio_regular}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed mt-4 border-t border-gray-100 pt-4">
              {product.descripcion}
            </p>

            {/* Color Swatch Selector */}
            {colors.length > 0 && (
              <div className="mt-5">
                <span className="text-xs font-bold text-gray-900 block mb-2">
                  Color: <span className="text-gray-500 font-medium">{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color) => {
                    // Quick swatch background mapping (fallback to slate)
                    const normalized = color.toLowerCase();
                    let swatchStyle = "bg-gray-200";
                    if (normalized.includes('black') || normalized.includes('raven') || normalized.includes('obsidian')) swatchStyle = "bg-gray-900";
                    else if (normalized.includes('white') || normalized.includes('ecrù') || normalized.includes('cream')) swatchStyle = "bg-white border border-gray-200";
                    else if (normalized.includes('grey') || normalized.includes('slate')) swatchStyle = "bg-slate-400";
                    else if (normalized.includes('green') || normalized.includes('sage')) swatchStyle = "bg-[#CCD5AE]";
                    else if (normalized.includes('rose') || normalized.includes('pink')) swatchStyle = "bg-[#FEC5BB]";
                    else if (normalized.includes('navy')) swatchStyle = "bg-blue-900";
                    else if (normalized.includes('camel') || normalized.includes('sand') || normalized.includes('mocha') || normalized.includes('oat')) swatchStyle = "bg-[#DDBDF1]";

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full ${swatchStyle} transition-all relative ${
                          selectedColor === color 
                            ? 'ring-2 ring-[#1A1A1A] ring-offset-2 scale-110 shadow-sm' 
                            : 'hover:scale-105 opacity-90'
                        }`}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Swatch Selector */}
            {sizes.length > 0 && (
              <div className="mt-5">
                <span className="text-xs font-bold text-gray-900 block mb-2">
                  Size: <span className="text-gray-500 font-medium">{selectedSize}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isSizeActive = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[40px] h-10 px-3 rounded-[12px] text-xs font-bold border transition-all duration-200 cursor-pointer ${
                          isSizeActive
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status indicator */}
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold">
              {availableStock > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-600">{availableStock} items in stock for this selection</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#E63946]" />
                  <span className="text-[#E63946]">This combination is currently Sold Out</span>
                </>
              )}
            </div>
          </div>

          {/* Action Row & Accordions */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            {/* Quantity Selector + Add to bag button */}
            <div className="flex items-center gap-3">
              {availableStock > 0 && (
                <div className="flex items-center border border-gray-200 rounded-[12px] bg-gray-50 h-12">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:text-gray-900 font-extrabold text-sm"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-black text-[#1A1A1A] min-w-[20px] text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="px-3 py-1 text-gray-600 hover:text-[#1A1A1A] font-extrabold text-sm"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                id="btn-add-to-cart-full"
                onClick={handleAdd}
                disabled={availableStock <= 0}
                className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-[16px] text-xs font-bold transition-all duration-300 ${
                  availableStock > 0
                    ? 'bg-[#1A1A1A] hover:bg-[#E63946] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {availableStock > 0 ? 'Add to Shopping Bag' : 'Sold Out'}
              </button>
            </div>

            {/* Accordions */}
            <div id="details-accordions" className="mt-6 space-y-2 border-t border-gray-100 pt-4">
              {/* Materials */}
              <div className="border-b border-gray-50 pb-2">
                <button
                  onClick={() => toggleAccordion('materials')}
                  className="w-full flex items-center justify-between text-left py-2.5 text-xs font-bold text-gray-800 hover:text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gray-400" /> Materials & Ethics
                  </span>
                  {activeAccordion === 'materials' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {activeAccordion === 'materials' && (
                  <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-1 pb-2">
                    {materialsText}
                  </p>
                )}
              </div>

              {/* Care Instructions */}
              <div className="border-b border-gray-50 pb-2">
                <button
                  onClick={() => toggleAccordion('care')}
                  className="w-full flex items-center justify-between text-left py-2.5 text-xs font-bold text-gray-800 hover:text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-gray-400" /> Care Instructions
                  </span>
                  {activeAccordion === 'care' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {activeAccordion === 'care' && (
                  <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-1 pb-2">
                    {careText}
                  </p>
                )}
              </div>

              {/* Shipping & Returns */}
              <div className="pb-1">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between text-left py-2.5 text-xs font-bold text-gray-800 hover:text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" /> Shipping & Free Returns
                  </span>
                  {activeAccordion === 'shipping' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {activeAccordion === 'shipping' && (
                  <p className="text-[11px] text-gray-500 leading-relaxed px-1 pt-1 pb-2">
                    {shippingText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
