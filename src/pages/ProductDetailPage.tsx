import React, { useState, useEffect } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useCart } from '../context/CartContext';
import { Product, Store } from '../types';
import { getProductById } from '../services/productService';
import { getStoreById } from '../services/storeService';
import { formatBDT } from '../utils/formatters';
import { Loader } from '../components/common/Loader';
import { Button } from '../components/common/Button';
import {
  ShoppingBag,
  Store as StoreIcon,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  ChevronLeft
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
}) => {
  const { t, isBn } = useLanguage();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const prod = await getProductById(productId);
        setProduct(prod);
        if (prod?.storeId) {
          const s = await getStoreById(prod.storeId);
          setStore(s);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [productId]);

  if (loading) {
    return <Loader text={t('loading')} />;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{t('noProductsFound')}</h2>
        <Button variant="primary" onClick={() => onNavigate('products')}>
          {t('backToShopping')}
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const currentImages = product.images && product.images.length > 0
    ? product.images
    : [''];

  const productName = isBn ? (product.nameBn || product.nameEn) : product.nameEn;
  const productDesc = isBn ? (product.descriptionBn || product.descriptionEn) : product.descriptionEn;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const added = addToCart({
      productId: product.id,
      storeId: product.storeId,
      storeName: store?.storeName || product.storeName || 'Store',
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      price: product.price,
      imageUrl: currentImages[0] || '',
      stock: product.stock,
    }, quantity);

    if (added) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAddToCart();
    onNavigate('checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('products')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('backToShopping')}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {/* Main Display Image */}
          <div className="relative aspect-4/3 w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
            {currentImages[selectedImageIndex] ? (
              <img
                src={currentImages[selectedImageIndex]}
                alt={productName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No Image Available
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-emerald-800 ring-2 ring-emerald-800/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="space-y-6">
          {/* Store / Merchant Pill */}
          {store && (
            <button
              onClick={() => onNavigate('store', store.id)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors text-xs font-semibold cursor-pointer"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>{t('soldBy')}</span>
              <span className="underline">{store.storeName}</span>
            </button>
          )}

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {productName}
          </h1>

          {/* Price & Discounts */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-emerald-900 tabular-nums">
              {formatBDT(product.price, isBn)}
            </span>
            {product.previousPrice && product.previousPrice > product.price && (
              <span className="text-base text-slate-400 line-through tabular-nums">
                {formatBDT(product.previousPrice, isBn)}
              </span>
            )}
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isOutOfStock ? 'bg-red-500' : 'bg-emerald-600'
              }`}
            />
            <span className={isOutOfStock ? 'text-red-600' : 'text-emerald-800'}>
              {isOutOfStock
                ? t('outOfStock')
                : `${t('inStock')} (${t('stockLeft')} ${product.stock})`}
            </span>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isBn ? 'পরিমাণ' : 'Quantity'}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 text-slate-700" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold tabular-nums text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  {isBn ? `সর্বোচ্চ ${product.stock}টি গ্রহণযোগ্য` : `Max ${product.stock} available`}
                </span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1"
              icon={addedSuccess ? <Check className="w-5 h-5 text-emerald-700" /> : <ShoppingBag className="w-5 h-5" />}
            >
              {addedSuccess ? (isBn ? 'কার্টে যুক্ত হয়েছে!' : 'Added to Bag!') : t('addToCart')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="flex-1"
            >
              {t('buyNow')}
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {isBn ? 'পণ্যের বিবরণ' : 'Product Description'}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {productDesc}
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Truck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>{isBn ? 'সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি' : 'Nationwide tracked delivery'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>{isBn ? 'যাচাইকৃত পণ্য ও ক্যাশ অন ডেলিভারি সুবিধা' : 'Verified authentic product & COD available'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
