/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Coupon } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // --- Women Activewear ---
  {
    id: "prod_w_act_1",
    nombre: "Seamless Ribbed Set",
    marca: "NÖRDIC ACTIVE",
    categoria: "ActiveWear",
    genero: "Women",
    precio_regular: 70,
    precio_descuento: 49,
    imagenes: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "High-performance ribbed fabric set. Features a medium support sports bra and high-waist compressive leggings designed for absolute comfort and breathability.",
    variantes: [
      { colores: [{ hex: "#708090", nombre: "Slate Grey" }], talla: "S", stock: 15 },
      { colores: [{ hex: "#708090", nombre: "Slate Grey" }], talla: "M", stock: 20 },
      { colores: [{ hex: "#9DC183", nombre: "Sage Green" }], talla: "M", stock: 10 },
      { colores: [{ hex: "#9DC183", nombre: "Sage Green" }], talla: "L", stock: 8 }
    ]
  },
  {
    id: "prod_w_act_2",
    nombre: "High-Waist Pro Leggings",
    marca: "NÖRDIC ACTIVE",
    categoria: "ActiveWear",
    genero: "Women",
    precio_regular: 55,
    precio_descuento: 39,
    imagenes: [
      "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Engineered with sweat-wicking materials and four-way stretch fabric. Side pockets integrated for key essentials during your high-intensity cardio sessions.",
    variantes: [
      { colores: [{ hex: "#28282B", nombre: "Matte Black" }], talla: "XS", stock: 5 },
      { colores: [{ hex: "#28282B", nombre: "Matte Black" }], talla: "S", stock: 25 },
      { colores: [{ hex: "#28282B", nombre: "Matte Black" }], talla: "M", stock: 30 }
    ]
  },
  {
    id: "prod_w_act_3",
    nombre: "Aero Dry Sports Crop",
    marca: "AURA STUDIO",
    categoria: "ActiveWear",
    genero: "Women",
    precio_regular: 29,
    precio_descuento: null,
    imagenes: [
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Ultra-lightweight crop top with breathable mesh panels. Ideal for layering over bras or wearing standalone during yoga sessions.",
    variantes: [
      { colores: [{ hex: "#FAF9F6", nombre: "Off-White" }], talla: "S", stock: 12 },
      { colores: [{ hex: "#FAF9F6", nombre: "Off-White" }], talla: "M", stock: 18 },
      { colores: [{ hex: "#C08081", nombre: "Dusty Rose" }], talla: "S", stock: 10 }
    ]
  },
  {
    id: "prod_w_act_4",
    nombre: "Zip-Up Training Jacket",
    marca: "SLATE STUDIO",
    categoria: "ActiveWear",
    genero: "Women",
    precio_regular: 80,
    precio_descuento: 59,
    imagenes: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Slim fit running jacket with secure-zip pockets and thumbholes. Wind-resistant front panel keeps you warm during morning runs.",
    variantes: [
      { colores: [{ hex: "#000080", nombre: "Midnight Navy" }], talla: "S", stock: 8 },
      { colores: [{ hex: "#000080", nombre: "Midnight Navy" }], talla: "M", stock: 12 },
      { colores: [{ hex: "#FAF9F6", nombre: "Off-White" }], talla: "M", stock: 6 }
    ]
  },

  // --- Men Activewear ---
  {
    id: "prod_m_act_1",
    nombre: "Apex Knit Shorts",
    marca: "NÖRDIC ACTIVE",
    categoria: "ActiveWear",
    genero: "Men",
    precio_regular: 35,
    precio_descuento: null,
    imagenes: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Lightweight and stretchy training shorts designed for maximum mobility. Features an internal drawcord and quick-access back zipper pocket.",
    variantes: [
      { colores: [{ hex: "#0B0B0B", nombre: "Obsidian" }], talla: "M", stock: 22 },
      { colores: [{ hex: "#0B0B0B", nombre: "Obsidian" }], talla: "L", stock: 15 },
      { colores: [{ hex: "#9AA2A4", nombre: "Heather Grey" }], talla: "L", stock: 14 }
    ]
  },
  {
    id: "prod_m_act_2",
    nombre: "Tech Fabric Performance Hoodie",
    marca: "SLATE STUDIO",
    categoria: "ActiveWear",
    genero: "Men",
    precio_regular: 90,
    precio_descuento: 65,
    imagenes: [
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Premium performance hoodie crafted from structured neoprene-blend fabric. Ergonomic sleeves and adjustable hood deliver structured style on and off the field.",
    variantes: [
      { colores: [{ hex: "#36454F", nombre: "Charcoal" }], talla: "S", stock: 10 },
      { colores: [{ hex: "#36454F", nombre: "Charcoal" }], talla: "M", stock: 15 },
      { colores: [{ hex: "#36454F", nombre: "Charcoal" }], talla: "L", stock: 12 }
    ]
  },

  // --- Clothing Women ---
  {
    id: "prod_w_clo_1",
    nombre: "Minimalist Linen Trench Coat",
    marca: "STUDIO MINIMAL",
    categoria: "Clothing",
    genero: "Women",
    precio_regular: 180,
    precio_descuento: 120,
    imagenes: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Flowy, relaxed-fit linen blend trench coat. Double-breasted layout with storm flaps and structured belt. The ultimate modern layering piece for spring and autumn.",
    variantes: [
      { colores: [{ hex: "#C6AC8C", nombre: "Sand Dune" }], talla: "XS", stock: 4 },
      { colores: [{ hex: "#C6AC8C", nombre: "Sand Dune" }], talla: "S", stock: 10 },
      { colores: [{ hex: "#C6AC8C", nombre: "Sand Dune" }], talla: "M", stock: 12 }
    ]
  },
  {
    id: "prod_w_clo_2",
    nombre: "Organic Cotton Dress",
    marca: "STUDIO MINIMAL",
    categoria: "Clothing",
    genero: "Women",
    precio_regular: 85,
    precio_descuento: null,
    imagenes: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "A-line summer dress woven in breathable GOTS-certified organic cotton. Side seam pockets and soft, adjustable straps provide functional comfort.",
    variantes: [
      { colores: [{ hex: "#C2B280", nombre: "Ecrú" }], talla: "S", stock: 14 },
      { colores: [{ hex: "#C2B280", nombre: "Ecrú" }], talla: "M", stock: 16 },
      { colores: [{ hex: "#9DC183", nombre: "Sage Green" }], talla: "S", stock: 8 }
    ]
  },

  // --- Clothing Men ---
  {
    id: "prod_m_clo_1",
    nombre: "Premium Merino Sweater",
    marca: "NÖRDIC CLASSIC",
    categoria: "Clothing",
    genero: "Men",
    precio_regular: 95,
    precio_descuento: null,
    imagenes: [
      "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Knitted from ultra-fine Australian merino wool. Offers self-regulating thermal properties and an elegant structured collar ideal for smart casual wear.",
    variantes: [
      { colores: [{ hex: "#A38068", nombre: "Mocha" }], talla: "M", stock: 10 },
      { colores: [{ hex: "#A38068", nombre: "Mocha" }], talla: "L", stock: 12 },
      { colores: [{ hex: "#FFFDD0", nombre: "Cream" }], talla: "M", stock: 8 }
    ]
  },
  {
    id: "prod_m_clo_2",
    nombre: "Structured Overshirt",
    marca: "SLATE STUDIO",
    categoria: "Clothing",
    genero: "Men",
    precio_regular: 85,
    precio_descuento: 59,
    imagenes: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Heavyweight cotton drill overshirt with matte horn buttons. Dual chest pockets and square hem. Perfect as a lightweight jacket in transition seasons.",
    variantes: [
      { colores: [{ hex: "#C19A6B", nombre: "Camel" }], talla: "S", stock: 6 },
      { colores: [{ hex: "#C19A6B", nombre: "Camel" }], talla: "M", stock: 14 },
      { colores: [{ hex: "#C19A6B", nombre: "Camel" }], talla: "L", stock: 10 }
    ]
  },

  // --- Shoes Women ---
  {
    id: "prod_w_sho_1",
    nombre: "Chunky Leather Boots",
    marca: "KINETIC SHU",
    categoria: "Shoes",
    genero: "Women",
    precio_regular: 210,
    precio_descuento: 140,
    imagenes: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Tough-wearing calfskin leather boots with deep lug soles. Features lateral elastic gussets and custom heel pull tabs for easy slip-on comfort.",
    variantes: [
      { colores: [{ hex: "#1B1B1B", nombre: "Raven Black" }], talla: "37", stock: 6 },
      { colores: [{ hex: "#1B1B1B", nombre: "Raven Black" }], talla: "38", stock: 10 },
      { colores: [{ hex: "#1B1B1B", nombre: "Raven Black" }], talla: "39", stock: 8 }
    ]
  },

  // --- Shoes Men ---
  {
    id: "prod_m_sho_1",
    nombre: "Minimalist Leather Trainers",
    marca: "KINETIC SHU",
    categoria: "Shoes",
    genero: "Men",
    precio_regular: 130,
    precio_descuento: 99,
    imagenes: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Full-grain Italian leather sneakers with custom margom rubber outsoles. Clean design, free of labels, delivering versatile style from weekdays to weekends.",
    variantes: [
      { colores: [{ hex: "#FFFFFF", nombre: "Optic White" }], talla: "41", stock: 8 },
      { colores: [{ hex: "#FFFFFF", nombre: "Optic White" }], talla: "42", stock: 15 },
      { colores: [{ hex: "#FFFFFF", nombre: "Optic White" }], talla: "43", stock: 12 }
    ]
  },

  // --- Accessories ---
  {
    id: "prod_acc_1",
    nombre: "Chrono Matte Black Watch",
    marca: "OUTFIT LAB",
    categoria: "Accessories",
    genero: "Men",
    precio_regular: 250,
    precio_descuento: 180,
    imagenes: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Minimalist multi-dial watch featuring Japanese quartz movement, black oxide coated stainless steel chassis, and an elegant genuine leather strap.",
    variantes: [
      { colores: [{ hex: "#121212", nombre: "Stealth Black" }], talla: "One-Size", stock: 25 }
    ]
  },
  {
    id: "prod_acc_2",
    nombre: "Classic Polarized Shades",
    marca: "OUTFIT LAB",
    categoria: "Accessories",
    genero: "Men",
    precio_regular: 45,
    precio_descuento: null,
    imagenes: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Handcrafted acetate frames equipped with polarized scratch-resistant category-3 lenses. Provides 100% UVA/UVB protection.",
    variantes: [
      { colores: [{ hex: "#312E29", nombre: "Tortoise" }], talla: "One-Size", stock: 35 }
    ]
  },

  // --- Outlet ---
  {
    id: "prod_out_1",
    nombre: "Cable Knit Wool Beanie",
    marca: "STUDIO MINIMAL",
    categoria: "Outlet",
    genero: "Women",
    precio_regular: 40,
    precio_descuento: 20,
    imagenes: [
      "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?w=800&auto=format&fit=crop&q=80"
    ],
    descripcion: "Thick lambswool knit beanie in beautiful cable texture. Extremely warm, featuring a secure ribbed brim to maintain fit.",
    variantes: [
      { colores: [{ hex: "#E5D3B3", nombre: "Oatmeal" }], talla: "One-Size", stock: 15 }
    ]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "HOLIDAY50",
    tipo: "porcentaje",
    valor: 50,
    fecha_expiracion: "2026-12-31",
    categoria_restringida: null
  },
  {
    id: "SPORTS30",
    tipo: "porcentaje",
    valor: 30,
    fecha_expiracion: "2026-11-30",
    categoria_restringida: "ActiveWear"
  },
  {
    id: "WELCOME10",
    tipo: "fijo",
    valor: 10,
    fecha_expiracion: "2026-12-31",
    categoria_restringida: null
  }
];

export const DEFAULT_HOME_CONFIG = {
  id: "home_cms",
  banner1_texto: "GET UP TO 50% For the holiday season",
  banner1_bg: "#F4EBE1",
  banner2_texto: "GET UP TO 30% OFF SHIRTS ⚡",
  banner2_bg: "#AEE5E5"
};
