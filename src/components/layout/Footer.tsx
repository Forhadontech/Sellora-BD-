import React from 'react';
import { useLanguage } from '../../locales/LanguageContext';
import { ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      {/* Trust Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isBn ? 'সারা দেশে হোম ডেলিভারি' : 'Nationwide Delivery'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'ঢাকা ও ৬৪ জেলায় পৌঁছে দেয়া হয়' : 'All 64 districts in Bangladesh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isBn ? '১০০% যাচাইকৃত পণ্য' : 'Verified Merchants'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'অনুমোদিত দেশীয় উদ্যোক্তা' : 'Authentic artisan & tech stores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isBn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'পণ্য হাতে পেয়ে পরিশোধ করুন' : 'Pay when received'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isBn ? 'গ্রাহক সেবা ও সহায়তা' : 'Help & Support'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn ? 'বিকাশ ও নগদে সহজ পেমেন্ট' : 'bKash & Nagad support'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <span className="text-xl font-bold tracking-tight text-white">
              SELLORA
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('tagline')}
            </p>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'স্থানীয় উদ্যোক্তা এবং গুণগত মানসম্পন্ন পণ্যের বিশ্বস্ত কেনাকাটার ঠিকানা।'
                : 'Empowering authentic Bangladeshi artisans and modern businesses.'}
            </p>
          </div>

          {/* Customer Care */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {isBn ? 'গ্রাহক সেবা' : 'Customer Care'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('myAccount')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cart')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('shoppingCart')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('products')}
                </button>
              </li>
            </ul>
          </div>

          {/* Seller Portal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {isBn ? 'সেলার জোন' : 'Seller Portal'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('seller-apply')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('sellOnSellora')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('seller-dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('sellerDashboard')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-emerald-400 text-slate-300 font-medium transition-colors"
                >
                  {isBn ? 'এডমিন প্যানেল' : 'Admin Portal'}
                </button>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Methods'}
            </h4>
            <div className="text-xs text-slate-400 space-y-1.5">
              <p>{isBn ? '• ক্যাশ অন ডেলিভারি (COD)' : '• Cash on Delivery (COD)'}</p>
              <p>{isBn ? '• বিকাশ ও নগদ ম্যানুয়াল পেমেন্ট' : '• bKash & Nagad (TrxID verification)'}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                {isBn
                  ? 'ঢাকার মধ্যে ডেলিভারি চার্জ ৳ ৮০, ঢাকার বাইরে ৳ ১৫০।'
                  : 'Inside Dhaka delivery ৳ 80, Outside Dhaka ৳ 150.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SELLORA Bangladesh. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
