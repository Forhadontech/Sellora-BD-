import React, { useState } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { isValidBDPhone } from '../utils/validation';
import { Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onNavigate: (route: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onNavigate,
}) => {
  const { t, isBn } = useLanguage();
  const { login, register, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setShowConfigGuide(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      onNavigate('home');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowConfigGuide(false);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg(t('fieldRequired'));
        return;
      }
      setLoading(true);
      try {
        await login(email.trim(), password);
        onNavigate('home');
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.code === 'auth/operation-not-allowed') {
          setShowConfigGuide(true);
          setErrorMsg(isBn
            ? 'ফায়ারবেস কনসোলে Email/Password সাইন-ইন চালু করা নেই। অনুগ্রহ করে উপরের বাটন দিয়ে গুগল লগইন ব্যবহার করুন।'
            : 'Email/Password sign-in is not enabled in Firebase Console. Please use the Google sign-in button above.');
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setErrorMsg(isBn ? 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' : 'Invalid email or password.');
        } else {
          setErrorMsg(err.message || 'Login failed.');
        }
      } finally {
        setLoading(false);
      }
    } else if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg(t('fieldRequired') + ` (${t('fullName')})`);
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg(t('fieldRequired'));
        return;
      }
      if (password.length < 6) {
        setErrorMsg(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
        return;
      }
      if (phone.trim() && !isValidBDPhone(phone)) {
        setErrorMsg(t('validBDPhoneRequired'));
        return;
      }
      setLoading(true);
      try {
        await register(email.trim(), password, name.trim(), phone.trim());
        onNavigate('home');
      } catch (err: any) {
        console.error('Register error:', err);
        if (err.code === 'auth/operation-not-allowed') {
          setShowConfigGuide(true);
          setErrorMsg(isBn
            ? 'ফায়ারবেস কনসোলে Email/Password সাইন-ইন চালু করা নেই। অনুগ্রহ করে উপরের বাটন দিয়ে গুগল লগইন ব্যবহার করুন।'
            : 'Email/Password registration is not enabled in Firebase Console. Please use Google sign-in above.');
        } else if (err.code === 'auth/email-already-in-use') {
          setErrorMsg(isBn ? 'এই ইমেইলটি ইতিপূর্বে ব্যবহৃত হয়েছে।' : 'Email is already in use.');
        } else {
          setErrorMsg(err.message || 'Registration failed.');
        }
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg(t('fieldRequired'));
        return;
      }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg(isBn ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।' : 'Password reset link sent to your email.');
      } catch (err: any) {
        console.error('Forgot password error:', err);
        setErrorMsg(err.message || 'Failed to send reset email.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-900">
            SELLORA
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === 'login' && (isBn ? 'লগইন করুন' : 'Sign in to Sellora')}
            {mode === 'register' && (isBn ? 'নতুন একাউন্ট তৈরি করুন' : 'Create an Account')}
            {mode === 'forgot' && (isBn ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password')}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login' && (isBn ? 'আপনার বিশ্বস্ত মার্কেটপ্লেসে ফিরে আসুন' : 'Welcome back to your marketplace')}
            {mode === 'register' && (isBn ? 'গ্রাহক হিসেবে কেনাকাটা শুরু করুন' : 'Join thousands of shoppers in Bangladesh')}
            {mode === 'forgot' && (isBn ? 'আপনার একাউন্টের ইমেইল ঠিকানা দিন' : 'Enter your registered email address')}
          </p>
        </div>

        {/* Google Instant Sign-In Button */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('continueWithGoogle')}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                {t('orContinueWithEmail')}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              label={t('fullName')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Forhad Ahmed"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {mode === 'register' && (
            <Input
              label={t('phone')}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              leftIcon={<Phone className="w-4 h-4" />}
              helperText={isBn ? 'ঐচ্ছিক, সঠিক ১১ ডিজিট' : 'Optional, valid 11-digit BD number'}
            />
          )}

          {mode !== 'forgot' && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('forgot');
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showConfigGuide && (
            <div className="p-3.5 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{t('emailPasswordNotEnabledTitle')}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {t('emailPasswordNotEnabledDesc')}
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full mt-1 py-1.5 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('continueWithGoogle')}
              </button>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            {mode === 'login' && t('login')}
            {mode === 'register' && t('register')}
            {mode === 'forgot' && (isBn ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
          </Button>
        </form>

        {/* Footer Switcher */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === 'login' && (
            <p>
              {isBn ? 'একাউন্ট নেই? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('register');
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                {t('register')}
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              {isBn ? 'ইতিমধ্যে একাউন্ট আছে? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('login');
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                {t('login')}
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode('login');
              }}
              className="font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              {isBn ? 'লগইন পৃষ্ঠায় ফিরে যান' : 'Back to Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
