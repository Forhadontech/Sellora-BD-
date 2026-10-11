import React from 'react';
import {
  Home,
  ShoppingBag,
  Store,
  ShieldCheck,
  User
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const { t, isBn } = useLanguage();
  const { currentUser, isAdmin, isSeller, isFirstAdminEmail } = useAuth();

  const showAdmin = Boolean(isAdmin || isFirstAdminEmail);

  const handleSellerClick = () => {
    if (isSeller) {
      onNavigate('seller-dashboard');
    } else {
      onNavigate('seller-apply');
    }
  };

  const handleAccountClick = () => {
    if (currentUser) {
      onNavigate('account');
    } else {
      onNavigate('login');
    }
  };

  const navItems = [
    {
      id: 'home',
      shortLabel: isBn ? 'হোম' : 'Home',
      fullLabel: isBn ? 'হোম' : 'Home',
      icon: Home,
      isActive: currentRoute === 'home',
      onClick: () => onNavigate('home')
    },
    {
      id: 'products',
      shortLabel: isBn ? 'পণ্য' : 'Products',
      fullLabel: isBn ? 'পণ্যসমূহ' : 'Products',
      icon: ShoppingBag,
      isActive: currentRoute === 'products' || currentRoute === 'product-detail',
      onClick: () => onNavigate('products')
    },
    {
      id: 'seller',
      shortLabel: isBn ? 'সেলার' : 'Seller',
      fullLabel: isBn ? 'সেলার ড্যাশবোর্ড' : 'Seller Dashboard',
      icon: Store,
      isActive: currentRoute === 'seller-dashboard' || currentRoute === 'seller-apply',
      badge: isSeller ? (isBn ? 'সেলার' : 'Pro') : null,
      onClick: handleSellerClick
    },
    ...(showAdmin
      ? [
          {
            id: 'admin',
            shortLabel: isBn ? 'এডমিন' : 'Admin',
            fullLabel: isBn ? 'এডমিন প্যানেল' : 'Admin Panel',
            icon: ShieldCheck,
            isActive: currentRoute === 'admin',
            badge: isBn ? 'এডমিন' : 'Admin',
            onClick: () => onNavigate('admin')
          }
        ]
      : []),
    {
      id: 'account',
      shortLabel: isBn ? 'একাউন্ট' : 'Account',
      fullLabel: isBn ? 'আমার একাউন্ট' : 'My Account',
      icon: User,
      isActive: currentRoute === 'account' || currentRoute === 'login' || currentRoute === 'register',
      onClick: handleAccountClick
    }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none transition-all"
    >
      <div className="max-w-md mx-auto px-2 sm:max-w-xl md:max-w-2xl">
        <div className={`grid ${showAdmin ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center h-full py-1.5 px-1 transition-all duration-200 cursor-pointer group ${
                  active
                    ? 'text-emerald-800 font-bold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {active && (
                  <span className="absolute top-0 w-8 h-1 bg-emerald-600 rounded-b-full shadow-xs animate-in fade-in zoom-in-75 duration-200" />
                )}

                {/* Icon Container with Badge */}
                <div className="relative flex items-center justify-center mb-0.5">
                  <div
                    className={`p-1 rounded-xl transition-colors duration-200 ${
                      active
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'group-hover:bg-slate-100 text-slate-500 group-hover:text-slate-800'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px] group-hover:scale-105'
                      }`}
                    />
                  </div>

                  {/* Role or Status Badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-full leading-tight shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Text Label */}
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight tracking-tight text-center truncate max-w-full transition-all duration-150 ${
                    active ? 'text-emerald-900 font-bold' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.fullLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
