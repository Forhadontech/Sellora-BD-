import React, { useState, useEffect } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Store } from '../types';
import { getStoreByOwnerId, submitStoreApplication } from '../services/storeService';
import { isValidBDPhone, BD_DISTRICTS, BD_DISTRICTS_BN } from '../utils/validation';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { ImageUploader } from '../components/common/ImageUploader';
import {
  Store as StoreIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface SellerApplyPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const SellerApplyPage: React.FC<SellerApplyPageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, userProfile } = useAuth();

  const [existingStore, setExistingStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Application form fields
  const [storeName, setStoreName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [businessLocation, setBusinessLocation] = useState<string>('');
  const [district, setDistrict] = useState<string>('Dhaka');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchApplication = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const s = await getStoreByOwnerId(currentUser.uid);
      setExistingStore(s);
      if (s) {
        setStoreName(s.storeName);
        setDescription(s.description);
        setContactPhone(s.contactPhone);
        setBusinessLocation(s.businessLocation);
        setDistrict(s.district);
        setLogoUrl(s.logoUrl || '');
        setCoverUrl(s.coverUrl || '');
      }
    } catch (e) {
      console.error('Error fetching store application:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <StoreIcon className="w-12 h-12 text-emerald-800 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{t('sellerApplication')}</h2>
        <p className="text-xs text-slate-600">
          {isBn
            ? 'সেলার আবেদন করতে অনুগ্রহ করে প্রথমে আপনার একাউন্টে লগইন করুন।'
            : 'Please log in or register before submitting a seller store application.'}
        </p>
        <Button variant="primary" onClick={() => onNavigate('login')}>
          {t('login')}
        </Button>
      </div>
    );
  }

  if (loading) return <Loader text={t('loading')} />;

  // Case 1: Store exists and is APPROVED
  if (existingStore && existingStore.status === 'approved') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{t('storeApprovedTitle')}</h2>
        <p className="text-sm text-slate-600">
          {isBn
            ? `আপনার স্টোর "${existingStore.storeName}" সক্রিয় রয়েছে। আপনি পণ্য যোগ করতে এবং অর্ডার দেখতে পারেন।`
            : `Your store "${existingStore.storeName}" is approved and active. You can now publish products and manage orders.`}
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => onNavigate('seller-dashboard')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {t('sellerDashboard')}
        </Button>
      </div>
    );
  }

  // Case 2: Store exists and is PENDING
  if (existingStore && existingStore.status === 'pending') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{t('applicationPendingTitle')}</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          {t('applicationPendingDesc')}
        </p>
        <div className="p-4 bg-slate-50 rounded-lg text-xs text-left space-y-2 border border-slate-200">
          <div>
            <span className="text-slate-500">{t('storeName')}:</span>{' '}
            <strong className="text-slate-900">{existingStore.storeName}</strong>
          </div>
          <div>
            <span className="text-slate-500">{t('businessLocation')}:</span>{' '}
            <span className="text-slate-800">{existingStore.businessLocation}, {existingStore.district}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('contactPhone')}:</span>{' '}
            <span className="text-slate-800">{existingStore.contactPhone}</span>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Store exists and is REJECTED
  if (existingStore && existingStore.status === 'rejected') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-3 bg-red-50 p-6 rounded-2xl border border-red-200 text-red-900">
          <XCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold">{t('applicationRejectedTitle')}</h2>
          {existingStore.rejectionReason && (
            <div className="text-xs bg-white/80 p-3 rounded-lg border border-red-200 text-left">
              <strong>{t('rejectionReason')}</strong> {existingStore.rejectionReason}
            </div>
          )}
          <p className="text-xs text-red-700">
            {isBn
              ? 'অনুগ্রহ করে উপরের কারণসমূহ সংশোধন করে পুনরায় আবেদন জমা দিন।'
              : 'Please revise your store details below according to the feedback and re-submit.'}
          </p>
        </div>

        {/* Allow re-submitting with edits */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase pb-4 border-b border-slate-100">
            {isBn ? 'সংশোধিত আবেদন ফরম' : 'Revised Application Form'}
          </h3>
          {/* Re-use submission form below */}
        </div>
      </div>
    );
  }

  // Case 4: Store exists and is SUSPENDED
  if (existingStore && existingStore.status === 'suspended') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{t('applicationSuspendedTitle')}</h2>
        <p className="text-xs text-slate-600">
          {isBn
            ? 'নিয়ম লঙ্ঘনের কারণে আপনার স্টোর সাময়িকভাবে স্থগিত করা হয়েছে। এডমিন সহায়তার সাথে যোগাযোগ করুন।'
            : 'Your store has been suspended by an administrator. Please reach out to support.'}
        </p>
      </div>
    );
  }

  // Default: Fresh store application form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!storeName.trim()) {
      setErrorMsg(t('fieldRequired') + ` (${t('storeName')})`);
      return;
    }
    if (!description.trim()) {
      setErrorMsg(t('fieldRequired') + ` (${t('storeDescription')})`);
      return;
    }
    if (!isValidBDPhone(contactPhone)) {
      setErrorMsg(t('validBDPhoneRequired'));
      return;
    }
    if (!businessLocation.trim()) {
      setErrorMsg(t('fieldRequired') + ` (${t('businessLocation')})`);
      return;
    }

    setSubmitting(true);
    try {
      await submitStoreApplication({
        ownerId: currentUser.uid,
        storeName: storeName.trim(),
        description: description.trim(),
        contactPhone: contactPhone.trim(),
        businessLocation: businessLocation.trim(),
        district,
        logoUrl,
        coverUrl
      });
      await fetchApplication();
    } catch (err: any) {
      console.error('Store application failed:', err);
      setErrorMsg(err.message || 'Failed to submit store application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
          {t('sellerPortal')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {t('sellerApplication')}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {t('sellerApplicationDesc')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('storeName')}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g. Dhaka Craft & Loom"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide">
              {t('storeDescription')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={isBn ? 'আপনার স্টোর ও বিক্রিত পণ্যের ধরন সংক্ষেপে লিখুন' : 'Describe your business and products'}
              className="w-full bg-white text-slate-900 text-xs rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('contactPhone')}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide">
                {t('district')} <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 min-h-[42px] px-3.5 py-2 focus:ring-emerald-700"
              >
                {BD_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} {isBn && BD_DISTRICTS_BN[d] ? `(${BD_DISTRICTS_BN[d]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label={t('businessLocation')}
            value={businessLocation}
            onChange={(e) => setBusinessLocation(e.target.value)}
            placeholder={isBn ? 'দোকান/অফিস নম্বর, রোড, এলাকা' : 'Shop/Office address'}
            required
          />

          {/* Logo Upload */}
          <ImageUploader
            folder="stores"
            maxImages={1}
            initialImages={logoUrl ? [logoUrl] : []}
            onImagesChange={(urls) => setLogoUrl(urls[0] || '')}
            label={t('storeLogo')}
            helperText={isBn ? 'দোকানের লোগো (বর্গাকার প্রস্তাবিত)' : 'Store logo (Square recommended)'}
          />

          {/* Cover Image Upload */}
          <ImageUploader
            folder="stores"
            maxImages={1}
            initialImages={coverUrl ? [coverUrl] : []}
            onImagesChange={(urls) => setCoverUrl(urls[0] || '')}
            label={t('storeCover')}
            helperText={isBn ? 'স্টোর ব্যানারের ছবি (১৬:৯ অনুপাত প্রস্তাবিত)' : 'Store cover banner (16:9 ratio recommended)'}
          />

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={submitting}
          >
            {t('submitApplication')}
          </Button>

          <p className="text-[11px] text-slate-500 text-center">
            {isBn
              ? '* নতুন স্টোর সরাসরি অনুমোদিত হয় না। এডমিন যাচাই করে ২৪ ঘণ্টার মধ্যে অনুমোদন প্রদান করবেন।'
              : '* A new store requires administrative review and is never auto-approved.'}
          </p>
        </form>
      </div>
    </div>
  );
};
