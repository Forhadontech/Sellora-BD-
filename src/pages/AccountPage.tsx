import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Order, SubOrder } from '../types';
import { getCustomerOrders, cancelOrder, getSubOrdersForOrder } from '../services/orderService';
import { formatBDT, formatDate } from '../utils/formatters';
import { isValidBDPhone, BD_DISTRICTS, BD_DISTRICTS_BN } from '../utils/validation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { Modal } from '../components/common/Modal';
import {
  User,
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  FileText,
  Camera,
  Image as ImageIcon,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Shield,
  Store as StoreIcon,
  Sparkles,
  Upload,
  Trash2,
  X
} from 'lucide-react';

interface AccountPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, userProfile, refreshProfile, isAdmin, isSeller } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Profile Form State
  const [displayName, setDisplayName] = useState<string>(userProfile?.displayName || '');
  const [phone, setPhone] = useState<string>(userProfile?.phone || '');
  const [defaultAddress, setDefaultAddress] = useState<string>(userProfile?.defaultAddress || '');
  const [defaultDistrict, setDefaultDistrict] = useState<string>(userProfile?.defaultDistrict || 'Dhaka');
  const [avatarUrl, setAvatarUrl] = useState<string>(userProfile?.avatarUrl || currentUser?.photoURL || '');
  const [coverUrl, setCoverUrl] = useState<string>(userProfile?.coverUrl || '');
  const [bio, setBio] = useState<string>(userProfile?.bio || '');

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // File input refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderSubOrders, setSelectedOrderSubOrders] = useState<SubOrder[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<boolean>(false);

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || currentUser?.displayName || '');
      setPhone(userProfile.phone || '');
      setDefaultAddress(userProfile.defaultAddress || '');
      setDefaultDistrict(userProfile.defaultDistrict || 'Dhaka');
      setAvatarUrl(userProfile.avatarUrl || currentUser?.photoURL || '');
      setCoverUrl(userProfile.coverUrl || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile, currentUser]);

  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      setLoadingOrders(true);
      const res = await getCustomerOrders(currentUser.uid);
      setOrders(res || []);
    } catch (e) {
      console.warn('Error fetching customer orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  // Helper for reading image files
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isBn ? 'অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন' : 'Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(isBn ? 'ছবির সাইজ ২ মেগাবাইটের নিচে হতে হবে' : 'Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setter(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    setProfileMsg(null);

    if (phone.trim() && !isValidBDPhone(phone.trim())) {
      setProfileMsg({
        type: 'error',
        text: isBn ? 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন।' : 'Please enter a valid 11-digit BD phone number.'
      });
      return;
    }

    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(),
        phone: phone.trim(),
        defaultAddress: defaultAddress.trim(),
        defaultDistrict,
        avatarUrl: avatarUrl.trim(),
        coverUrl: coverUrl.trim(),
        bio: bio.trim(),
        updatedAt: new Date().toISOString()
      });
      await refreshProfile();
      setProfileMsg({
        type: 'success',
        text: isBn ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' : 'Profile updated successfully.'
      });
      setShowEditModal(false);
    } catch (err: any) {
      console.warn('Profile update note:', err);
      setProfileMsg({
        type: 'error',
        text: err?.message || (isBn ? 'প্রোফাইল সেভ করতে সমস্যা হয়েছে।' : 'Failed to update profile.')
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    try {
      setLoadingOrderDetails(true);
      const subs = await getSubOrdersForOrder(order.id, order.customerId);
      setSelectedOrderSubOrders(subs || []);
    } catch (e) {
      console.warn('Error fetching sub orders:', e);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel || !currentUser) return;
    setCancelling(true);
    try {
      await cancelOrder(orderToCancel.id, currentUser.uid);
      setOrderToCancel(null);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(null);
      }
      await loadOrders();
    } catch (e: any) {
      console.warn('Cancel order note:', e);
    } finally {
      setCancelling(false);
    }
  };

  const renderProgressTracker = (status: Order['status']) => {
    if (status === 'cancelled') {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{t('statusCancelled')}</span>
        </div>
      );
    }

    const steps = [
      { key: 'pending', label: t('statusPending') },
      { key: 'confirmed', label: t('statusConfirmed') },
      { key: 'processing', label: t('statusProcessing') },
      { key: 'shipped', label: t('statusShipped') },
      { key: 'delivered', label: t('statusDelivered') },
    ];

    const stepOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = stepOrder.indexOf(status);

    return (
      <div className="py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-800 z-0 transition-all duration-300"
            style={{ width: `${(Math.max(0, currentIndex) / (stepOrder.length - 1)) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-800 text-white ring-4 ring-emerald-50'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-2 font-medium text-center max-w-[60px] truncate ${
                    isCurrent ? 'text-emerald-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
      {/* Hidden File Inputs for Direct Camera/Upload */}
      <input
        type="file"
        ref={avatarFileRef}
        onChange={(e) => handleFileUpload(e, setAvatarUrl)}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverFileRef}
        onChange={(e) => handleFileUpload(e, setCoverUrl)}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Banner & Identity Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cover Image / Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-linear-to-r from-emerald-800 via-teal-700 to-slate-900 overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-xs">
                <ImageIcon className="w-4 h-4" />
                {isBn ? 'ব্যাকগ্রাউন্ড কভার ছবি যোগ করুন' : 'Default Cover Banner'}
              </span>
            </div>
          )}

          {/* Quick Cover Change Button */}
          <button
            type="button"
            onClick={() => coverFileRef.current?.click()}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-xs"
            title={isBn ? 'কভার ছবি পরিবর্তন করুন' : 'Change Cover Photo'}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isBn ? 'কভার পরিবর্তন' : 'Change Cover'}</span>
          </button>
        </div>

        {/* Profile Details Bar */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Avatar & Basic Info */}
            <div className="flex items-end gap-4">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-slate-100 shadow-md overflow-hidden flex items-center justify-center text-slate-400">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full shadow-md transition-all cursor-pointer group-hover:scale-105"
                  title={isBn ? 'প্রোফাইল ছবি পরিবর্তন করুন' : 'Change Profile Photo'}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {displayName || currentUser?.email?.split('@')[0] || (isBn ? 'ব্যবহারকারী' : 'User')}
                  </h1>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                      <Shield className="w-3 h-3" />
                      {isBn ? 'অ্যাডমিন' : 'Admin'}
                    </span>
                  )}
                  {isSeller && !isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      <StoreIcon className="w-3 h-3" />
                      {isBn ? 'ভেরিফায়েড সেলার' : 'Verified Seller'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser?.email}
                  </span>
                  {phone && (
                    <span className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {phone}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Button: Edit Profile */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <Button
                variant="primary"
                onClick={() => setShowEditModal(true)}
                icon={<Edit3 className="w-4 h-4" />}
              >
                {isBn ? 'প্রোফাইল এডিট করুন' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          {/* User Bio */}
          {bio ? (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100 max-w-2xl mt-2">
              <span className="font-semibold text-slate-900 block mb-0.5">
                {isBn ? 'বায়ো (Bio):' : 'Bio:'}
              </span>
              {bio}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic mt-1">
              {isBn ? 'কোনো বায়ো যুক্ত করা হয়নি। প্রোফাইল এডিট করে নিজের বায়ো যোগ করুন।' : 'No bio added yet. Click Edit Profile to add your bio.'}
            </p>
          )}

          {profileMsg && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 bg-slate-50/70 px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-800 text-emerald-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isBn ? 'প্রোফাইল বিবরণ ও ঠিকানা' : 'Profile & Delivery Details'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-emerald-800 text-emerald-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isBn ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
            {orders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full text-[10px]">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Profile View & Delivery Information */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-800" />
                {isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isBn ? 'সম্পাদনা' : 'Edit'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'পূর্ণ নাম' : 'Full Name'}</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{displayName || 'N/A'}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}</span>
                <p className="font-semibold text-slate-800 mt-0.5">{currentUser?.email || 'N/A'}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'ফোন নম্বর' : 'Phone Number'}</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {phone || (isBn ? 'দেওয়া হয়নি (ঐচ্ছিক)' : 'Not set (Optional)')}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'বায়ো' : 'Bio'}</span>
                <p className="text-slate-700 mt-0.5 leading-relaxed">
                  {bio || (isBn ? 'বায়ো যুক্ত করা হয়নি' : 'No bio added')}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Delivery Address */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                {isBn ? 'ডিফল্ট ডেলিভারি ঠিকানা' : 'Default Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isBn ? 'সম্পাদনা' : 'Edit'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'জেলা' : 'District'}</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {defaultDistrict} {isBn && BD_DISTRICTS_BN[defaultDistrict] ? `(${BD_DISTRICTS_BN[defaultDistrict]})` : ''}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">{isBn ? 'সম্পূর্ণ ঠিকানা' : 'Street Address'}</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed font-medium">
                  {defaultAddress || (isBn ? 'কোনো ঠিকানা সেভ করা নেই। চেকআউট দ্রুত করতে ঠিকানা যোগ করুন।' : 'No address saved yet.')}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="w-full"
                >
                  {isBn ? 'ঠিকানা ও প্রোফাইল পরিবর্তন করুন' : 'Update Profile & Address'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {loadingOrders ? (
            <Loader text={t('loading')} />
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {isBn ? 'আপনার কোনো পূর্ববর্তী অর্ডার নেই।' : 'No orders found.'}
              </p>
              <Button size="sm" variant="primary" onClick={() => onNavigate('products')}>
                {t('shopNow')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const canCancel = ord.status === 'pending' || ord.status === 'confirmed';
                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 font-medium">{t('orderNumber')}</span>
                        <p className="font-bold text-slate-900">{ord.orderNumber}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 font-medium">{t('orderDate')}</span>
                        <p className="text-slate-700">{formatDate(ord.createdAt, isBn)}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 font-medium">{t('total')}</span>
                        <p className="font-bold text-emerald-900 tabular-nums">
                          {formatBDT(ord.totalAmount, isBn)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 font-medium">{t('orderStatus')}</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(ord)}
                          icon={<FileText className="w-3.5 h-3.5" />}
                        >
                          {isBn ? 'বিস্তারিত' : 'Details'}
                        </Button>

                        {canCancel && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setOrderToCancel(ord)}
                          >
                            {t('cancelOrder')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Tracker Strip */}
                    {renderProgressTracker(ord.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          title={isBn ? 'প্রোফাইল সম্পাদনা করুন' : 'Edit Profile'}
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
            {/* Visual Profile Pictures Section */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                {isBn ? 'ছবি ও ব্যাকগ্রাউন্ড কভার' : 'Profile Picture & Background Cover'}
              </h4>

              {/* 1. Profile Picture / Avatar */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  {isBn ? 'প্রোফাইলের ছবি (Profile Photo)' : 'Profile Photo'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-300 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => avatarFileRef.current?.click()}
                        icon={<Upload className="w-3.5 h-3.5" />}
                      >
                        {isBn ? 'ডিভাইস থেকে ছবি আপলোড' : 'Upload from Device'}
                      </Button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-xs text-red-600 hover:text-red-800 p-1 rounded cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder={isBn ? 'অথবা সরাসরি ছবির লিংক (URL) দিন' : 'Or paste Image URL'}
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Cover / Background Image */}
              <div className="space-y-2 pt-2 border-t border-slate-200/70">
                <label className="block font-semibold text-slate-700">
                  {isBn ? 'প্রোফাইলের ব্যাকগ্রাউন্ড ইমেজ (Cover Image)' : 'Profile Background Cover'}
                </label>
                <div className="space-y-2">
                  <div className="h-24 w-full rounded-lg border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center relative">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                        <ImageIcon className="w-4 h-4" />
                        {isBn ? 'কোনো ব্যাকগ্রাউন্ড ছবি নেই' : 'No background image'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => coverFileRef.current?.click()}
                      icon={<Upload className="w-3.5 h-3.5" />}
                    >
                      {isBn ? 'কভার ছবি আপলোড করুন' : 'Upload Cover'}
                    </Button>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="text-xs text-red-600 hover:text-red-800 p-1 rounded cursor-pointer"
                        title="Remove Cover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder={isBn ? 'অথবা কভার ছবির লিংক (URL) দিন' : 'Or paste Cover Image URL'}
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="space-y-3">
              <Input
                label={isBn ? 'পূর্ণ নাম' : 'Full Name'}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Forhad Ahmed"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                  {isBn ? 'বায়ো (নিজের সম্পর্কে সংক্ষিপ্ত বিবরণ)' : 'Bio / Short description'}
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={isBn ? 'যেমন: অনলাইন কেনাকাটায় অভিজ্ঞ ক্রেতা...' : 'Tell us a little about yourself...'}
                  className="w-full bg-white text-slate-900 text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <Input
                label={isBn ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                helperText={isBn ? 'ঐচ্ছিক, ডেলিভারির সুবিধার জন্য' : 'Optional, for delivery notifications'}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                  {t('district')}
                </label>
                <select
                  value={defaultDistrict}
                  onChange={(e) => setDefaultDistrict(e.target.value)}
                  className="w-full bg-white text-slate-900 text-xs rounded-lg border border-slate-300 min-h-[38px] px-3 py-1.5 focus:ring-emerald-700"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} {isBn && BD_DISTRICTS_BN[d] ? `(${BD_DISTRICTS_BN[d]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={isBn ? 'ডিফল্ট ডেলিভারি ঠিকানা' : 'Default Delivery Address'}
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                placeholder={isBn ? 'বাড়ি নং, রোড নং, এলাকা' : 'House, Road, Area'}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={savingProfile}
              >
                {isBn ? 'প্রোফাইল সেভ করুন' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`${t('orderNumber')}: ${selectedOrder.orderNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Tracker */}
            {renderProgressTracker(selectedOrder.status)}

            {/* Delivery Details */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase">
                {t('shippingAddress')}
              </h4>
              <p>
                <strong>{selectedOrder.shippingAddress.fullName}</strong> ({selectedOrder.shippingAddress.phone})
              </p>
              <p className="text-slate-600">
                {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.district}
              </p>
              {selectedOrder.shippingAddress.note && (
                <p className="text-slate-500 italic">
                  Note: {selectedOrder.shippingAddress.note}
                </p>
              )}
            </div>

            {/* Items Breakdown by Store */}
            {loadingOrderDetails ? (
              <Loader size="sm" />
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  {t('orderItems')}
                </h4>
                {selectedOrderSubOrders.map((sub) => (
                  <div key={sub.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-semibold text-slate-800">
                      {t('soldBy')} <span className="text-emerald-900">{sub.storeName}</span>
                    </div>
                    {sub.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                        <span>
                          {isBn ? (item.nameBn || item.nameEn) : item.nameEn} &times; {item.quantity}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatBDT(item.subtotal, isBn)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="pt-3 border-t border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>{t('subtotal')}</span>
                <span className="font-semibold tabular-nums">{formatBDT(selectedOrder.subtotal, isBn)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isBn ? 'ডেলিভারি চার্জ' : 'Delivery Fee'}</span>
                <span className="font-semibold tabular-nums">{formatBDT(selectedOrder.deliveryFee, isBn)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                <span>{t('total')}</span>
                <span className="text-emerald-900 tabular-nums">{formatBDT(selectedOrder.totalAmount, isBn)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Order Confirm */}
      {orderToCancel && (
        <Modal
          isOpen={true}
          onClose={() => setOrderToCancel(null)}
          title={t('cancelOrder')}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              {isBn
                ? `আপনি কি নিশ্চিত যে অর্ডার নম্বর ${orderToCancel.orderNumber} বাতিল করতে চান?`
                : `Are you sure you want to cancel order ${orderToCancel.orderNumber}?`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOrderToCancel(null)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" loading={cancelling} onClick={handleConfirmCancel}>
                {t('confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
