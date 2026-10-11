import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../locales/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Store, Product, SubOrder, Category, OrderStatus } from '../../types';
import { getStoreByOwnerId, updateStoreProfile } from '../../services/storeService';
import {
  getProductsForStore,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../services/productService';
import { getSellerSubOrders, updateSubOrderStatus } from '../../services/orderService';
import { getAllCategories } from '../../services/adminService';
import { formatBDT, formatDate } from '../../utils/formatters';
import { isValidBDPhone, BD_DISTRICTS, BD_DISTRICTS_BN } from '../../utils/validation';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { ImageUploader } from '../../components/common/ImageUploader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  LayoutDashboard,
  Store as StoreIcon,
  Package,
  PlusCircle,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Archive,
  Edit,
  Eye,
  Menu,
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  Printer,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Truck,
  Check,
  XCircle
} from 'lucide-react';

interface SellerDashboardProps {
  onNavigate: (route: string, param?: string) => void;
}

type TabType =
  | 'overview'
  | 'profile'
  | 'products'
  | 'add-product'
  | 'orders'
  | 'inventory'
  | 'sales';

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Product Form State (for Add or Edit)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameBn, setProdNameBn] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescBn, setProdDescBn] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodPrevPrice, setProdPrevPrice] = useState<number | ''>('');
  const [prodStock, setProdStock] = useState<number | ''>('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodStatus, setProdStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Store Profile Form State
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeDistrict, setStoreDistrict] = useState('Dhaka');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeCover, setStoreCover] = useState('');
  const [savingStore, setSavingStore] = useState(false);
  const [storeSaveSuccess, setStoreSaveSuccess] = useState(false);

  // Confirm Actions
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sub Order Status Update & Inspection
  const [updatingSubOrder, setUpdatingSubOrder] = useState<string | null>(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderActionFeedback, setOrderActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [s, cats] = await Promise.all([
        getStoreByOwnerId(currentUser.uid),
        getAllCategories()
      ]);

      setStore(s);
      setCategories(cats || []);

      if (s) {
        setStoreName(s.storeName);
        setStoreDesc(s.description);
        setStorePhone(s.contactPhone);
        setStoreLocation(s.businessLocation);
        setStoreDistrict(s.district);
        setStoreLogo(s.logoUrl || '');
        setCoverUrl(s.coverUrl || '');

        const [prods, orders] = await Promise.all([
          getProductsForStore(s.id),
          getSellerSubOrders(currentUser.uid)
        ]);
        setProducts(prods || []);
        setSubOrders(orders || []);
      }
    } catch (e) {
      console.error('Error loading seller dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const setCoverUrl = (url: string) => {
    setStoreCover(url);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  if (loading) return <Loader text={t('loading')} />;

  if (!store || store.status !== 'approved') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <StoreIcon className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">
          {store?.status === 'pending'
            ? t('applicationPendingTitle')
            : isBn
            ? 'আপনার কোনো অনুমোদিত স্টোর নেই'
            : 'No approved store found'}
        </h2>
        <p className="text-xs text-slate-500">
          {store?.status === 'pending'
            ? t('applicationPendingDesc')
            : isBn
            ? 'সেলার ড্যাশবোর্ড ব্যবহারের পূর্বে স্টোর আবেদন করতে হবে।'
            : 'Please apply to open a store before accessing the seller portal.'}
        </p>
        <Button variant="primary" onClick={() => onNavigate('seller-apply')}>
          {t('sellerApplication')}
        </Button>
      </div>
    );
  }

  // Real stats calculation (No fake data or simulation)
  const totalProds = products.length;
  const publishedProds = products.filter(p => p.status === 'published').length;
  const draftProds = products.filter(p => p.status === 'draft').length;
  const pendingOrders = subOrders.filter(o => o.status === 'pending').length;
  const completedOrders = subOrders.filter(o => o.status === 'delivered').length;
  const deliveredSalesTotal = subOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.subtotal, 0);
  const lowStockProds = products.filter(p => p.stock < 5);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdNameEn('');
    setProdNameBn('');
    setProdDescEn('');
    setProdDescBn('');
    setProdCategory(categories[0]?.slug || 'clothing');
    setProdPrice('');
    setProdPrevPrice('');
    setProdStock(10);
    setProdImages([]);
    setProdStatus('published');
    setProductFormError(null);
    setActiveTab('add-product');
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdNameEn(p.nameEn);
    setProdNameBn(p.nameBn);
    setProdDescEn(p.descriptionEn);
    setProdDescBn(p.descriptionBn);
    setProdCategory(p.categorySlug);
    setProdPrice(p.price);
    setProdPrevPrice(p.previousPrice || '');
    setProdStock(p.stock);
    setProdImages(p.images || []);
    setProdStatus(p.status);
    setProductFormError(null);
    setActiveTab('add-product');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !store) return;
    setProductFormError(null);

    if (!prodNameEn.trim() || !prodNameBn.trim()) {
      setProductFormError(isBn ? 'ইংরেজি ও বাংলা উভয় নাম প্রদান করুন।' : 'Please provide both English and Bengali names.');
      return;
    }
    if (!prodDescEn.trim() || !prodDescBn.trim()) {
      setProductFormError(isBn ? 'ইংরেজি ও বাংলা উভয় বিবরণ প্রদান করুন।' : 'Please provide both English and Bengali descriptions.');
      return;
    }
    if (!prodPrice || Number(prodPrice) <= 0) {
      setProductFormError(t('priceMustBePositive'));
      return;
    }
    if (prodPrevPrice && Number(prodPrevPrice) <= Number(prodPrice)) {
      setProductFormError(t('prevPriceMustBeHigher'));
      return;
    }
    if (prodStock === '' || Number(prodStock) < 0) {
      setProductFormError(t('stockMustBeNonNegative'));
      return;
    }
    if (prodImages.length === 0) {
      setProductFormError(isBn ? 'কমপক্ষে একটি পণ্যের ছবি যুক্ত করুন।' : 'At least 1 product image is required.');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        // Edit existing product
        await updateProduct(editingProduct.id, {
          nameEn: prodNameEn.trim(),
          nameBn: prodNameBn.trim(),
          descriptionEn: prodDescEn.trim(),
          descriptionBn: prodDescBn.trim(),
          categorySlug: prodCategory,
          price: Number(prodPrice),
          previousPrice: prodPrevPrice ? Number(prodPrevPrice) : undefined,
          stock: Math.floor(Number(prodStock)),
          images: prodImages,
          status: prodStatus
        });
      } else {
        // Create new product
        await createProduct({
          storeId: store.id,
          ownerId: currentUser.uid,
          storeName: store.storeName,
          nameEn: prodNameEn.trim(),
          nameBn: prodNameBn.trim(),
          descriptionEn: prodDescEn.trim(),
          descriptionBn: prodDescBn.trim(),
          categorySlug: prodCategory,
          price: Number(prodPrice),
          previousPrice: prodPrevPrice ? Number(prodPrevPrice) : undefined,
          stock: Math.floor(Number(prodStock)),
          images: prodImages,
          status: prodStatus
        });
      }

      await loadData();
      setActiveTab('products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setProductFormError(err.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setActionLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      await loadData();
    } catch (e: any) {
      console.error('Error deleting product:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmArchiveProduct = async () => {
    if (!productToArchive) return;
    setActionLoading(true);
    try {
      await updateProduct(productToArchive.id, { status: 'archived' });
      setProductToArchive(null);
      await loadData();
    } catch (e: any) {
      console.error('Error archiving product:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSavingStore(true);
    setStoreSaveSuccess(false);

    try {
      await updateStoreProfile(store.id, {
        storeName: storeName.trim(),
        description: storeDesc.trim(),
        contactPhone: storePhone.trim(),
        businessLocation: storeLocation.trim(),
        district: storeDistrict,
        logoUrl: storeLogo,
        coverUrl: storeCover
      });
      setStoreSaveSuccess(true);
      setTimeout(() => setStoreSaveSuccess(false), 3000);
      await loadData();
    } catch (e) {
      console.error('Error saving store profile:', e);
    } finally {
      setSavingStore(false);
    }
  };

  const getOrderStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getOrderStatusLabel = (status: OrderStatus, bn: boolean) => {
    switch (status) {
      case 'pending': return bn ? 'অপেক্ষমান (পেন্ডিং)' : 'Pending';
      case 'confirmed': return bn ? 'নিশ্চিত (কনফার্মড)' : 'Confirmed';
      case 'processing': return bn ? 'প্রসেসিং হচ্ছে' : 'Processing';
      case 'shipped': return bn ? 'শিপড (পাঠানো হয়েছে)' : 'Shipped';
      case 'delivered': return bn ? 'ডেলিভার্ড সম্পন্ন' : 'Delivered';
      case 'cancelled': return bn ? 'বাতিল' : 'Cancelled';
      default: return status;
    }
  };

  const handleStatusTransition = async (subOrderId: string, nextStatus: OrderStatus) => {
    if (!currentUser) return;
    setUpdatingSubOrder(subOrderId);
    setOrderActionFeedback(null);
    try {
      await updateSubOrderStatus(subOrderId, nextStatus, currentUser.uid);
      setOrderActionFeedback({
        type: 'success',
        message: isBn
          ? `অর্ডার স্ট্যাটাস সফলভাবে "${getOrderStatusLabel(nextStatus, true)}"-এ আপডেট করা হয়েছে!`
          : `Order status successfully updated to "${getOrderStatusLabel(nextStatus, false)}"!`
      });
      // Optimistically update
      setSubOrders(prev => prev.map(o => o.id === subOrderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o));
      setSelectedSubOrder(prev => prev && prev.id === subOrderId ? { ...prev, status: nextStatus, updatedAt: new Date().toISOString() } : prev);
      await loadData();
    } catch (e: any) {
      console.error('Status transition error:', e);
      setOrderActionFeedback({
        type: 'error',
        message: e?.message || (isBn ? 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to update order status. Please try again.')
      });
    } finally {
      setUpdatingSubOrder(null);
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await updateProduct(productId, { stock: Math.floor(newStock) });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Math.floor(newStock) } : p));
    } catch (e) {
      console.error('Stock update failed:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar for Seller */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{store.storeName}</h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                APPROVED
              </span>
            </div>
            <p className="text-xs text-slate-500">{t('sellerPortal')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenAddProduct}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            {t('addProduct')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('store', store.id)}
            icon={<Eye className="w-4 h-4" />}
          >
            {isBn ? 'স্টোর ভিউ' : 'View Storefront'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 items-start">
        {/* Navigation Sidebar */}
        <aside
          className={`space-y-1 bg-white p-3 rounded-xl border border-slate-200 md:block ${
            mobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <button
            onClick={() => { setActiveTab('overview'); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('overview')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('sellerProducts')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setMobileNavOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('sellerOrders')}</span>
            </div>
            {pendingOrders > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                {pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('inventory'); setMobileNavOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Boxes className="w-4 h-4" />
              <span>{t('inventory')}</span>
            </div>
            {lowStockProds.length > 0 && (
              <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                {lowStockProds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('sales'); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('salesSummary')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>{t('storeProfile')}</span>
          </button>
        </aside>

        {/* Tab Content Body */}
        <main className="md:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">{t('totalProducts')}</span>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalProds}</p>
                  <p className="text-[11px] text-slate-400">
                    {publishedProds} {t('statusPublished')} &bull; {draftProds} {t('statusDraft')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">{t('completedOrders')}</span>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{completedOrders}</p>
                  <p className="text-[11px] text-amber-600 font-medium">
                    {pendingOrders} {t('statusPending')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 font-medium">{t('totalDeliveredSales')}</span>
                  <p className="text-2xl font-bold text-emerald-900 tabular-nums">
                    {formatBDT(deliveredSalesTotal, isBn)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isBn ? 'কেবলমাত্র ডেলিভারিকৃত অর্ডার' : 'From delivered orders only'}
                  </p>
                </div>
              </div>

              {/* Low Stock Warning Box */}
              {lowStockProds.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>{t('lowStockAlert')}</span>
                  </div>
                  <div className="divide-y divide-amber-200/60">
                    {lowStockProds.map(p => (
                      <div key={p.id} className="py-1.5 flex justify-between items-center text-amber-800">
                        <span>{p.nameEn}</span>
                        <span className="font-bold tabular-nums">
                          {isBn ? `${p.stock}টি বাকি` : `${p.stock} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders Preview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {isBn ? 'সাম্প্রতিক অর্ডারসমূহ' : 'Recent Sub-Orders'}
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('orders')}>
                    {t('viewAll')}
                  </Button>
                </div>

                {subOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    {isBn ? 'এখনো কোনো অর্ডার আসেনি।' : 'No orders received yet.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {subOrders.slice(0, 5).map(o => (
                      <div key={o.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{o.orderNumber || o.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getOrderStatusBadgeClass(o.status)}`}>
                              {getOrderStatusLabel(o.status, isBn)}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            {o.customerName && <strong className="text-slate-700">{o.customerName} &bull; </strong>}
                            {o.items.length} {isBn ? 'আইটেম' : 'items'} &bull; {formatDate(o.createdAt, isBn)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-900 text-sm tabular-nums">
                            {formatBDT(o.subtotal, isBn)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {o.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="primary"
                                loading={updatingSubOrder === o.id}
                                onClick={() => handleStatusTransition(o.id, 'confirmed')}
                                icon={<Check className="w-3.5 h-3.5" />}
                              >
                                {isBn ? 'কনফার্ম' : 'Confirm'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubOrder(o)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                            >
                              {isBn ? 'বিস্তারিত' : 'Details'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {t('sellerProducts')} ({products.length})
                </h3>
                <Button size="sm" variant="primary" onClick={handleOpenAddProduct}>
                  {t('addProduct')}
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-xs text-slate-500">{t('noProductsFound')}</p>
                  <Button size="sm" variant="primary" onClick={handleOpenAddProduct}>
                    {t('addProduct')}
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {products.map(p => (
                    <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.nameEn} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{isBn ? (p.nameBn || p.nameEn) : p.nameEn}</h4>
                          <p className="text-[11px] text-slate-500">
                            {formatBDT(p.price, isBn)} &bull; {isBn ? `স্টক: ${p.stock}` : `Stock: ${p.stock}`}
                          </p>
                          {p.unpublishReason && (
                            <p className="text-[11px] text-red-600 font-medium">
                              Unpublish Reason: {p.unpublishReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>

                        <Button size="sm" variant="outline" onClick={() => handleOpenEditProduct(p)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        {p.status !== 'archived' && (
                          <Button size="sm" variant="outline" onClick={() => setProductToArchive(p)} title="Archive">
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button size="sm" variant="danger" onClick={() => setProductToDelete(p)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD / EDIT PRODUCT */}
          {activeTab === 'add-product' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('products')}>
                  {t('cancel')}
                </Button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('productNameEn')}
                    value={prodNameEn}
                    onChange={(e) => setProdNameEn(e.target.value)}
                    placeholder="e.g. Traditional Handloom Tangail Cotton Saree"
                    required
                  />
                  <Input
                    label={t('productNameBn')}
                    value={prodNameBn}
                    onChange={(e) => setProdNameBn(e.target.value)}
                    placeholder="যেমন: ঐতিহ্যবাহী তাঁতের টাঙ্গাইল সুতি শাড়ি"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('productDescEn')} *
                    </label>
                    <textarea
                      value={prodDescEn}
                      onChange={(e) => setProdDescEn(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-emerald-700"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('productDescBn')} *
                    </label>
                    <textarea
                      value={prodDescBn}
                      onChange={(e) => setProdDescBn(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('productCategory')} *
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-emerald-700"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.slug}>
                          {isBn ? c.nameBn : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label={t('price')}
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1200"
                    required
                  />

                  <Input
                    label={t('previousPrice')}
                    type="number"
                    value={prodPrevPrice}
                    onChange={(e) => setProdPrevPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('stockQuantity')}
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value ? Number(e.target.value) : '')}
                    placeholder="15"
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('productStatus')}
                    </label>
                    <select
                      value={prodStatus}
                      onChange={(e) => setProdStatus(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-emerald-700"
                    >
                      <option value="published">{t('statusPublished')}</option>
                      <option value="draft">{t('statusDraft')}</option>
                      <option value="archived">{t('statusArchived')}</option>
                    </select>
                  </div>
                </div>

                {/* 1 to 5 Product Images */}
                <ImageUploader
                  folder="products"
                  maxImages={5}
                  initialImages={prodImages}
                  onImagesChange={setProdImages}
                  label={t('productImages')}
                  helperText={isBn ? 'ন্যূনতম ১টি এবং সর্বোচ্চ ৫টি ছবি' : 'Min 1 and max 5 images'}
                />

                {productFormError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                    {productFormError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" variant="primary" loading={savingProduct}>
                    {t('saveProduct')}
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('products')}>
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (() => {
            const orderStatusTabs: { id: 'all' | OrderStatus; label: string; count: number }[] = [
              { id: 'all', label: isBn ? 'সবগুলো' : 'All', count: subOrders.length },
              { id: 'pending', label: isBn ? 'পেন্ডিং' : 'Pending', count: subOrders.filter(o => o.status === 'pending').length },
              { id: 'confirmed', label: isBn ? 'কনফার্মড' : 'Confirmed', count: subOrders.filter(o => o.status === 'confirmed').length },
              { id: 'processing', label: isBn ? 'প্রসেসিং' : 'Processing', count: subOrders.filter(o => o.status === 'processing').length },
              { id: 'shipped', label: isBn ? 'শিপড' : 'Shipped', count: subOrders.filter(o => o.status === 'shipped').length },
              { id: 'delivered', label: isBn ? 'ডেলিভার্ড' : 'Delivered', count: subOrders.filter(o => o.status === 'delivered').length },
              { id: 'cancelled', label: isBn ? 'বাতিল' : 'Cancelled', count: subOrders.filter(o => o.status === 'cancelled').length }
            ];

            const filteredSubOrders = subOrders.filter(sub => {
              const matchesStatus = orderStatusFilter === 'all' || sub.status === orderStatusFilter;
              const q = orderSearchQuery.toLowerCase().trim();
              if (!q) return matchesStatus;
              const matchesSearch =
                (sub.orderNumber && sub.orderNumber.toLowerCase().includes(q)) ||
                (sub.id && sub.id.toLowerCase().includes(q)) ||
                (sub.customerName && sub.customerName.toLowerCase().includes(q)) ||
                (sub.customerPhone && sub.customerPhone.includes(q)) ||
                (sub.shippingAddress?.fullName && sub.shippingAddress.fullName.toLowerCase().includes(q)) ||
                (sub.shippingAddress?.phone && sub.shippingAddress.phone.includes(q)) ||
                (sub.shippingAddress?.district && sub.shippingAddress.district.toLowerCase().includes(q));
              return matchesStatus && matchesSearch;
            });

            return (
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
                {/* Header & Search */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-800" />
                      <span>{t('sellerOrders')} ({subOrders.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isBn
                        ? 'ক্রেতাদের অর্ডারের তথ্য দেখুন, কনফার্ম করুন এবং ডেলিভারি স্ট্যাটাস পরিচালনা করুন।'
                        : 'Inspect incoming buyer orders, confirm orders and manage delivery states.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder={isBn ? 'অর্ডার নম্বর, নাম বা ফোন নম্বর...' : 'Search by order #, name or phone...'}
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50 focus:bg-white"
                      />
                      {orderSearchQuery && (
                        <button
                          onClick={() => setOrderSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadData()}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      {isBn ? 'রিফ্রেশ' : 'Refresh'}
                    </Button>
                  </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {orderStatusTabs.map(tab => {
                    const isSelected = orderStatusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setOrderStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-emerald-950 text-white' : 'bg-white text-slate-700 border border-slate-200'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Action Feedback Banner */}
                {orderActionFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                      orderActionFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {orderActionFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{orderActionFeedback.message}</span>
                    </div>
                    <button
                      onClick={() => setOrderActionFeedback(null)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Orders List */}
                {filteredSubOrders.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">
                      {isBn ? 'কোনো অর্ডার পাওয়া যায়নি।' : 'No orders found.'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {orderSearchQuery || orderStatusFilter !== 'all'
                        ? (isBn ? 'ফিল্টার বা সার্চ পরিবর্তন করে দেখুন।' : 'Try resetting your search query or status filter.')
                        : (isBn ? 'নতুন অর্ডার আসলে এখানে দেখা যাবে।' : 'Incoming customer orders will appear here.')}
                    </p>
                    {(orderSearchQuery || orderStatusFilter !== 'all') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setOrderStatusFilter('all'); setOrderSearchQuery(''); }}
                      >
                        {isBn ? 'সব ফিল্টার মুছুন' : 'Clear Filters'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubOrders.map(sub => {
                      const isUpdating = updatingSubOrder === sub.id;
                      const customerPhone = sub.customerPhone || sub.shippingAddress?.phone;
                      const customerName = sub.customerName || sub.shippingAddress?.fullName;

                      return (
                        <div key={sub.id} className="p-4 border border-slate-200 rounded-xl space-y-3.5 hover:border-slate-300 transition-colors bg-white">
                          {/* Card Top Row */}
                          <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 font-mono">
                                {sub.orderNumber || sub.id}
                              </span>
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(sub.createdAt, isBn)}
                              </span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getOrderStatusBadgeClass(sub.status)}`}>
                                {getOrderStatusLabel(sub.status, isBn)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-base text-emerald-950 tabular-nums">
                                {formatBDT(sub.subtotal, isBn)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSubOrder(sub)}
                                icon={<Eye className="w-3.5 h-3.5" />}
                              >
                                {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                              </Button>
                            </div>
                          </div>

                          {/* Customer & Shipping Summary Bar */}
                          <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-slate-800">
                                <span className="font-semibold flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                  {customerName || 'Customer'}
                                </span>
                                {customerPhone && (
                                  <>
                                    <span className="text-slate-300">&bull;</span>
                                    <a
                                      href={`tel:${customerPhone}`}
                                      className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline"
                                    >
                                      <Phone className="w-3 h-3 text-emerald-700" />
                                      {customerPhone}
                                    </a>
                                  </>
                                )}
                              </div>
                              {sub.shippingAddress && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{sub.shippingAddress.address}, {sub.shippingAddress.district}</span>
                                </p>
                              )}
                            </div>

                            {sub.shippingAddress?.note && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                <strong>নোট:</strong> {sub.shippingAddress.note}
                              </span>
                            )}
                          </div>

                          {/* Ordered Items Preview */}
                          <div className="text-xs space-y-1.5 divide-y divide-slate-100">
                            {sub.items.map((item, idx) => (
                              <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 text-slate-700">
                                <div className="flex items-center gap-2">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.nameEn}
                                      className="w-8 h-8 rounded object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {isBn ? (item.nameBn || item.nameEn) : item.nameEn}
                                    </span>
                                    <span className="text-slate-400 text-[11px] ml-1.5">
                                      &times; {item.quantity} {isBn ? 'টি' : 'qty'}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-bold tabular-nums text-slate-900">
                                  {formatBDT(item.subtotal, isBn)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Status Management & Action Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              {sub.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={isUpdating}
                                  onClick={() => handleStatusTransition(sub.id, 'confirmed')}
                                  icon={<Check className="w-3.5 h-3.5" />}
                                >
                                  {isBn ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'}
                                </Button>
                              )}

                              {sub.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={isUpdating}
                                  onClick={() => handleStatusTransition(sub.id, 'processing')}
                                  icon={<Boxes className="w-3.5 h-3.5" />}
                                >
                                  {isBn ? 'প্রসেসিং শুরু করুন' : 'Start Processing'}
                                </Button>
                              )}

                              {sub.status === 'processing' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={isUpdating}
                                  onClick={() => handleStatusTransition(sub.id, 'shipped')}
                                  icon={<Truck className="w-3.5 h-3.5" />}
                                >
                                  {isBn ? 'শিপড মার্ক করুন' : 'Mark as Shipped'}
                                </Button>
                              )}

                              {sub.status === 'shipped' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  loading={isUpdating}
                                  onClick={() => handleStatusTransition(sub.id, 'delivered')}
                                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                >
                                  {isBn ? 'ডেলিভারি সম্পন্ন' : 'Mark Delivered'}
                                </Button>
                              )}

                              {sub.status === 'delivered' && (
                                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isBn ? 'ডেলিভারি সম্পন্ন হয়েছে' : 'Order Delivered'}
                                </span>
                              )}

                              {sub.status === 'cancelled' && (
                                <span className="text-red-700 font-bold text-xs flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                                  <XCircle className="w-3.5 h-3.5" />
                                  {isBn ? 'অর্ডার বাতিলকৃত' : 'Order Cancelled'}
                                </span>
                              )}
                            </div>

                            {/* Flexible Status Changer Dropdown */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 font-medium text-[11px]">
                                {isBn ? 'স্ট্যাটাস বদলান:' : 'Change:'}
                              </span>
                              <select
                                value={sub.status}
                                onChange={(e) => handleStatusTransition(sub.id, e.target.value as OrderStatus)}
                                disabled={isUpdating}
                                className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-emerald-700"
                              >
                                <option value="pending">{isBn ? 'পেন্ডিং (অপেক্ষমান)' : 'Pending'}</option>
                                <option value="confirmed">{isBn ? 'কনফার্মড (নিশ্চিত)' : 'Confirmed'}</option>
                                <option value="processing">{isBn ? 'প্রসেসিং হচ্ছে' : 'Processing'}</option>
                                <option value="shipped">{isBn ? 'শিপড (পাঠানো হয়েছে)' : 'Shipped'}</option>
                                <option value="delivered">{isBn ? 'ডেলিভার্ড সম্পন্ন' : 'Delivered'}</option>
                                <option value="cancelled">{isBn ? 'অর্ডার বাতিল' : 'Cancelled'}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 5: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-3">
                {t('inventory')} ({products.length} {isBn ? 'পণ্য' : 'items'})
              </h3>

              <div className="divide-y divide-slate-100">
                {products.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-900">{isBn ? (p.nameBn || p.nameEn) : p.nameEn}</h4>
                      <p className="text-[11px] text-slate-500">{formatBDT(p.price, isBn)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Stock:</span>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => handleQuickStockUpdate(p.id, Number(e.target.value))}
                          className="w-16 p-1 text-center font-bold tabular-nums border border-slate-300 rounded focus:ring-emerald-700"
                          min={0}
                        />
                      </div>
                      {p.stock < 5 && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SALES SUMMARY */}
          {activeTab === 'sales' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-3">
                {t('salesSummary')}
              </h3>

              <div className="p-6 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  {t('totalDeliveredSales')}
                </span>
                <p className="text-3xl font-extrabold text-emerald-950 tabular-nums">
                  {formatBDT(deliveredSalesTotal, isBn)}
                </p>
                <p className="text-xs text-slate-600">
                  {isBn
                    ? `মোট ${completedOrders}টি সফলভাবে ডেলিভারিকৃত অর্ডার হতে অর্জিত রাজস্ব।`
                    : `Revenue realized strictly from ${completedOrders} verified delivered orders.`}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  {isBn ? 'ডেলিভারিকৃত অর্ডার তালিকা' : 'Delivered Orders Breakdown'}
                </h4>
                {subOrders.filter(o => o.status === 'delivered').length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    {isBn ? 'এখনো কোনো ডেলিভারিকৃত অর্ডার নেই।' : 'No delivered orders yet.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {subOrders.filter(o => o.status === 'delivered').map(o => (
                      <div key={o.id} className="py-2.5 flex justify-between">
                        <span>{o.orderNumber || o.id} &bull; {formatDate(o.createdAt, isBn)}</span>
                        <span className="font-bold tabular-nums text-emerald-900">{formatBDT(o.subtotal, isBn)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: STORE PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-100 pb-3">
                {t('storeProfile')}
              </h3>

              <form onSubmit={handleUpdateStoreProfile} className="space-y-5">
                <Input
                  label={t('storeName')}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('storeDescription')} *
                  </label>
                  <textarea
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('contactPhone')}
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('district')} *
                    </label>
                    <select
                      value={storeDistrict}
                      onChange={(e) => setStoreDistrict(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-emerald-700"
                    >
                      {BD_DISTRICTS.map(d => (
                        <option key={d} value={d}>
                          {d} {isBn && BD_DISTRICTS_BN[d] ? `(${BD_DISTRICTS_BN[d]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label={t('businessLocation')}
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  required
                />

                <ImageUploader
                  folder="stores"
                  maxImages={1}
                  initialImages={storeLogo ? [storeLogo] : []}
                  onImagesChange={(urls) => setStoreLogo(urls[0] || '')}
                  label={t('storeLogo')}
                />

                <ImageUploader
                  folder="stores"
                  maxImages={1}
                  initialImages={storeCover ? [storeCover] : []}
                  onImagesChange={(urls) => setStoreCover(urls[0] || '')}
                  label={t('storeCover')}
                />

                {storeSaveSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                    {isBn ? 'স্টোর প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে।' : 'Store profile updated successfully.'}
                  </div>
                )}

                <Button type="submit" variant="primary" loading={savingStore}>
                  {t('save')}
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDeleteProduct}
        title={isBn ? 'পণ্য মুছে ফেলুন' : 'Delete Product'}
        message={t('deleteProductPrompt')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        isDestructive={true}
        loading={actionLoading}
      />

      {/* Archive Product Confirmation */}
      <ConfirmDialog
        isOpen={!!productToArchive}
        onClose={() => setProductToArchive(null)}
        onConfirm={handleConfirmArchiveProduct}
        title={isBn ? 'পণ্য আর্কাইভ করুন' : 'Archive Product'}
        message={isBn ? 'আপনি কি এই পণ্যটি আর্কাইভ করতে চান? পণ্যটি ক্রেতাদের কাছে দৃশ্যমান থাকবে না।' : 'Archive this product? It will no longer be visible to shoppers.'}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        isDestructive={false}
        loading={actionLoading}
      />

      {/* Order Details & Confirmation Modal */}
      {selectedSubOrder && (
        <Modal
          isOpen={!!selectedSubOrder}
          onClose={() => setSelectedSubOrder(null)}
          title={isBn ? `অর্ডার বিবরণী: ${selectedSubOrder.orderNumber || selectedSubOrder.id}` : `Order Details: ${selectedSubOrder.orderNumber || selectedSubOrder.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Status & Quick Action Highlight Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">{isBn ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getOrderStatusBadgeClass(selectedSubOrder.status)}`}>
                    {getOrderStatusLabel(selectedSubOrder.status, isBn)}
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(selectedSubOrder.createdAt, isBn)}
                </span>
              </div>

              {/* Action Buttons right in details */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-700">{isBn ? 'স্ট্যাটাস আপডেট করুন:' : 'Change Status:'}</span>

                {selectedSubOrder.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={updatingSubOrder === selectedSubOrder.id}
                    onClick={() => handleStatusTransition(selectedSubOrder.id, 'confirmed')}
                    icon={<Check className="w-4 h-4" />}
                  >
                    {isBn ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'}
                  </Button>
                )}

                {selectedSubOrder.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={updatingSubOrder === selectedSubOrder.id}
                    onClick={() => handleStatusTransition(selectedSubOrder.id, 'processing')}
                    icon={<Boxes className="w-4 h-4" />}
                  >
                    {isBn ? 'প্রসেসিং শুরু করুন' : 'Start Processing'}
                  </Button>
                )}

                {selectedSubOrder.status === 'processing' && (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={updatingSubOrder === selectedSubOrder.id}
                    onClick={() => handleStatusTransition(selectedSubOrder.id, 'shipped')}
                    icon={<Truck className="w-4 h-4" />}
                  >
                    {isBn ? 'শিপড মার্ক করুন' : 'Mark as Shipped'}
                  </Button>
                )}

                {selectedSubOrder.status === 'shipped' && (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={updatingSubOrder === selectedSubOrder.id}
                    onClick={() => handleStatusTransition(selectedSubOrder.id, 'delivered')}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    {isBn ? 'ডেলিভারি সম্পন্ন' : 'Mark Delivered'}
                  </Button>
                )}

                {/* Direct Dropdown */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-500">{isBn ? 'সরাসরি বদলান:' : 'Direct:'}</span>
                  <select
                    value={selectedSubOrder.status}
                    onChange={(e) => handleStatusTransition(selectedSubOrder.id, e.target.value as OrderStatus)}
                    disabled={updatingSubOrder === selectedSubOrder.id}
                    className="p-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-emerald-700"
                  >
                    <option value="pending">{isBn ? 'পেন্ডিং (অপেক্ষমান)' : 'Pending'}</option>
                    <option value="confirmed">{isBn ? 'কনফার্মড (নিশ্চিত)' : 'Confirmed'}</option>
                    <option value="processing">{isBn ? 'প্রসেসিং হচ্ছে' : 'Processing'}</option>
                    <option value="shipped">{isBn ? 'শিপড (পাঠানো হয়েছে)' : 'Shipped'}</option>
                    <option value="delivered">{isBn ? 'ডেলিভার্ড সম্পন্ন' : 'Delivered'}</option>
                    <option value="cancelled">{isBn ? 'অর্ডার বাতিল' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Buyer & Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  <User className="w-4 h-4 text-emerald-800" />
                  <span>{isBn ? 'বায়ার / ক্রেতার তথ্য' : 'Buyer Information'}</span>
                </div>
                <p className="text-slate-700">
                  <strong className="text-slate-900">{isBn ? 'নাম:' : 'Name:'}</strong>{' '}
                  {selectedSubOrder.customerName || selectedSubOrder.shippingAddress?.fullName || 'N/A'}
                </p>
                <div className="flex items-center justify-between text-slate-700">
                  <p>
                    <strong className="text-slate-900">{isBn ? 'ফোন:' : 'Phone:'}</strong>{' '}
                    <span className="font-mono">{selectedSubOrder.customerPhone || selectedSubOrder.shippingAddress?.phone || 'N/A'}</span>
                  </p>
                  {(selectedSubOrder.customerPhone || selectedSubOrder.shippingAddress?.phone) && (
                    <a
                      href={`tel:${selectedSubOrder.customerPhone || selectedSubOrder.shippingAddress?.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100"
                    >
                      <Phone className="w-3 h-3" />
                      {isBn ? 'কল করুন' : 'Call'}
                    </a>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>{isBn ? 'ডেলিভারি ঠিকানা' : 'Shipping Address'}</span>
                </div>
                <p className="text-slate-700">
                  <strong className="text-slate-900">{isBn ? 'ঠিকানা:' : 'Address:'}</strong>{' '}
                  {selectedSubOrder.shippingAddress?.address || 'N/A'}
                </p>
                <p className="text-slate-700">
                  <strong className="text-slate-900">{isBn ? 'জেলা:' : 'District:'}</strong>{' '}
                  {selectedSubOrder.shippingAddress?.district || 'Dhaka'}
                  {selectedSubOrder.shippingAddress?.city && `, ${selectedSubOrder.shippingAddress.city}`}
                </p>
                {selectedSubOrder.shippingAddress?.note && (
                  <p className="text-amber-800 bg-amber-50 p-1.5 rounded text-[11px] border border-amber-200">
                    <strong>{isBn ? 'নোট:' : 'Note:'}</strong> {selectedSubOrder.shippingAddress.note}
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-900 border-b border-slate-200 flex justify-between items-center">
                <span>{isBn ? 'অর্ডারকৃত পণ্যসমূহ' : 'Ordered Items'} ({selectedSubOrder.items?.length || 0})</span>
                <span className="text-emerald-900 font-extrabold text-sm tabular-nums">
                  {formatBDT(selectedSubOrder.subtotal, isBn)}
                </span>
              </div>
              <div className="divide-y divide-slate-100 p-2">
                {(selectedSubOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.nameEn}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900 text-xs">
                          {isBn ? (item.nameBn || item.nameEn) : item.nameEn}
                        </h4>
                        <p className="text-slate-500 text-[11px]">
                          {formatBDT(item.price, isBn)} &times; {item.quantity} {isBn ? 'টি' : 'qty'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums text-xs">
                      {formatBDT(item.subtotal, isBn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer / Print Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>{isBn ? 'ইনভয়েস স্লিপ প্রিন্ট করুন' : 'Print Invoice Slip'}</span>
              </button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedSubOrder(null)}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
