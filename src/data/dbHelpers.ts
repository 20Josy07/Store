/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  db, 
  handleFirestoreError, 
  OperationType,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction
} from '../firebase';
import { Product, Coupon, Order, HomeBannerConfig } from '../types';

const FALLBACK_HOME_CONFIG: HomeBannerConfig = {
  id: 'home_cms',
  banner1_texto: 'GET UP TO 50% For the holiday season',
  banner1_bg: '#F4EBE1',
  banner2_texto: 'GET UP TO 30% OFF SHIRTS ⚡',
  banner2_bg: '#AEE5E5'
};

// --- PRODUCTS API ---
export async function getProductsFromDB(): Promise<Product[]> {
  const path = 'productos';
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push(doc.data() as Product);
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addProductToDB(product: Product): Promise<void> {
  const path = `productos/${product.id}`;
  try {
    await setDoc(doc(db, 'productos', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProductInDB(product: Product): Promise<void> {
  const path = `productos/${product.id}`;
  try {
    await setDoc(doc(db, 'productos', product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductFromDB(productId: string): Promise<void> {
  const path = `productos/${productId}`;
  try {
    await deleteDoc(doc(db, 'productos', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- COUPONS API ---
export async function getCouponsFromDB(): Promise<Coupon[]> {
  const path = 'cupones';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const coupons: Coupon[] = [];
    querySnapshot.forEach((doc) => {
      coupons.push(doc.data() as Coupon);
    });
    return coupons;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addCouponToDB(coupon: Coupon): Promise<void> {
  const path = `cupones/${coupon.id}`;
  try {
    await setDoc(doc(db, 'cupones', coupon.id), coupon);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCouponFromDB(couponId: string): Promise<void> {
  const path = `cupones/${couponId}`;
  try {
    await deleteDoc(doc(db, 'cupones', couponId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- CONFIG / CMS API ---
export async function getHomeConfigFromDB(): Promise<HomeBannerConfig> {
  const path = 'config/home_cms';
  try {
    const configDoc = await getDoc(doc(db, 'config', 'home_cms'));
    if (configDoc.exists()) {
      return configDoc.data() as HomeBannerConfig;
    }
    return FALLBACK_HOME_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateHomeConfigInDB(config: HomeBannerConfig): Promise<void> {
  const path = 'config/home_cms';
  try {
    await setDoc(doc(db, 'config', 'home_cms'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- ORDERS API ---
export async function getOrdersFromDB(): Promise<Order[]> {
  const path = 'pedidos';
  try {
    // Attempting query sorted by creation date
    const q = query(collection(db, path), orderBy('fecha_creacion', 'desc'));
    const querySnapshot = await getDocs(q).catch(async () => {
      // Fallback query if no index exists yet
      return await getDocs(collection(db, path));
    });
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createOrderInDB(order: Order): Promise<void> {
  const path = `pedidos/${order.id}`;
  try {
    // 1. Create the order
    await setDoc(doc(db, 'pedidos', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function reserveStockInDB(productId: string, color: string, size: string, quantity: number): Promise<boolean> {
  const productRef = doc(db, 'productos', productId);
  try {
    const success = await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error("El producto no existe");
      }
      const productData = productSnap.data() as Product;
      if (!productData.variantes || !Array.isArray(productData.variantes)) {
        throw new Error("El producto no tiene variantes configuradas");
      }

      let hasAvailableStock = false;
      const updatedVariantes = productData.variantes.map(v => {
        const variantColorName = (v.colores || []).map(c => c.nombre).join(' / ');
        if (variantColorName.toLowerCase() === color.toLowerCase() && v.talla.toLowerCase() === size.toLowerCase()) {
          if (v.stock >= quantity) {
            hasAvailableStock = true;
            return {
              ...v,
              stock: v.stock - quantity
            };
          }
        }
        return v;
      });

      if (!hasAvailableStock) {
        return false;
      }

      transaction.update(productRef, { variantes: updatedVariantes });
      return true;
    });

    return success;
  } catch (error) {
    console.error("Error reserving stock in transaction:", error);
    return false;
  }
}

export async function releaseStockInDB(productId: string, color: string, size: string, quantity: number): Promise<void> {
  const productRef = doc(db, 'productos', productId);
  try {
    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        return;
      }
      const productData = productSnap.data() as Product;
      if (!productData.variantes || !Array.isArray(productData.variantes)) {
        return;
      }

      const updatedVariantes = productData.variantes.map(v => {
        const variantColorName = (v.colores || []).map(c => c.nombre).join(' / ');
        if (variantColorName.toLowerCase() === color.toLowerCase() && v.talla.toLowerCase() === size.toLowerCase()) {
          return {
            ...v,
            stock: v.stock + quantity
          };
        }
        return v;
      });

      transaction.update(productRef, { variantes: updatedVariantes });
    });
  } catch (error) {
    console.error("Error releasing stock in transaction:", error);
  }
}

export async function updateOrderStatusInDB(orderId: string, status: 'pendiente' | 'enviado' | 'entregado'): Promise<void> {
  const path = `pedidos/${orderId}`;
  try {
    const orderDocRef = doc(db, 'pedidos', orderId);
    await updateDoc(orderDocRef, { estado: status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getMyOrdersFromDB(userId: string): Promise<Order[]> {
  const path = 'pedidos';
  try {
    const q = query(collection(db, path), where('usuario_id', '==', userId));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    return orders.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
