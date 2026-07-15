/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductVariant {
  colores: { hex: string; nombre: string }[];
  talla: string;
  stock: number;
}

export interface Product {
  id: string;
  nombre: string;
  marca?: string;
  categoria: string; // 'Clothing' | 'Shoes' | 'Accessories' | 'ActiveWear' | 'Outlet'
  genero: 'Women' | 'Men' | 'Unisex';
  precio_regular: number;
  precio_descuento: number | null;
  imagenes: string[];
  descripcion: string;
  variantes: ProductVariant[];
  materiales?: string;
  cuidado?: string;
  envio?: string;
}

export interface CartItem {
  producto: Product;
  cantidad: number;
  color_seleccionado: string;
  talla_seleccionada: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  esAdmin: boolean;
}

export interface ShippingAddress {
  nombre: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  telefono: string;
}

export interface OrderItem {
  producto_id: string;
  nombre: string;
  marca: string;
  precio_unitario: number;
  cantidad: number;
  imagen: string;
  color: string;
  talla: string;
}

export interface Order {
  id: string;
  usuario_id: string;
  items: OrderItem[];
  total: number;
  estado: 'pendiente' | 'enviado' | 'entregado';
  fecha_creacion: string;
  direccion_envio: ShippingAddress;
}

export interface Coupon {
  id: string; // The coupon code
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  fecha_expiracion: string;
  categoria_restringida: string | null;
}

export interface Review {
  id: string;
  producto_id: string;
  usuario_id: string;
  usuario_nombre: string;
  rating: number; // 1 to 5
  comentario: string;
  fecha_creacion: string;
}

export interface HomeBannerConfig {
  id: string;
  banner1_texto: string;
  banner1_bg: string;
  banner2_texto: string;
  banner2_bg: string;
}
