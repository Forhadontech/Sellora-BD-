import React, { useState, useEffect } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { Product, Category } from '../types';
import { getPublishedProducts } from '../services/productService';
import { getAllCategories } from '../services/adminService';
import { ProductCard } from '../components/product/ProductCard';
import { Loader } from '../components/common/Loader';
import { Button } from '../components/common/Button';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { formatBDT } from '../utils/formatters';

interface ProductsPageProps {
  onNavigate: (route: string, param?: string) => void;
  initialSearch?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onNavigate, initialSearch = '' }) => {
  const { t, isBn } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>(() => {
    if (initialSearch.startsWith('category:')) return '';
    return initialSearch;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (initialSearch.startsWith('category:')) {
      return initialSearch.replace('category:', '');
    }
    return 'all';
  });
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchCats = async () => {
      const cats = await getAllCategories();
      setCategories(cats || []);
    };
    fetchCats();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getPublishedProducts({
        categorySlug: selectedCategory,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        inStockOnly,
        search,
        sortBy
      });
      setProducts(res || []);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, inStockOnly, sortBy]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
    setMobileFilterOpen(false);
  };

  const handleResetFilter = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSearch('');
    setSortBy('newest');
  };

  const filterSidebar = (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('categories')}
        </label>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-50 text-emerald-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                selectedCategory === c.slug
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isBn ? c.nameBn : c.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('priceRange')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t('minPrice')}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
            className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder={t('maxPrice')}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
            className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* In-Stock Toggle */}
      <div className="pt-3 border-t border-slate-200">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
          />
          <span>{t('onlyInStock')}</span>
        </label>
      </div>

      <div className="pt-4 flex items-center gap-2">
        <Button size="sm" variant="primary" className="w-full" onClick={loadProducts}>
          {t('apply')}
        </Button>
        <Button size="sm" variant="ghost" className="text-slate-500" onClick={handleResetFilter}>
          {t('clear')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Sort Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('products')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn ? `মোট ${products.length}টি পণ্য প্রদর্শিত হচ্ছে` : `Showing ${products.length} products`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Button */}
          <Button
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setMobileFilterOpen(true)}
            icon={<SlidersHorizontal className="w-4 h-4" />}
          >
            {t('filter')}
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0 hidden sm:inline">
              {t('sortBy')}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="priceAsc">{t('sortPriceLowHigh')}</option>
              <option value="priceDesc">{t('sortPriceHighLow')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-white p-5 rounded-xl border border-slate-200 sticky top-20">
          {filterSidebar}
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <Loader text={t('loading')} />
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
              <p className="text-base font-semibold text-slate-700">
                {t('noProductsFound')}
              </p>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'আপনার ফিল্টারের মান পরিবর্তন করে আবার অনুসন্ধান করুন।'
                  : 'Try adjusting your search or filter keywords.'}
              </p>
              <Button size="sm" variant="outline" onClick={handleResetFilter}>
                {t('clear')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={(id) => onNavigate('product-detail', id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Sheet Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs lg:hidden">
          <div className="w-80 max-w-full bg-white h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  {t('filter')}
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterSidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
