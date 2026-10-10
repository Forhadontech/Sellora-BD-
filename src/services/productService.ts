import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, ProductStatus } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export async function createProduct(data: {
  storeId: string;
  ownerId: string;
  storeName: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  categorySlug: string;
  price: number;
  previousPrice?: number;
  stock: number;
  images: string[];
  status: ProductStatus;
}): Promise<string> {
  if (data.price <= 0) throw new Error('Price must be greater than 0.');
  if (data.stock < 0) throw new Error('Stock must be an integer >= 0.');
  if (!data.images || data.images.length === 0) throw new Error('At least 1 product image is required.');
  if (data.images.length > 5) throw new Error('Maximum 5 images allowed.');

  const productId = doc(collection(db, 'products')).id;
  const newProduct: any = {
    id: productId,
    storeId: data.storeId,
    ownerId: data.ownerId,
    storeName: data.storeName,
    nameEn: data.nameEn.trim(),
    nameBn: data.nameBn.trim(),
    descriptionEn: data.descriptionEn.trim(),
    descriptionBn: data.descriptionBn.trim(),
    categorySlug: data.categorySlug,
    price: Number(data.price),
    stock: Math.floor(Number(data.stock)),
    images: data.images,
    status: data.status,
    isFeatured: false,
    createdAt: new Date().toISOString()
  };

  if (data.previousPrice !== undefined && data.previousPrice !== null && !isNaN(Number(data.previousPrice))) {
    newProduct.previousPrice = Number(data.previousPrice);
  }

  try {
    await setDoc(doc(db, 'products', productId), newProduct);
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `products/${productId}`);
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'storeId' | 'ownerId' | 'createdAt'>>
): Promise<void> {
  if (updates.price !== undefined && updates.price <= 0) {
    throw new Error('Price must be greater than 0.');
  }
  if (updates.stock !== undefined && updates.stock < 0) {
    throw new Error('Stock must be >= 0.');
  }

  const cleanUpdates: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  }

  try {
    const ref = doc(db, 'products', productId);
    await updateDoc(ref, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return snap.data() as Product;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${productId}`);
  }
}

export async function getProductsForStore(storeId: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('storeId', '==', storeId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Product);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function getPublishedProducts(filters?: {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc';
}): Promise<Product[]> {
  try {
    // Only fetch published products
    let q = query(collection(db, 'products'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    let items = snap.docs.map(d => d.data() as Product);

    // Filter in-memory for rich compound search without index bottleneck
    if (filters?.categorySlug && filters.categorySlug !== 'all') {
      items = items.filter(p => p.categorySlug === filters.categorySlug);
    }

    if (filters?.minPrice !== undefined) {
      items = items.filter(p => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      items = items.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters?.inStockOnly) {
      items = items.filter(p => p.stock > 0);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const term = filters.search.toLowerCase().trim();
      items = items.filter(p =>
        p.nameEn.toLowerCase().includes(term) ||
        p.nameBn.toLowerCase().includes(term) ||
        p.descriptionEn.toLowerCase().includes(term) ||
        p.descriptionBn.toLowerCase().includes(term) ||
        (p.storeName && p.storeName.toLowerCase().includes(term))
      );
    }

    // Sorting
    if (filters?.sortBy === 'priceAsc') {
      items.sort((a, b) => a.price - b.price);
    } else if (filters?.sortBy === 'priceDesc') {
      items.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('isFeatured', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Product);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}
