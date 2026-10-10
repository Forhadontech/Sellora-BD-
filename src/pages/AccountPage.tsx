import React, { useState, useEffect } from 'react';
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
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  User,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  FileText
} from 'lucide-react';

interface AccountPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Profile Form State
  const [displayName, setDisplayName] = useState<string>(userProfile?.displayName || '');
  const [phone, setPhone] = useState<string>(userProfile?.phone || '');
  const [defaultAddress, setDefaultAddress] = useState<string>(userProfile?.defaultAddress || '');
  const [defaultDistrict, setDefaultDistrict] = useState<string>(userProfile?.defaultDistrict || 'Dhaka');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderSubOrders, setSelectedOrderSubOrders] = useState<SubOrder[]>([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<boolean>(false);

  // Cancel Order Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setDefaultAddress(userProfile.defaultAddress || '');
      setDefaultDistrict(userProfile.defaultDistrict || 'Dhaka');
    }
  }, [userProfile]);

  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      setLoadingOrders(true);
      const res = await getCustomerOrders(currentUser.uid);
      setOrders(res || []);
    } catch (e) {
      console.error('Error fetching customer orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileMsg(null);

    if (phone && !isValidBDPhone(phone)) {
      setProfileMsg({ type: 'error', text: t('validBDPhoneRequired') });
      return;
    }

    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName.trim(),
        phone: phone.trim(),
        defaultAddress: defaultAddress.trim(),
        defaultDistrict,
        updatedAt: new Date().toISOString()
      });
      await refreshProfile();
      setProfileMsg({ type: 'success', text: isBn ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' : 'Profile updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
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
      console.error('Error fetching sub orders:', e);
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
      console.error('Cancel order error:', e);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('myAccount')}</h1>
          <p className="text-xs text-slate-500">{currentUser?.email}</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'আমার অর্ডারসমূহ' : 'My Orders'}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
          </button>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {loadingOrders ? (
            <Loader text={t('loading')} />
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              {isBn ? 'ব্যক্তিগত তথ্য ও ডেলিভারি ঠিকানা' : 'Personal & Delivery Info'}
            </h2>

            <Input
              label={t('fullName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label={t('phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              helperText={isBn ? 'অর্ডারের সময় স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে' : 'Used automatically during checkout'}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                {t('district')}
              </label>
              <select
                value={defaultDistrict}
                onChange={(e) => setDefaultDistrict(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 min-h-[42px] px-3.5 py-2 focus:ring-emerald-700"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} {isBn && BD_DISTRICTS_BN[d] ? `(${BD_DISTRICTS_BN[d]})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={isBn ? 'ডিফল্ট ঠিকানা' : 'Default Address'}
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              placeholder={isBn ? 'বাড়ি নং, রোড নং, এলাকা' : 'House, Road, Area'}
            />

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <Button type="submit" variant="primary" loading={savingProfile}>
              {t('save')}
            </Button>
          </form>
        </div>
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
                <span>{t('deliveryFee')}</span>
                <span className="font-semibold tabular-nums">{formatBDT(selectedOrder.deliveryFee, isBn)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-900 pt-2 border-t border-slate-100">
                <span>{t('total')}</span>
                <span className="tabular-nums">{formatBDT(selectedOrder.totalAmount, isBn)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleConfirmCancel}
        title={t('cancelOrder')}
        message={t('cancelConfirmPrompt')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        isDestructive={true}
        loading={cancelling}
      />
    </div>
  );
};
