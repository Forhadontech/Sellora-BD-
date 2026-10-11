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
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import {
  UserProfile,
  Store,
  Product,
  Category,
  Order,
  SubOrder,
  SystemSettings,
  StoreStatus,
  UserRole,
  UserStatus,
  OrderStatus
} from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const INITIAL_CATEGORIES: Array<Omit<Category, 'id'>> = [
  { slug: 'clothing', nameEn: 'Clothing', nameBn: 'পোশাক ও পরিধেয়', icon: 'Shirt', isActive: true, displayOrder: 1 },
  { slug: 'fashion', nameEn: 'Fashion', nameBn: 'ফ্যাশন ও ঐতিহ্যবাহী বস্ত্র', icon: 'Sparkles', isActive: true, displayOrder: 2 },
  { slug: 'electronics', nameEn: 'Electronics', nameBn: 'ইলেকট্রনিক্স', icon: 'Tv', isActive: true, displayOrder: 3 },
  { slug: 'gadgets', nameEn: 'Gadgets', nameBn: 'স্মার্ট গ্যাজেটস', icon: 'Headphones', isActive: true, displayOrder: 4 },
  { slug: 'beauty', nameEn: 'Beauty & Personal Care', nameBn: 'বিউটি ও রূপচর্চা', icon: 'Heart', isActive: true, displayOrder: 5 },
  { slug: 'home-living', nameEn: 'Home & Living', nameBn: 'হোম ও লিভিং', icon: 'Home', isActive: true, displayOrder: 6 },
  { slug: 'accessories', nameEn: 'Accessories', nameBn: 'এক্সেসরিজ', icon: 'Watch', isActive: true, displayOrder: 7 },
  { slug: 'other', nameEn: 'Other', nameBn: 'অন্যান্য প্রয়োজনীয় পণ্য', icon: 'Package', isActive: true, displayOrder: 8 },
];

export async function ensureDefaultCategoriesAndSettings(): Promise<void> {
  try {
    // 1. Settings
    const settingsRef = doc(db, 'settings', 'config');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        deliveryFeeInsideDhaka: 80,
        deliveryFeeOutsideDhaka: 150,
        bkashNumber: '01711-234567',
        nagadNumber: '01911-765432',
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Categories
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      for (const cat of INITIAL_CATEGORIES) {
        const catId = cat.slug;
        await setDoc(doc(db, 'categories', catId), {
          ...cat,
          id: catId,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.warn('Initial seeding non-fatal error:', e);
  }
}

export async function getAdminMetrics(): Promise<{
  totalUsers: number;
  totalSellers: number;
  totalStores: number;
  pendingStoreApplications: number;
  totalProducts: number;
  totalOrders: number;
  deliveredSalesRevenue: number;
  pendingPaymentsCount: number;
}> {
  if (!auth.currentUser) {
    return {
      totalUsers: 0,
      totalSellers: 0,
      totalStores: 0,
      pendingStoreApplications: 0,
      totalProducts: 0,
      totalOrders: 0,
      deliveredSalesRevenue: 0,
      pendingPaymentsCount: 0
    };
  }

  try {
    const [usersSnap, storesSnap, productsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'stores')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'orders'))
    ]);

    const users = usersSnap.docs.map(d => d.data() as UserProfile);
    const stores = storesSnap.docs.map(d => d.data() as Store);
    const products = productsSnap.docs.map(d => d.data() as Product);
    const orders = ordersSnap.docs.map(d => d.data() as Order);

    const pendingStores = stores.filter(s => s.status === 'pending').length;
    const sellers = users.filter(u => u.role === 'seller').length;
    const deliveredRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingPayments = orders.filter(
      o => o.paymentMethod !== 'cod' && o.paymentStatus === 'pending'
    ).length;

    return {
      totalUsers: users.length,
      totalSellers: sellers,
      totalStores: stores.length,
      pendingStoreApplications: pendingStores,
      totalProducts: products.length,
      totalOrders: orders.length,
      deliveredSalesRevenue: deliveredRevenue,
      pendingPaymentsCount: pendingPayments
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin/metrics');
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!auth.currentUser) return [];

  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function getAllStores(): Promise<Store[]> {
  try {
    const snap = await getDocs(collection(db, 'stores'));
    return snap.docs.map(d => d.data() as Store);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'stores');
  }
}

export async function moderateStore(
  storeId: string,
  status: StoreStatus,
  rejectionReason?: string
): Promise<void> {
  try {
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    if (!storeSnap.exists()) throw new Error('Store not found');
    const storeData = storeSnap.data() as Store;

    await updateDoc(storeRef, {
      status,
      rejectionReason: rejectionReason || '',
      updatedAt: new Date().toISOString()
    });

    // If approved, ensure user role is updated to 'seller'
    if (status === 'approved') {
      await updateDoc(doc(db, 'users', storeData.ownerId), {
        role: 'seller',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `stores/${storeId}`);
  }
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(d => d.data() as Product);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function toggleProductFeatured(productId: string, isFeatured: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', productId), {
      isFeatured,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function unpublishProductAdmin(productId: string, reason: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', productId), {
      status: 'draft',
      unpublishReason: reason,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs.map(d => d.data() as Category).sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
  }
}

export async function saveCategory(category: Category): Promise<void> {
  try {
    await setDoc(doc(db, 'categories', category.id), {
      ...category,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${category.id}`);
  }
}

export async function getAllOrdersAdmin(): Promise<Order[]> {
  if (!auth.currentUser) return [];

  try {
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs.map(d => d.data() as Order).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

export async function verifyOrderPayment(
  orderId: string,
  isVerified: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: isVerified ? 'verified' : 'failed',
      status: isVerified ? 'confirmed' : 'pending',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function republishProductAdmin(productId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', productId), {
      status: 'published',
      unpublishReason: '',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
  }
}

export async function seedPlatformAdminData(): Promise<{ success: boolean; count: number }> {
  try {
    // 1. Settings
    const settingsRef = doc(db, 'settings', 'config');
    await setDoc(settingsRef, {
      deliveryFeeInsideDhaka: 80,
      deliveryFeeOutsideDhaka: 150,
      bkashNumber: '01711-234567',
      nagadNumber: '01911-765432',
      announcementEn: 'Express delivery across all 64 districts of Bangladesh!',
      announcementBn: 'বাংলাদেশের সকল ৬৪ জেলায় দ্রুত ও নিরাপদ ক্যাশ অন ডেলিভারি!',
      allowCod: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Categories
    let count = 0;
    for (const cat of INITIAL_CATEGORIES) {
      const catId = cat.slug;
      await setDoc(doc(db, 'categories', catId), {
        ...cat,
        id: catId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      count++;
    }

    return { success: true, count };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admin/seed');
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'config'), {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/config');
  }
}

export async function cleanupUnauthorizedAdmins(): Promise<{ removedAdmins: number; demotedUsers: number }> {
  let removedAdmins = 0;
  let demotedUsers = 0;
  try {
    const adminDocs = await getDocs(collection(db, 'admins'));
    for (const aDoc of adminDocs.docs) {
      const data = aDoc.data();
      if (data.email?.toLowerCase().trim() !== 'forhad93706@gmail.com') {
        await deleteDoc(aDoc.ref);
        removedAdmins++;
      }
    }
    const userDocs = await getDocs(collection(db, 'users'));
    for (const uDoc of userDocs.docs) {
      const data = uDoc.data() as UserProfile;
      if (data.role === 'admin' && data.email?.toLowerCase().trim() !== 'forhad93706@gmail.com') {
        await updateDoc(uDoc.ref, { role: 'customer', updatedAt: new Date().toISOString() });
        demotedUsers++;
      }
    }
  } catch (err) {
    console.warn('Error during admin cleanup:', err);
  }
  return { removedAdmins, demotedUsers };
}
