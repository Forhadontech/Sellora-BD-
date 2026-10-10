import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Store, StoreStatus } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export async function submitStoreApplication(data: {
  ownerId: string;
  storeName: string;
  description: string;
  contactPhone: string;
  businessLocation: string;
  district: string;
  logoUrl?: string;
  coverUrl?: string;
}): Promise<string> {
  const storeId = doc(collection(db, 'stores')).id;
  const slug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newStore: Store = {
    id: storeId,
    ownerId: data.ownerId,
    storeName: data.storeName.trim(),
    slug: `${slug}-${storeId.slice(0, 5)}`,
    description: data.description.trim(),
    contactPhone: data.contactPhone.trim(),
    businessLocation: data.businessLocation.trim(),
    district: data.district,
    logoUrl: data.logoUrl || '',
    coverUrl: data.coverUrl || '',
    status: 'pending', // Strictly pending, never auto-approved
    rating: 5.0,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'stores', storeId), newStore);
    return storeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `stores/${storeId}`);
  }
}

export async function getStoreByOwnerId(ownerId: string): Promise<Store | null> {
  try {
    const q = query(collection(db, 'stores'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Store;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'stores');
  }
}

export async function getStoreById(storeId: string): Promise<Store | null> {
  try {
    const snap = await getDoc(doc(db, 'stores', storeId));
    if (!snap.exists()) return null;
    return snap.data() as Store;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `stores/${storeId}`);
  }
}

export async function getApprovedStores(): Promise<Store[]> {
  try {
    const q = query(collection(db, 'stores'), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Store);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'stores');
  }
}

export async function updateStoreProfile(
  storeId: string,
  updates: Partial<Pick<Store, 'storeName' | 'description' | 'contactPhone' | 'businessLocation' | 'district' | 'logoUrl' | 'coverUrl'>>
): Promise<void> {
  try {
    const ref = doc(db, 'stores', storeId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `stores/${storeId}`);
  }
}
