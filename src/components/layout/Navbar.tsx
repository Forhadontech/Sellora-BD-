import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Store as StoreIcon,
  Shield,
  Menu,
  X,
  Globe,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { t, language, setLanguage, isBn } = useLanguage();
  const { currentUser, userProfile, isAdmin, isSeller, isFirstAdminEmail, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('products', searchQuery.trim());
      setMobileMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner Notice (Slim & Trustworthy) */}
      <div className="bg-emerald-900 text-emerald-100 text-[11px] py-1 px-4 text-center font-medium">
        <span>{t('deliveryWithinBD')}</span>
        <span className="mx-2 text-emerald-400" aria-hidden="true">&bull;</span>
        <span>{t('codDescription')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold tracking-tight text-emerald-900 hover:text-emerald-950 transition-colors cursor-pointer select-none"
            >
              SELLORA
            </button>
          </div>

          {/* Search Bar (Center Hub) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </form>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onNavigate('products')}
              className={`hover:text-emerald-900 transition-colors whitespace-nowrap cursor-pointer ${
                currentRoute === 'products' ? 'text-emerald-900 font-bold' : ''
              }`}
            >
              {t('products')}
            </button>

            {isSeller ? (
              <button
                onClick={() => onNavigate('seller-dashboard')}
                className="hover:text-emerald-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 text-emerald-800 font-bold"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>{t('sellerDashboard')}</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('seller-apply')}
                className="hover:text-emerald-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                <StoreIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('sellOnSellora')}</span>
              </button>
            )}

            {(isAdmin || isFirstAdminEmail) && (
              <button
                onClick={() => onNavigate('admin')}
                className="hover:text-emerald-900 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-slate-800 font-bold"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('adminPanel')}</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions (Language, Cart, Auth) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Shopping Bag */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label={t('cart')}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-800 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Auth Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium"
                >
                  <UserIcon className="w-4 h-4 text-emerald-800" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {userProfile?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-xs">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">
                          {userProfile?.displayName}
                        </p>
                        <p className="text-slate-500 truncate">{currentUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('account');
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{t('myAccount')}</span>
                      </button>

                      {isSeller && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onNavigate('seller-dashboard');
                          }}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <StoreIcon className="w-3.5 h-3.5" />
                          <span>{t('sellerDashboard')}</span>
                        </button>
                      )}

                      {(isAdmin || isFirstAdminEmail) && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full text-left px-3 py-2 text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t('adminPanel')}</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                          onNavigate('home');
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {t('register')}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </form>

          <nav className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('home');
              }}
              className="text-left py-2 hover:text-emerald-800"
            >
              {t('home')}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('products');
              }}
              className="text-left py-2 hover:text-emerald-800"
            >
              {t('products')}
            </button>

            {isSeller ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('seller-dashboard');
                }}
                className="text-left py-2 text-emerald-800 font-semibold"
              >
                {t('sellerDashboard')}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('seller-apply');
                }}
                className="text-left py-2 hover:text-emerald-800"
              >
                {t('sellOnSellora')}
              </button>
            )}

            {(isAdmin || isFirstAdminEmail) && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('admin');
                }}
                className="text-left py-2 text-emerald-900 font-bold"
              >
                {t('adminPanel')}
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('account');
                }}
                className="text-left py-2 hover:text-emerald-800"
              >
                {t('myAccount')}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
