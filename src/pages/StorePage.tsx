import React, { useState, useEffect } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { Store, Product } from '../types';
import { getStoreById } from '../services/storeService';
import { getProductsForStore } from '../services/productService';
import { ProductCard } from '../components/product/ProductCard';
import { Loader } from '../components/common/Loader';
import { MapPin, Phone, ShieldCheck, Store as StoreIcon } from 'lucide-react';

interface StorePageProps {
  storeId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const StorePage: React.FC<StorePageProps> = ({ storeId, onNavigate }) => {
  const { t, isBn } = useLanguage();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const [s, prods] = await Promise.all([
          getStoreById(storeId),
          getProductsForStore(storeId)
        ]);
        setStore(s);
        setProducts(prods.filter(p => p.status === 'published'));
      } catch (e) {
        console.error('Error fetching store:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [storeId]);

  if (loading) return <Loader text={t('loading')} />;
  if (!store) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">
          {isBn ? 'স্টোরটি খুঁজে পাওয়া যায়নি' : 'Store not found'}
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Store Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
        {store.coverUrl ? (
          <div className="h-48 sm:h-64 w-full relative">
            <img
              src={store.coverUrl}
              alt={store.storeName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-r from-emerald-900 to-slate-900" />
        )}

        <div className="relative px-6 py-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 bg-white border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <StoreIcon className="w-8 h-8 text-emerald-800" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {store.storeName}
                </h1>
                {store.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? 'যাচাইকৃত সেলার' : 'Verified Merchant'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {store.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{store.businessLocation}, {store.district}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{store.contactPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products Grid */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {isBn ? 'এই স্টোরের পণ্যসমূহ' : 'Store Products'}
          </h2>
          <p className="text-xs text-slate-500">
            {isBn ? `মোট ${products.length}টি পণ্য পাওয়া গেছে` : `${products.length} products listed`}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">{t('noProductsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={(id) => onNavigate('product-detail', id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
