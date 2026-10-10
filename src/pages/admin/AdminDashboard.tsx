import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../locales/LanguageContext';
import { useAuth, ADMIN_EMAILS } from '../../context/AuthContext';
import {
  UserProfile,
  Store,
  Product,
  Category,
  Order,
  OrderStatus,
  StoreStatus,
  UserRole,
  UserStatus,
  SystemSettings
} from '../../types';
import {
  getAdminMetrics,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAllStores,
  moderateStore,
  getAllProductsAdmin,
  toggleProductFeatured,
  unpublishProductAdmin,
  republishProductAdmin,
  getAllCategories,
  saveCategory,
  deleteCategory,
  getAllOrdersAdmin,
  verifyOrderPayment,
  updateOrderStatusAdmin,
  updateSystemSettings,
  seedPlatformAdminData
} from '../../services/adminService';
import { getSettings } from '../../services/orderService';
import { formatBDT, formatDate } from '../../utils/formatters';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import {
  Shield,
  LayoutDashboard,
  Users,
  Store as StoreIcon,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  RefreshCw,
  Search,
  Key,
  Eye,
  Database,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (route: string, param?: string) => void;
}

type AdminTab =
  | 'overview'
  | 'stores'
  | 'orders'
  | 'products'
  | 'users'
  | 'categories'
  | 'reports'
  | 'settings'
  | 'setup';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const {
    currentUser,
    userProfile,
    loading: authLoading,
    isAdmin,
    isFirstAdminEmail,
    bootstrapFirstAdmin,
    signInWithGoogle
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Metrics
  const [metrics, setMetrics] = useState<{
    totalUsers: number;
    totalSellers: number;
    totalStores: number;
    pendingStoreApplications: number;
    totalProducts: number;
    totalOrders: number;
    deliveredSalesRevenue: number;
    pendingPaymentsCount: number;
  } | null>(null);

  // Entities
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>('all');
  const [storeSearch, setStoreSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals & Action states
  const [selectedStoreToModerate, setSelectedStoreToModerate] = useState<Store | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [productToUnpublish, setProductToUnpublish] = useState<Product | null>(null);
  const [unpublishReason, setUnpublishReason] = useState('');
  const [selectedOrderToView, setSelectedOrderToView] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Category Edit/Add Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catSlug, setCatSlug] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  const [catDisplayOrder, setCatDisplayOrder] = useState<number>(1);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);

  // Platform Settings Form
  const [feeInsideDhaka, setFeeInsideDhaka] = useState<number>(80);
  const [feeOutsideDhaka, setFeeOutsideDhaka] = useState<number>(150);
  const [bkashNum, setBkashNum] = useState('');
  const [nagadNum, setNagadNum] = useState('');
  const [announcementEn, setAnnouncementEn] = useState('');
  const [announcementBn, setAnnouncementBn] = useState('');
  const [allowCod, setAllowCod] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedingNotice, setSeedingNotice] = useState<string | null>(null);

  // First admin bootstrap state
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapSuccess, setBootstrapSuccess] = useState<boolean | null>(null);

  const loadAdminData = async () => {
    // Defense: Do not query Firestore if unauthenticated or unauthorized
    if (!currentUser || (!isAdmin && !isFirstAdminEmail)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [m, u, s, p, c, o, set] = await Promise.all([
        getAdminMetrics().catch(() => null),
        getAllUsers().catch(() => []),
        getAllStores().catch(() => []),
        getAllProductsAdmin().catch(() => []),
        getAllCategories().catch(() => []),
        getAllOrdersAdmin().catch(() => []),
        getSettings().catch(() => null)
      ]);

      if (m) setMetrics(m);
      setUsers(u || []);
      setStores(s || []);
      setProducts(p || []);
      setCategories(c || []);
      setOrders(o || []);
      setSettings(set);

      if (set) {
        setFeeInsideDhaka(set.deliveryFeeInsideDhaka ?? 80);
        setFeeOutsideDhaka(set.deliveryFeeOutsideDhaka ?? 150);
        setBkashNum(set.bkashNumber || '');
        setNagadNum(set.nagadNumber || '');
        setAnnouncementEn(set.announcementEn || '');
        setAnnouncementBn(set.announcementBn || '');
        setAllowCod(set.allowCod !== false);
      }
    } catch (e) {
      console.error('Error loading admin panel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (currentUser && (isAdmin || isFirstAdminEmail)) {
        loadAdminData();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, currentUser, isAdmin, isFirstAdminEmail]);

  // Loading state while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader size="lg" text={isBn ? 'এডমিন অ্যাক্সেস যাচাই করা হচ্ছে...' : 'Checking administrator access...'} />
      </div>
    );
  }

  // If user is not logged in at all
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {isBn ? 'এডমিন লগইন প্রয়োজন' : 'Administrator Login Required'}
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {isBn
            ? 'মার্কেটপ্লেস এডমিন প্যানেল সুরক্ষিত। প্রবেশ করতে আপনার অনুমোদিত গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।'
            : 'The marketplace administrator panel is restricted. Please sign in with an authorized Google administrator account.'}
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 text-left space-y-1">
          <p className="font-semibold text-slate-800">{isBn ? 'অনুমোদিত এডমিন অ্যাকাউন্ট:' : 'Authorized Admin Accounts:'}</p>
          <ul className="list-disc list-inside text-[11px] font-mono text-emerald-700">
            {ADMIN_EMAILS.map(em => <li key={em}>{em}</li>)}
          </ul>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          <Button variant="primary" onClick={() => signInWithGoogle()}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            {isBn ? 'গুগল দিয়ে এডমিন সাইন-ইন করুন' : 'Sign in with Google'}
          </Button>
          <Button variant="outline" onClick={() => onNavigate('home')}>
            {t('home')}
          </Button>
        </div>
      </div>
    );
  }

  // Strict Authorization Guard if logged in with non-admin email
  if (!isAdmin && !isFirstAdminEmail) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">403 Access Denied</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('accessDeniedAdminOnly')}
        </p>
        <div className="text-[11px] text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200 text-left space-y-1">
          <p>Signed in as: <strong className="text-slate-900">{currentUser?.email}</strong></p>
          <p className="text-slate-500">This account does not have administrator privileges.</p>
          <p className="pt-1 font-semibold text-slate-700">Authorized accounts:</p>
          <code className="text-[10px] text-emerald-800 font-mono block">{ADMIN_EMAILS.join(', ')}</code>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="primary" onClick={() => signInWithGoogle()}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            {isBn ? 'অন্য গুগল একাউন্টে সাইন-ইন' : 'Switch Google Account'}
          </Button>
          <Button variant="outline" onClick={() => onNavigate('home')}>
            {t('home')}
          </Button>
        </div>
      </div>
    );
  }

  const handleBootstrapFirstAdmin = async () => {
    setBootstrapping(true);
    setBootstrapSuccess(null);
    try {
      const res = await bootstrapFirstAdmin();
      setBootstrapSuccess(res);
      await loadAdminData();
    } catch (e) {
      console.error('Bootstrap error:', e);
      setBootstrapSuccess(false);
    } finally {
      setBootstrapping(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setSeedingNotice(null);
    try {
      const res = await seedPlatformAdminData();
      setSeedingNotice(isBn ? `সফলভাবে ${res.count}টি ক্যাটাগরি ও ডিফল্ট সেটিংস সংরক্ষণ করা হয়েছে!` : `Successfully seeded ${res.count} categories and default configuration!`);
      await loadAdminData();
      setTimeout(() => setSeedingNotice(null), 4000);
    } catch (e: any) {
      console.error('Seeding error:', e);
      setSeedingNotice(isBn ? 'ডাটা সিড করতে সমস্যা হয়েছে।' : 'Error during database seeding.');
    } finally {
      setSeeding(false);
    }
  };

  const handleModerateStoreAction = async (status: StoreStatus, reason?: string) => {
    if (!selectedStoreToModerate) return;
    setActionLoading(true);
    try {
      await moderateStore(selectedStoreToModerate.id, status, reason || rejectionReason.trim());
      setSelectedStoreToModerate(null);
      setRejectionReason('');
      await loadAdminData();
    } catch (e) {
      console.error('Store moderation failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublishProductAction = async () => {
    if (!productToUnpublish || !unpublishReason.trim()) return;
    setActionLoading(true);
    try {
      await unpublishProductAdmin(productToUnpublish.id, unpublishReason.trim());
      setProductToUnpublish(null);
      setUnpublishReason('');
      await loadAdminData();
    } catch (e) {
      console.error('Product unpublish failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepublishProduct = async (productId: string) => {
    try {
      await republishProductAdmin(productId);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'published', unpublishReason: '' } : p));
    } catch (e) {
      console.error('Republish failed:', e);
    }
  };

  const handleToggleFeatured = async (productId: string, current: boolean) => {
    try {
      await toggleProductFeatured(productId, !current);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured: !current } : p));
    } catch (e) {
      console.error('Toggle featured failed:', e);
    }
  };

  const handleVerifyPaymentAction = async (orderId: string, isVerified: boolean) => {
    try {
      await verifyOrderPayment(orderId, isVerified);
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        paymentStatus: isVerified ? 'verified' : 'failed',
        status: isVerified ? 'confirmed' : 'pending'
      } : o));
    } catch (e) {
      console.error('Payment verification failed:', e);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusAdmin(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrderToView?.id === orderId) {
        setSelectedOrderToView(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      console.error('Order status update failed:', e);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error('Role update failed:', e);
    }
  };

  const handleUserStatusToggle = async (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(userId, nextStatus);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: nextStatus } : u));
    } catch (e) {
      console.error('Status toggle failed:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await updateSystemSettings({
        deliveryFeeInsideDhaka: Number(feeInsideDhaka),
        deliveryFeeOutsideDhaka: Number(feeOutsideDhaka),
        bkashNumber: bkashNum.trim(),
        nagadNumber: nagadNum.trim(),
        announcementEn: announcementEn.trim(),
        announcementBn: announcementBn.trim(),
        allowCod
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      await loadAdminData();
    } catch (e) {
      console.error('Saving settings failed:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatSlug(cat.slug);
      setCatNameEn(cat.nameEn);
      setCatNameBn(cat.nameBn);
      setCatDisplayOrder(cat.displayOrder);
      setCatIsActive(cat.isActive);
    } else {
      setEditingCategory({
        id: `cat-${Date.now()}`,
        slug: '',
        nameEn: '',
        nameBn: '',
        displayOrder: categories.length + 1,
        isActive: true
      });
      setCatSlug('');
      setCatNameEn('');
      setCatNameBn('');
      setCatDisplayOrder(categories.length + 1);
      setCatIsActive(true);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const slug = catSlug.trim() || catNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await saveCategory({
        id: editingCategory.id,
        slug,
        nameEn: catNameEn.trim(),
        nameBn: catNameBn.trim(),
        displayOrder: Number(catDisplayOrder),
        isActive: catIsActive
      });
      setEditingCategory(null);
      await loadAdminData();
    } catch (e) {
      console.error('Error saving category:', e);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm(isBn ? 'আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
    } catch (e) {
      console.error('Delete category failed:', e);
    }
  };

  // Filtered queries
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch.trim() ||
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.includes(userSearch);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredStores = stores.filter(s => {
    const matchesSearch = !storeSearch.trim() ||
      s.storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.businessLocation.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.district.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.contactPhone.includes(storeSearch);
    const matchesStatus = storeStatusFilter === 'all' || s.status === storeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch.trim() ||
      p.nameEn.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.nameBn.includes(productSearch) ||
      p.storeName?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'all' || p.categorySlug === productCategoryFilter;
    const matchesStatus = productStatusFilter === 'all' || p.status === productStatusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = !orderSearch.trim() ||
      o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone?.includes(orderSearch) ||
      o.paymentTrxId?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingStoresCount = stores.filter(s => s.status === 'pending').length;
  const pendingPaymentsCount = orders.filter(o => o.paymentMethod !== 'cod' && o.paymentStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Notice if seeding occurred */}
      {seedingNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{seedingNotice}</span>
          <button onClick={() => setSeedingNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">×</button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-900 text-white shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {t('adminPanel')} &bull; SELLORA
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                Verified Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active account: <strong className="text-slate-800">{currentUser?.email}</strong> &bull; Role: <span className="font-semibold text-emerald-800">{userProfile?.role || 'admin'}</span>
            </p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeedDefaults}
            loading={seeding}
            icon={<Database className="w-3.5 h-3.5 text-emerald-700" />}
          >
            {t('seedDefaultData')}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadAdminData}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
          >
            {isBn ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tab Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t('adminOverview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'stores' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <StoreIcon className="w-4 h-4 shrink-0" />
              <span>{t('storesManagement')}</span>
            </div>
            {pendingStoresCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                {pendingStoresCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>{t('ordersManagement')}</span>
            </div>
            {pendingPaymentsCount > 0 && (
              <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'products' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>{t('productsManagement')}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'users' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t('usersManagement')}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'categories' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>{t('categoriesManagement')}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'reports' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>{t('reports')}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>{t('platformSettings')}</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'setup' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{t('firstAdminSetup')}</span>
          </button>
        </aside>

        {/* Tab Content Body */}
        <main className="lg:col-span-4 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500">{t('totalDeliveredSales')}</span>
                  <p className="text-xl font-bold text-emerald-900 tabular-nums mt-1">
                    {formatBDT(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0), isBn)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {orders.filter(o => o.status === 'delivered').length} {isBn ? 'ডেলিভারিকৃত অর্ডার' : 'delivered orders'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500">{t('ordersManagement')}</span>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{orders.length}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    {pendingPaymentsCount} {isBn ? 'পেমেন্ট যাচাই বাকি' : 'payments pending'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500">{t('storesManagement')}</span>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{stores.length}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    {pendingStoresCount} {isBn ? 'আবেদন অপেক্ষমান' : 'applications pending'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500">{t('productsManagement')}</span>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{products.length}</p>
                  <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                    {products.filter(p => p.status === 'published').length} {isBn ? 'প্রকাশিত' : 'published'}
                  </p>
                </div>
              </div>

              {/* Action Banner for Pending Stores */}
              {pendingStoresCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-200 text-amber-900">
                      <StoreIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-amber-950">
                        {isBn ? `${pendingStoresCount}টি স্টোর আবেদন পর্যালোচনার জন্য অপেক্ষমান` : `${pendingStoresCount} Store Applications Awaiting Approval`}
                      </h3>
                      <p className="text-[11px] text-amber-800">
                        {isBn ? 'নতুন বিক্রেতাদের দোকান ও যোগাযোগের তথ্য যাচাই করে দ্রুত অনুমোদন দিন।' : 'Review merchant business locations and contact phone numbers.'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setActiveTab('stores')}>
                    {isBn ? 'আবেদনসমূহ দেখুন' : 'Review Applications'}
                  </Button>
                </div>
              )}

              {/* Action Banner for Pending bKash/Nagad Payments */}
              {pendingPaymentsCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-200 text-red-900">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-red-950">
                        {isBn ? `${pendingPaymentsCount}টি অর্ডারের বিকাশ/নগদ পেমেন্ট ট্রানজেকশন যাচাই বাকি` : `${pendingPaymentsCount} Orders Awaiting TrxID Verification`}
                      </h3>
                      <p className="text-[11px] text-red-800">
                        {isBn ? 'গ্রাহকদের পাঠানো TrxID যাচাই করে অর্ডার কনফার্ম করুন।' : 'Verify customer submitted manual TrxIDs to confirm orders.'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => { setOrderStatusFilter('all'); setActiveTab('orders'); }}>
                    {isBn ? 'পেমেন্ট যাচাই করুন' : 'Verify Payments'}
                  </Button>
                </div>
              )}

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {isBn ? 'সাম্প্রতিক প্ল্যাটফর্ম অর্ডারসমূহ' : 'Recent Marketplace Orders'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('viewAll')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900">{o.orderNumber}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {o.customerName} &bull; {o.shippingAddress?.district || 'BD'} &bull; {formatDate(o.createdAt, isBn)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-900 tabular-nums">
                          {formatBDT(o.totalAmount, isBn)}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrderToView(o)}>
                          {t('view')}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      {isBn ? 'এখনও কোনো অর্ডার সম্পন্ন হয়নি।' : 'No orders recorded yet.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORES MANAGEMENT */}
          {activeTab === 'stores' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {t('storesManagement')} ({filteredStores.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'ভেন্ডারদের দোকান যাচাই, অনুমোদন এবং সাসপেনশন নিয়ন্ত্রণ।' : 'Moderate vendor store applications and monitor merchant activities.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      placeholder={isBn ? 'স্টোর, ঠিকানা বা ফোন খুঁজুন...' : 'Search store, phone, location...'}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={storeStatusFilter}
                    onChange={(e) => setStoreStatusFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="pending">{isBn ? 'অপেক্ষমান (Pending)' : 'Pending Moderation'}</option>
                    <option value="approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved Stores'}</option>
                    <option value="rejected">{isBn ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected'}</option>
                    <option value="suspended">{isBn ? 'স্থগিত (Suspended)' : 'Suspended'}</option>
                  </select>
                </div>
              </div>

              {/* Stores Listing */}
              <div className="divide-y divide-slate-100 text-xs">
                {filteredStores.map(s => (
                  <div key={s.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{s.storeName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          s.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          s.status === 'suspended' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {s.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {s.businessLocation}, {s.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {s.contactPhone}
                        </span>
                        <span>Owner UID: <code className="text-slate-700">{s.ownerId.slice(0, 10)}...</code></span>
                      </div>
                      {s.rejectionReason && (
                        <p className="text-red-700 text-[11px] bg-red-50 p-2 rounded-lg border border-red-100 mt-1">
                          <strong>Admin Feedback:</strong> {s.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Store Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {s.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => { setSelectedStoreToModerate(s); handleModerateStoreAction('approved'); }}
                          icon={<Check className="w-3.5 h-3.5" />}
                        >
                          {t('approveStore')}
                        </Button>
                      )}

                      {s.status !== 'rejected' && s.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStoreToModerate(s)}
                          icon={<X className="w-3.5 h-3.5" />}
                        >
                          {t('rejectStore')}
                        </Button>
                      )}

                      {s.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => { setSelectedStoreToModerate(s); handleModerateStoreAction('suspended', 'Administrative policy suspension'); }}
                        >
                          {t('suspendStore')}
                        </Button>
                      )}

                      {s.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => { setSelectedStoreToModerate(s); handleModerateStoreAction('approved', 'Reactivated by admin'); }}
                        >
                          {t('reactivate')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredStores.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো স্টোর পাওয়া যায়নি।' : 'No stores matching this criteria.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {t('ordersManagement')} ({filteredOrders.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'সারা বাংলাদেশের অর্ডারের তথ্য, ট্র্যাকিং ও পেমেন্ট ভেরিফিকেশন।' : 'View marketplace orders, customer contacts and verify TrxIDs.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder={isBn ? 'অর্ডার নম্বর, ক্রেতা বা TrxID...' : 'Search order #, customer, TrxID...'}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="pending">{t('statusPending')}</option>
                    <option value="confirmed">{t('statusConfirmed')}</option>
                    <option value="shipped">{t('statusShipped')}</option>
                    <option value="delivered">{t('statusDelivered')}</option>
                    <option value="cancelled">{t('statusCancelled')}</option>
                  </select>
                </div>
              </div>

              {/* Order Cards */}
              <div className="divide-y divide-slate-100 text-xs">
                {filteredOrders.map(o => (
                  <div key={o.id} className="py-4 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <strong className="text-slate-900 font-bold text-sm">{o.orderNumber}</strong>
                        <span className="text-slate-400 text-[11px]">&bull; {formatDate(o.createdAt, isBn)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-emerald-950 tabular-nums">
                          {formatBDT(o.totalAmount, isBn)}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrderToView(o)}>
                          {t('view')}
                        </Button>
                      </div>
                    </div>

                    {/* Customer & Payment Detail Bar */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-600">
                          Customer: <strong className="text-slate-900">{o.customerName}</strong> ({o.customerPhone})
                        </span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-600">
                          District: <strong>{o.shippingAddress?.district || 'BD'}</strong>
                        </span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-600">
                          Method: <strong className="uppercase">{o.paymentMethod}</strong>
                        </span>
                      </div>

                      {/* Manual Payment Verifier (bKash / Nagad) */}
                      {o.paymentMethod !== 'cod' && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            TrxID: <strong className="text-slate-900 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{o.paymentTrxId || 'N/A'}</strong>
                          </span>

                          {o.paymentStatus === 'pending' ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleVerifyPaymentAction(o.id, true)}
                                icon={<Check className="w-3 h-3" />}
                              >
                                {isBn ? 'ভেরিফাই' : 'Verify'}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleVerifyPaymentAction(o.id, false)}
                                icon={<X className="w-3 h-3" />}
                              >
                                {isBn ? 'বাতিল' : 'Invalid'}
                              </Button>
                            </div>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              o.paymentStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো অর্ডার পাওয়া যায়নি।' : 'No orders matching this filter.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {t('productsManagement')} ({filteredProducts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'মার্কেটপ্লেসের পণ্য তদারকি, ফিচার্ড মার্কিং এবং নিয়ম লঙ্ঘনে অপ্রকাশিত করার ব্যবস্থা।' : 'Curate marketplace catalog, mark featured items and unpublish violating products.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={isBn ? 'পণ্যের নাম বা স্টোর...' : 'Search product or store...'}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
                    <option value="published">{isBn ? 'প্রকাশিত (Published)' : 'Published'}</option>
                    <option value="draft">{isBn ? 'খসড়া / অপ্রকাশিত (Draft)' : 'Draft / Flagged'}</option>
                  </select>
                </div>
              </div>

              {/* Product Listing */}
              <div className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map(p => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.nameEn}
                          className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{isBn ? p.nameBn || p.nameEn : p.nameEn}</h4>
                          {p.isFeatured && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              Featured
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Store: <strong className="text-slate-700">{p.storeName || 'Vendor'}</strong> &bull; Price: <span className="font-bold text-emerald-900">{formatBDT(p.price, isBn)}</span> &bull; Stock: {p.stock}
                        </p>
                        {p.unpublishReason && (
                          <p className="text-[11px] text-red-600 font-medium mt-0.5">
                            Unpublished reason: {p.unpublishReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={p.isFeatured ? 'primary' : 'outline'}
                        onClick={() => handleToggleFeatured(p.id, !!p.isFeatured)}
                        icon={<Star className="w-3.5 h-3.5" />}
                      >
                        {p.isFeatured ? (isBn ? 'ফিচার্ড আছে' : 'Featured') : (isBn ? 'ফিচার্ড করুন' : 'Mark Featured')}
                      </Button>

                      {p.status === 'published' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setProductToUnpublish(p)}
                        >
                          {t('unpublishProduct')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRepublishProduct(p.id)}
                        >
                          {t('republish')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {t('usersManagement')} ({filteredUsers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'নিবন্ধিত ক্রেতা, বিক্রেতা এবং এডমিনদের রোল ও স্ট্যাটাস নিয়ন্ত্রণ।' : 'Manage roles and suspend accounts for platform security.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={isBn ? 'নাম, ইমেইল বা ফোন...' : 'Search name, email, phone...'}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল ভূমিকা' : 'All Roles'}</option>
                    <option value="customer">{t('roleCustomer')}</option>
                    <option value="seller">{t('roleSeller')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                </div>
              </div>

              {/* Users Listing */}
              <div className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map(u => (
                  <div key={u.uid} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{u.displayName || 'No Name'}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-900' :
                          u.role === 'seller' ? 'bg-emerald-100 text-emerald-900' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {u.email} &bull; Phone: {u.phone || 'N/A'} &bull; UID: <code className="text-slate-600">{u.uid.slice(0, 10)}...</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role Selector */}
                      <select
                        value={u.role}
                        onChange={(e) => handleUserRoleChange(u.uid, e.target.value as UserRole)}
                        className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 cursor-pointer"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Status Toggle */}
                      {u.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleUserStatusToggle(u.uid, u.status)}
                        >
                          {t('suspend')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUserStatusToggle(u.uid, u.status)}
                        >
                          {t('reactivate')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No users found matching search.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {t('categoriesManagement')} ({categories.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn ? 'মার্কেটপ্লেসের পণ্য ক্যাটাগরি তৈরি, সম্পাদনা ও প্রদর্শন ক্রম নির্ধারণ।' : 'Manage marketplace categories, multilingual names and ordering.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleSeedDefaults} loading={seeding}>
                    {t('seedDefaultData')}
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => handleOpenCategoryModal()}>
                    {t('add')} {t('categories')}
                  </Button>
                </div>
              </div>

              {/* Categories Table / List */}
              <div className="divide-y divide-slate-100 text-xs">
                {categories.map(c => (
                  <div key={c.id} className="py-3 flex justify-between items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{c.nameEn}</span>
                        <span className="text-slate-400">/</span>
                        <span className="font-semibold text-emerald-900">{c.nameBn}</span>
                        {!c.isActive && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Slug: <code>{c.slug}</code> &bull; Display Order: {c.displayOrder}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleOpenCategoryModal(c)}>
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(c.id)}>
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {t('reports')} &bull; Real Financial & Activity Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn ? 'বাস্তব ডাটাবেজ থেকে সরাসরি গণনা করা রাজস্ব ও পরিসংখ্যান।' : 'Authentic metrics calculated strictly from actual delivered marketplace orders.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Delivered GMV (Revenue)</span>
                  <p className="text-2xl font-extrabold text-emerald-950 tabular-nums">
                    {formatBDT(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0), isBn)}
                  </p>
                  <p className="text-[10px] text-slate-600">Calculated exclusively from completed delivered orders.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Total Orders Inflow</span>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {orders.length}
                  </p>
                  <p className="text-[10px] text-slate-500">Across all customer sessions in Bangladesh.</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 uppercase">Registered Marketplace Merchants</span>
                  <p className="text-2xl font-extrabold text-amber-950 tabular-nums">
                    {stores.filter(s => s.status === 'approved').length}
                  </p>
                  <p className="text-[10px] text-amber-700">{stores.length} total applications received.</p>
                </div>
              </div>

              {/* Payment Methods Distribution */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  {isBn ? 'পেমেন্ট পদ্ধতির অনুপাত' : 'Payment Method Distribution'}
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-500">Cash on Delivery (COD)</span>
                    <p className="text-base font-bold text-slate-900">
                      {orders.filter(o => o.paymentMethod === 'cod').length} {isBn ? 'টি' : 'orders'}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <span className="text-pink-700 font-semibold">bKash (বিকাশ)</span>
                    <p className="text-base font-bold text-pink-950">
                      {orders.filter(o => o.paymentMethod === 'bkash').length} {isBn ? 'টি' : 'orders'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 font-semibold">Nagad (নগদ)</span>
                    <p className="text-base font-bold text-orange-950">
                      {orders.filter(o => o.paymentMethod === 'nagad').length} {isBn ? 'টি' : 'orders'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PLATFORM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {t('platformSettings')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn ? 'ডেলিভারি চার্জ, অফিশিয়াল বিকাশ ও নগদ নম্বর এবং গ্রাহকদের জন্য ব্যানার নোটিশ।' : 'Configure nationwide delivery charges and merchant payment details.'}
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isBn ? 'ঢাকার ভিতরে ডেলিভারি চার্জ (৳)' : 'Delivery Fee Inside Dhaka (BDT)'}
                    type="number"
                    value={feeInsideDhaka}
                    onChange={(e) => setFeeInsideDhaka(Number(e.target.value))}
                    required
                  />

                  <Input
                    label={isBn ? 'ঢাকার বাইরে ডেলিভারি চার্জ (৳)' : 'Delivery Fee Outside Dhaka (BDT)'}
                    type="number"
                    value={feeOutsideDhaka}
                    onChange={(e) => setFeeOutsideDhaka(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isBn ? 'অফিশিয়াল বিকাশ নম্বর (TrxID গ্রহণের জন্য)' : 'bKash Merchant/Personal Number'}
                    value={bkashNum}
                    onChange={(e) => setBkashNum(e.target.value)}
                    placeholder="01711234567"
                    required
                  />

                  <Input
                    label={isBn ? 'অফিশিয়াল নগদ নম্বর' : 'Nagad Merchant/Personal Number'}
                    value={nagadNum}
                    onChange={(e) => setNagadNum(e.target.value)}
                    placeholder="01911765432"
                    required
                  />
                </div>

                <Input
                  label={isBn ? 'মার্কেটপ্লেস ব্যানার বার্তা (English)' : 'Announcement Banner (English)'}
                  value={announcementEn}
                  onChange={(e) => setAnnouncementEn(e.target.value)}
                  placeholder="Express delivery nationwide across Bangladesh!"
                />

                <Input
                  label={isBn ? 'মার্কেটপ্লেস ব্যানার বার্তা (বাংলা)' : 'Announcement Banner (Bengali)'}
                  value={announcementBn}
                  onChange={(e) => setAnnouncementBn(e.target.value)}
                  placeholder="সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি ও শতভাগ খাঁটি পণ্য!"
                />

                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={allowCod}
                    onChange={(e) => setAllowCod(e.target.checked)}
                    className="w-4 h-4 text-emerald-800 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">
                    {isBn ? 'ক্যাশ অন ডেলিভারি (COD) পেমেন্ট বিকল্প চালু রাখুন' : 'Enable Cash on Delivery (COD) Checkout'}
                  </span>
                </label>

                {settingsSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{isBn ? 'প্ল্যাটফর্ম সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' : 'Platform configuration updated successfully.'}</span>
                  </div>
                )}

                <Button type="submit" variant="primary" loading={savingSettings}>
                  {t('save')}
                </Button>
              </form>
            </div>
          )}

          {/* TAB 9: FIRST ADMIN SETUP */}
          {activeTab === 'setup' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-900" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {t('firstAdminSetup')} ({ADMIN_EMAILS.join(', ')})
                </h3>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900">নিরাপদ ওয়ান-টাইম এডমিন অনুমোদন প্রক্রিয়া:</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>এই প্রক্রিয়াটি কঠোরভাবে মনোনীত মাস্টার ইমেইলসমূহের সাথে আবদ্ধ: <code>{ADMIN_EMAILS.join(', ')}</code>।</li>
                  <li>ব্রাউজার ক্লায়েন্ট থেকে কোনো সাধারণ ব্যবহারকারী নিজের ভূমিকা পরিবর্তন করতে পারে না; এটি ফায়ারস্টোর সিকিউরিটি রুলস দ্বারা সুরক্ষিত।</li>
                  <li>নিচের বাটনে ক্লিক করলে আপনার বর্তমান অধিবেশন যাচাই করা হবে এবং ফায়ারস্টোরে <code>admins/{currentUser?.uid}</code> রেকর্ড প্রস্তুত হবে।</li>
                </ol>
              </div>

              {bootstrapSuccess === true && (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{isBn ? 'এডমিন পারমিশন সফলভাবে নিশ্চিত ও সক্রিয় করা হয়েছে!' : 'Admin permissions verified and provisioned in Firestore!'}</span>
                </div>
              )}

              {bootstrapSuccess === false && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Bootstrap failed. Ensure your account is signed in as {ADMIN_EMAILS.join(' or ')}.</span>
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleBootstrapFirstAdmin}
                loading={bootstrapping}
                disabled={!isFirstAdminEmail}
              >
                {isBn ? 'নিরাপদ ফার্স্ট-এডমিন সেটআপ সম্পন্ন করুন' : 'Execute Safe First-Admin Setup'}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Reject Store Modal */}
      {selectedStoreToModerate && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStoreToModerate(null)}
          title={`Review Store: ${selectedStoreToModerate.storeName}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <p><strong>Description:</strong> {selectedStoreToModerate.description}</p>
              <p className="mt-1"><strong>Location:</strong> {selectedStoreToModerate.businessLocation}, {selectedStoreToModerate.district}</p>
              <p className="mt-1"><strong>Phone:</strong> {selectedStoreToModerate.contactPhone}</p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="font-semibold text-slate-700">Rejection / Moderation Feedback:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for declining or revision feedback for vendor..."
                className="w-full p-2 border border-slate-300 rounded-xl"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="primary" onClick={() => handleModerateStoreAction('approved')} loading={actionLoading}>
                {t('approveStore')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleModerateStoreAction('rejected')} loading={actionLoading}>
                {t('rejectStore')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unpublish Product Modal */}
      {productToUnpublish && (
        <Modal
          isOpen={true}
          onClose={() => setProductToUnpublish(null)}
          title={`Unpublish Product: ${productToUnpublish.nameEn}`}
        >
          <div className="space-y-4 text-xs">
            <p>Please specify an administrative unpublish reason visible to the merchant on their dashboard:</p>
            <textarea
              value={unpublishReason}
              onChange={(e) => setUnpublishReason(e.target.value)}
              placeholder="e.g. Prohibited item, missing mandatory pricing details, copyright issue..."
              className="w-full p-2 border border-slate-300 rounded-xl"
              rows={3}
              required
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setProductToUnpublish(null)}>
                {t('cancel')}
              </Button>
              <Button size="sm" variant="danger" onClick={handleUnpublishProductAction} loading={actionLoading}>
                Confirm Unpublish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCategory(null)}
          title={editingCategory.slug ? 'Edit Category' : 'Add Category'}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
            <Input
              label="English Name"
              value={catNameEn}
              onChange={(e) => setCatNameEn(e.target.value)}
              required
            />
            <Input
              label="Bengali Name (বাংলা নাম)"
              value={catNameBn}
              onChange={(e) => setCatNameBn(e.target.value)}
              required
            />
            <Input
              label="Slug"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              placeholder="e.g. clothing"
            />
            <Input
              label="Display Order"
              type="number"
              value={catDisplayOrder}
              onChange={(e) => setCatDisplayOrder(Number(e.target.value))}
              required
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={catIsActive}
                onChange={(e) => setCatIsActive(e.target.checked)}
              />
              <span>Is Active in Navigation</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" type="button" onClick={() => setEditingCategory(null)}>
                {t('cancel')}
              </Button>
              <Button size="sm" variant="primary" type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Order Details Modal */}
      {selectedOrderToView && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderToView(null)}
          title={`Order: ${selectedOrderToView.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span>Customer: <strong>{selectedOrderToView.customerName}</strong></span>
                <span className="font-bold uppercase px-2 py-0.5 rounded-full text-[10px] bg-slate-200">
                  {selectedOrderToView.status}
                </span>
              </div>
              <p className="text-slate-500">Phone: {selectedOrderToView.customerPhone}</p>
              <p className="text-slate-500">
                Address: {selectedOrderToView.shippingAddress?.address}, {selectedOrderToView.shippingAddress?.district}
              </p>
              <p className="text-slate-500">
                Payment: <strong className="uppercase">{selectedOrderToView.paymentMethod}</strong> ({selectedOrderToView.paymentStatus})
                {selectedOrderToView.paymentTrxId && ` - TrxID: ${selectedOrderToView.paymentTrxId}`}
              </p>
            </div>

            {/* Status Changer */}
            <div className="flex items-center gap-2 pt-1">
              <label className="font-semibold text-slate-700">{t('updateStatus')}:</label>
              <select
                value={selectedOrderToView.status}
                onChange={(e) => handleOrderStatusChange(selectedOrderToView.id, e.target.value as OrderStatus)}
                className="border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Order Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900">{t('orderItems')}:</h4>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {(selectedOrderToView.items || []).map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameEn} className="w-9 h-9 object-cover rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{isBn ? item.nameBn || item.nameEn : item.nameEn}</p>
                        <p className="text-[10px] text-slate-500">Store: {item.storeName} &bull; Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums text-emerald-900">
                      {formatBDT(item.subtotal, isBn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
              <span>{t('total')}:</span>
              <span className="text-emerald-950 font-extrabold tabular-nums">
                {formatBDT(selectedOrderToView.totalAmount, isBn)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
