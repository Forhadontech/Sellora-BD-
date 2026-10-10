import React, { useState, useEffect, useId } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatBDT } from '../utils/formatters';
import { isValidBDPhone, BD_DISTRICTS, BD_DISTRICTS_BN } from '../utils/validation';
import { getSettings, placeOrder } from '../services/orderService';
import { SystemSettings, PaymentMethod } from '../types';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { ShieldCheck, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const { cart, subtotal, clearCart } = useCart();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  // Form State
  const [fullName, setFullName] = useState<string>(userProfile?.displayName || '');
  const [phone, setPhone] = useState<string>(userProfile?.phone || '');
  const [address, setAddress] = useState<string>(userProfile?.defaultAddress || '');
  const [district, setDistrict] = useState<string>(userProfile?.defaultDistrict || 'Dhaka');
  const [note, setNote] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [trxId, setTrxId] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [idempotencyKey] = useState<string>(() => `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const fetchConf = async () => {
      try {
        const s = await getSettings();
        setSettings(s);
      } catch (e) {
        console.error('Error fetching settings:', e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchConf();
  }, []);

  // Update defaults when userProfile loads
  useEffect(() => {
    if (userProfile) {
      if (!fullName) setFullName(userProfile.displayName || '');
      if (!phone) setPhone(userProfile.phone || '');
      if (!address) setAddress(userProfile.defaultAddress || '');
      if (userProfile.defaultDistrict) setDistrict(userProfile.defaultDistrict);
    }
  }, [userProfile]);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{t('cartEmpty')}</h2>
        <Button variant="primary" onClick={() => onNavigate('products')}>
          {t('backToShopping')}
        </Button>
      </div>
    );
  }

  if (loadingSettings || !settings) {
    return <Loader text={t('loading')} />;
  }

  // Delivery fee calculation
  const isInsideDhaka = district.toLowerCase() === 'dhaka';
  const deliveryFee = isInsideDhaka
    ? settings.deliveryFeeInsideDhaka
    : settings.deliveryFeeOutsideDhaka;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Authentication Guard
    if (!currentUser) {
      setErrorMsg(isBn ? 'অর্ডার করতে অনুগ্রহ করে প্রথমে লগইন করুন।' : 'Please sign in to place an order.');
      onNavigate('login');
      return;
    }

    // Name check
    if (!fullName.trim()) {
      setErrorMsg(t('fieldRequired') + ` (${t('fullName')})`);
      return;
    }

    // BD Phone validation
    if (!isValidBDPhone(phone)) {
      setErrorMsg(t('validBDPhoneRequired'));
      return;
    }

    // Address check
    if (!address.trim()) {
      setErrorMsg(t('fieldRequired') + ` (${t('address')})`);
      return;
    }

    // TrxID check for bKash/Nagad
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !trxId.trim()) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Please provide the Transaction ID (TrxID).');
      return;
    }

    setSubmitting(true);

    try {
      const orderItemsParam = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const cleanShippingAddress: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        district,
      };
      if (note.trim()) {
        cleanShippingAddress.note = note.trim();
      }

      const orderPayload: any = {
        customerId: currentUser.uid,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        shippingAddress: cleanShippingAddress,
        items: orderItemsParam,
        paymentMethod,
        idempotencyKey
      };
      if (trxId.trim()) {
        orderPayload.paymentTrxId = trxId.trim();
      }

      const result = await placeOrder(orderPayload);

      clearCart();
      onNavigate('order-confirmation', result.orderId);
    } catch (err: any) {
      console.error('Order placement failed:', err);
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('cart')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{isBn ? 'ব্যাগে ফিরে যান' : 'Back to Cart'}</span>
      </button>

      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">
          {isBn ? 'চেকআউট ও ডেলিভারি' : 'Checkout & Delivery'}
        </h1>
        <p className="text-xs text-slate-500">
          {isBn ? 'আপনার বিস্তারিত ডেলিভারি তথ্য প্রদান করুন' : 'Provide your verified delivery information'}
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Shipping Details & Payment Option */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Customer & Shipping Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              1. {t('shippingAddress')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fullName')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Forhad Ahmed"
                required
              />

              <Input
                label={t('phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                {t('district')} <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 min-h-[42px] px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 cursor-pointer"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} {isBn && BD_DISTRICTS_BN[d] ? `(${BD_DISTRICTS_BN[d]})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                {isInsideDhaka
                  ? (isBn ? 'ঢাকার ভিতরে: ডেলিভারি চার্জ ৳ ৮০' : 'Inside Dhaka: Delivery fee ৳ 80')
                  : (isBn ? 'ঢাকার বাইরে: ডেলিভারি চার্জ ৳ ১৫০' : 'Outside Dhaka: Delivery fee ৳ 150')}
              </p>
            </div>

            <Input
              label={t('address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isBn ? 'বাড়ি নং, রোড নং, এলাকা বিস্তারিত' : 'House no, Road no, Area details'}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                {t('orderNote')}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={isBn ? 'ডেলিভারিম্যানের জন্য বিশেষ নির্দেশনা (যদি থাকে)' : 'Any special delivery instructions'}
                className="w-full bg-white text-slate-900 text-xs rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              2. {t('paymentMethod')}
            </h2>

            <div className="space-y-3">
              {/* Option 1: Cash on Delivery */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                paymentMethod === 'cod'
                  ? 'border-emerald-800 bg-emerald-50/20 ring-1 ring-emerald-800'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-emerald-800 focus:ring-emerald-700"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {t('cashOnDelivery')}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {t('codDescription')}
                  </span>
                </div>
              </label>

              {/* Option 2: bKash Manual */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                paymentMethod === 'bkash'
                  ? 'border-emerald-800 bg-emerald-50/20 ring-1 ring-emerald-800'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bkash"
                  checked={paymentMethod === 'bkash'}
                  onChange={() => setPaymentMethod('bkash')}
                  className="mt-1 text-emerald-800 focus:ring-emerald-700"
                />
                <div className="w-full">
                  <span className="text-sm font-bold text-slate-900 block">
                    {t('bkashManual')}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {isBn
                      ? `বিকাশ নম্বর: ${settings.bkashNumber} (সেন্ড মানি / পার্সোনাল)`
                      : `bKash Merchant/Personal: ${settings.bkashNumber}`}
                  </span>

                  {paymentMethod === 'bkash' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {t('sendMoneyNotice')} <strong>{settings.bkashNumber}</strong>
                      </p>
                      <Input
                        label={t('trxId')}
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder={t('trxIdPlaceholder')}
                        required={paymentMethod === 'bkash'}
                      />
                      <p className="text-[10px] text-amber-700 font-medium">
                        * {t('paymentAwaitingVerification')}
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Nagad Manual */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                paymentMethod === 'nagad'
                  ? 'border-emerald-800 bg-emerald-50/20 ring-1 ring-emerald-800'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="nagad"
                  checked={paymentMethod === 'nagad'}
                  onChange={() => setPaymentMethod('nagad')}
                  className="mt-1 text-emerald-800 focus:ring-emerald-700"
                />
                <div className="w-full">
                  <span className="text-sm font-bold text-slate-900 block">
                    {t('nagadManual')}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {isBn
                      ? `নগদ নম্বর: ${settings.nagadNumber} (সেন্ড মানি / পার্সোনাল)`
                      : `Nagad Merchant/Personal: ${settings.nagadNumber}`}
                  </span>

                  {paymentMethod === 'nagad' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200 space-y-2">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {t('sendMoneyNotice')} <strong>{settings.nagadNumber}</strong>
                      </p>
                      <Input
                        label={t('trxId')}
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder={t('trxIdPlaceholder')}
                        required={paymentMethod === 'nagad'}
                      />
                      <p className="text-[10px] text-amber-700 font-medium">
                        * {t('paymentAwaitingVerification')}
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Action */}
        <div className="space-y-6 sticky top-20">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {isBn ? 'চূড়ান্ত হিসাব' : 'Order Breakdown'}
            </h2>

            {/* Snapshot item list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
              {cart.map((i) => (
                <div key={i.productId} className="pt-2 flex justify-between items-center text-slate-700">
                  <span className="truncate max-w-[160px]">
                    {isBn ? (i.nameBn || i.nameEn) : i.nameEn} &times; {i.quantity}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 shrink-0">
                    {formatBDT(i.price * i.quantity, isBn)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t('subtotal')}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBDT(subtotal, isBn)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('deliveryFee')}</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBDT(deliveryFee, isBn)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-950 pt-2 border-t border-slate-100">
                <span>{t('total')}</span>
                <span className="text-base tabular-nums text-emerald-900">
                  {formatBDT(grandTotal, isBn)}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              {submitting ? t('placingOrder') : t('placeOrder')}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>{isBn ? 'নিরাপদ লেনদেন ও সরাসরি ট্র্যাকিং' : 'Secure transaction & direct order tracking'}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
