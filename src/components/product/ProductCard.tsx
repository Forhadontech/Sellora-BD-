import React, { useState } from 'react';
import { Product } from '../../types';
import { formatBDT } from '../../utils/formatters';
import { useLanguage } from '../../locales/LanguageContext';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { isBn, t } = useLanguage();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const mainImage = product.images?.[0] || '';
  const productName = isBn ? (product.nameBn || product.nameEn) : product.nameEn;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const added = addToCart({
      productId: product.id,
      storeId: product.storeId,
      storeName: product.storeName || 'Store',
      nameEn: product.nameEn,
      nameBn: product.nameBn,
      price: product.price,
      imageUrl: mainImage,
      stock: product.stock,
    }, 1);

    if (added) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    }
  };

  return (
    <div
      onClick={() => onSelect(product.id)}
      className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* Product Image Slot */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={productName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-400">
            <span className="text-xs font-medium text-slate-500 text-center line-clamp-2">
              {productName}
            </span>
          </div>
        )}

        {/* Subtle Stock indicator if out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="text-xs font-bold text-white tracking-wider uppercase px-2.5 py-1 bg-black/60 rounded">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1">
          {/* Store / Merchant quiet metadata */}
          <div className="text-[11px] font-medium text-slate-500 truncate">
            {product.storeName || 'Sellora Merchant'}
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug">
            {productName}
          </h3>
        </div>

        {/* Pricing and Action row */}
        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-900 tabular-nums">
              {formatBDT(product.price, isBn)}
            </span>
            {product.previousPrice && product.previousPrice > product.price && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatBDT(product.previousPrice, isBn)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              addedAnimation
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={addedAnimation ? 'Added!' : t('addToCart')}
            aria-label={t('addToCart')}
          >
            {addedAnimation ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
