export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  defaultAddress?: string;
  defaultDistrict?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StoreStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Store {
  id: string;
  ownerId: string;
  storeName: string;
  slug: string;
  description: string;
  contactPhone: string;
  businessLocation: string;
  district: string;
  logoUrl?: string;
  coverUrl?: string;
  status: StoreStatus;
  rejectionReason?: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: string;
  storeId: string;
  ownerId: string;
  storeName?: string;
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
  isFeatured?: boolean;
  unpublishReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';
export type PaymentStatus = 'pending' | 'verified' | 'failed';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  nameEn: string;
  nameBn: string;
  price: number;
  quantity: number;
  imageUrl: string;
  subtotal: number;
  storeId: string;
  storeName: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  district: string;
  city?: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items?: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTrxId?: string;
  status: OrderStatus;
  itemsCount: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubOrder {
  id: string;
  orderId: string;
  orderNumber?: string;
  storeId: string;
  storeName: string;
  sellerId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SystemSettings {
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  bkashNumber: string;
  nagadNumber: string;
  announcementEn?: string;
  announcementBn?: string;
  allowCod?: boolean;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  storeId: string;
  storeName: string;
  nameEn: string;
  nameBn: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
}
