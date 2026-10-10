import React, { useEffect, useState } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { Product, Category } from '../types';
import { getPublishedProducts, getFeaturedProducts } from '../services/productService';
import { getAllCategories } from '../services/adminService';
import { ProductCard } from '../components/product/ProductCard';
import { Loader } from '../components/common/Loader';
import { Button } from '../components/common/Button';
import heroBanner from '../assets/images/sellora_hero_banner_1791591186879.jpg';
import {
  ArrowRight,
  Shirt,
  Sparkles,
  Tv,
  Headphones,
  Heart,
  Home,
  Watch,
  Package,
  ShieldCheck
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { t, isBn } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [featured, all, cats] = await Promise.all([
          getFeaturedProducts(),
          getPublishedProducts({ sortBy: 'newest' }),
          getAllCategories()
        ]);
        setFeaturedProducts(featured || []);
        setLatestProducts((all || []).slice(0, 8));
        setCategories((cats || []).filter(c => c.isActive));
      } catch (e) {
        console.error('Failed to load home page data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'clothing':
        return <Shirt className="w-5 h-5 text-emerald-800" />;
      case 'fashion':
        return <Sparkles className="w-5 h-5 text-emerald-800" />;
      case 'electronics':
        return <Tv className="w-5 h-5 text-emerald-800" />;
      case 'gadgets':
        return <Headphones className="w-5 h-5 text-emerald-800" />;
      case 'beauty':
        return <Heart className="w-5 h-5 text-emerald-800" />;
      case 'home-living':
        return <Home className="w-5 h-5 text-emerald-800" />;
      case 'accessories':
        return <Watch className="w-5 h-5 text-emerald-800" />;
      default:
        return <Package className="w-5 h-5 text-emerald-800" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Showcase Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div className="relative min-h-[380px] md:min-h-[460px] flex items-center">
          {/* Background Media with Measured Scrim */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroBanner}
              alt="Sellora Bangladesh Marketplace"
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-slate-950/80 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'যাচাইকৃত দেশীয় উদ্যোক্তাদের মার্কেটপ্লেস' : 'Verified Local Bangladeshi Merchants'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              {t('heroTitle')}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('products')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {t('shopNow')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => onNavigate('seller-apply')}
              >
                {t('sellOnSellora')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Horizontal Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('categoriesTitle')}
          </h2>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate('products', `category:${cat.slug}`)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-700 hover:shadow-xs transition-all text-center gap-2 group cursor-pointer"
            >
              <div className="p-3 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                {getCategoryIcon(cat.slug)}
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 line-clamp-1">
                {isBn ? cat.nameBn : cat.nameEn}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Featured Products (Real Admin Flagged Only) */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t('featuredProductsTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn ? 'আমাদের টিম কর্তৃক যাচাইকৃত ও সুপারিশকৃত বিশেষ পণ্য' : 'Handpicked recommendations verified by Sellora'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(id) => onNavigate('product-detail', id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Latest Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('latestProductsTitle')}
          </h2>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <Loader text={t('loading')} />
        ) : latestProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">{t('noProductsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(id) => onNavigate('product-detail', id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
