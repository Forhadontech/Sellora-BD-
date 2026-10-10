import React from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useCart } from '../context/CartContext';
import { formatBDT } from '../utils/formatters';
import { Button } from '../components/common/Button';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

interface CartPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { cart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('cartEmpty')}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {t('cartEmptyDesc')}
        </p>
        <div className="pt-2">
          <Button variant="primary" onClick={() => onNavigate('products')}>
            {t('backToShopping')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-slate-900">{t('shoppingCart')}</h1>
        <p className="text-xs text-slate-500">
          {isBn ? `মোট ${totalItems}টি পণ্য নির্বাচন করা হয়েছে` : `${totalItems} items in bag`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Itemized List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-center justify-between"
            >
              {/* Product Info & Thumbnail */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.nameEn}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block truncate">
                    {item.storeName}
                  </span>
                  <h3
                    onClick={() => onNavigate('product-detail', item.productId)}
                    className="text-sm font-semibold text-slate-900 hover:text-emerald-900 cursor-pointer truncate"
                  >
                    {isBn ? (item.nameBn || item.nameEn) : item.nameEn}
                  </h3>
                  <div className="text-xs font-bold text-emerald-900 tabular-nums">
                    {formatBDT(item.price, isBn)}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Removal */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    aria-label="Decrease"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold tabular-nums text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                    aria-label="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Module */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 sticky top-20">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {isBn ? 'অর্ডার সারসংক্ষেপ' : 'Order Summary'}
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t('subtotal')}</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatBDT(subtotal, isBn)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t('deliveryFee')}</span>
              <span className="text-slate-500 italic">
                {isBn ? 'চেকআউটে নির্ধারিত হবে' : 'Calculated at checkout'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] leading-relaxed">
              {isBn
                ? 'ঢাকার মধ্যে ডেলিভারি চার্জ ৳ ৮০, ঢাকার বাইরে ৳ ১৫০।'
                : 'Inside Dhaka delivery ৳ 80, Outside Dhaka ৳ 150.'}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => onNavigate('checkout')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {t('proceedToCheckout')}
          </Button>

          <button
            onClick={() => onNavigate('products')}
            className="w-full text-center text-xs font-semibold text-emerald-800 hover:underline pt-1 cursor-pointer"
          >
            {t('backToShopping')}
          </button>
        </div>
      </div>
    </div>
  );
};
