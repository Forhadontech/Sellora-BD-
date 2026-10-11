import React, { useState } from 'react';
import { useLanguage } from '../locales/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { isValidBDPhone } from '../utils/validation';
import {
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
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
      onNavigate('account');
    } catch (err: any) {
      console.warn('Google Sign-In note:', err?.message || err);
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
        setErrorMsg(isBn ? 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' : 'Please enter your email and password.');
        return;
      }
      setLoading(true);
      try {
        await login(email.trim(), password);
        onNavigate('home');
      } catch (err: any) {
        if (err?.code === 'auth/operation-not-allowed') {
          console.warn('Firebase Email/Password provider not enabled; prompting user for Google Sign-In.');
          setShowConfigGuide(true);
          setErrorMsg(isBn
            ? 'এই ফায়ারবেস ডেটাবেজে Email/Password সাইন-ইন এখনও চালু করা হয়নি। আপনি গুগল দিয়ে সরাসরি লগইন করতে পারেন।'
            : 'Email/Password sign-in is currently disabled in this Firebase project. You can sign in instantly with Google.');
        } else if (
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/wrong-password' ||
          err?.code === 'auth/invalid-email'
        ) {
          setErrorMsg(isBn ? 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' : 'Invalid email or password.');
        } else {
          console.warn('Login note:', err?.message || err);
          setErrorMsg(err?.message || (isBn ? 'লগইন ব্যর্থ হয়েছে।' : 'Login failed.'));
        }
      } finally {
        setLoading(false);
      }
    } else if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' : 'Please enter your full name.');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg(isBn ? 'ইমেইল এবং পাসওয়ার্ড আবশ্যক।' : 'Email and password are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
        return;
      }
      if (phone.trim() && !isValidBDPhone(phone)) {
        setErrorMsg(isBn ? 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please provide a valid 11-digit BD phone number.');
        return;
      }
      setLoading(true);
      try {
        await register(email.trim(), password, name.trim(), phone.trim());
        // Navigate to account page so user can edit profile immediately
        onNavigate('account');
      } catch (err: any) {
        console.warn('Registration note:', err?.code, err?.message);
        if (err?.code === 'auth/operation-not-allowed') {
          setShowConfigGuide(true);
          setErrorMsg(isBn
            ? 'ফায়ারবেসে Email/Password সক্রিয় নেই। নিচে "গুগল দিয়ে সাইন ইন" বাটনে ক্লিক করে এক ক্লিকে একাউন্ট খুলতে পারেন।'
            : 'Email/Password registration is disabled in Firebase. Please sign up instantly with Google below.');
        } else if (err?.code === 'auth/email-already-in-use') {
          setErrorMsg(isBn
            ? 'এই ইমেইলটি দিয়ে ইতিপূর্বে একাউন্ট তৈরি করা হয়েছে। আপনি সরাসরি "লগইন করুন" ট্যাবে গিয়ে লগইন করতে পারেন।'
            : 'This email is already registered. Please go to the Login tab to sign in.');
        } else if (err?.code === 'auth/invalid-email') {
          setErrorMsg(isBn ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।' : 'Please enter a valid email address.');
        } else if (err?.code === 'auth/weak-password') {
          setErrorMsg(isBn ? 'পাসওয়ার্ডটি খুব সহজ। কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।' : 'Password is too weak. Please use at least 6 characters.');
        } else if (err?.code === 'auth/network-request-failed') {
          setErrorMsg(isBn ? 'ইন্টারনেট সংযোগে ত্রুটি দেখা দিয়েছে। পুনরায় চেষ্টা করুন।' : 'Network connection error. Please try again.');
        } else {
          setErrorMsg(err?.message || (isBn ? 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।' : 'Registration could not be completed. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন।' : 'Please enter your registered email.');
        return;
      }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg(isBn ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।' : 'Password reset link sent to your email.');
      } catch (err: any) {
        if (err?.code === 'auth/operation-not-allowed') {
          setShowConfigGuide(true);
          setErrorMsg(isBn
            ? 'ইমেইল পরিষেবা সক্রিয় নেই। অনুগ্রহ করে গুগল লগইন ব্যবহার করুন।'
            : 'Email service is not enabled. Please use Google Sign-In.');
        } else {
          console.warn('Forgot password note:', err?.message || err);
          setErrorMsg(err?.message || (isBn ? 'রিসেট লিংক পাঠানো সম্ভব হয়নি।' : 'Failed to send reset email.'));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10 pb-20">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <span className="text-2xl font-black tracking-wider text-emerald-900 block">
            SELLORA
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {mode === 'login' && (isBn ? 'ইমেইল ও পাসওয়ার্ড দিয়ে লগইন' : 'Sign In with Email & Password')}
            {mode === 'register' && (isBn ? 'নতুন একাউন্ট রেজিস্ট্রেশন' : 'Register New Account')}
            {mode === 'forgot' && (isBn ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password')}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login' && (isBn ? 'আপনার ইমেইল ও পাসওয়ার্ড লিখে কন্টিনিউ করুন' : 'Enter your email and password to continue')}
            {mode === 'register' && (isBn ? 'নিচের তথ্য পূরণ করে একাউন্ট তৈরি করুন' : 'Fill in the details to create your account')}
            {mode === 'forgot' && (isBn ? 'আপনার একাউন্টের ইমেইল ঠিকানা লিখুন' : 'Enter your registered email address')}
          </p>
        </div>

        {/* Primary Form: Email + Password Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Input
              label={isBn ? 'পূর্ণ নাম' : 'Full Name'}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isBn ? 'যেমন: ফরহাদ আহমেদ' : 'e.g. Forhad Ahmed'}
              leftIcon={<User className="w-4 h-4" />}
              required
            />
          )}

          <Input
            label={isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {mode === 'register' && (
            <Input
              label={isBn ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              leftIcon={<Phone className="w-4 h-4" />}
              helperText={isBn ? 'ঐচ্ছিক, ডেলিভারির সুবিধার জন্য' : 'Optional, for delivery notifications'}
            />
          )}

          {mode !== 'forgot' && (
            <Input
              label={isBn ? 'পাসওয়ার্ড' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded focus:outline-none"
                  title={showPassword ? (isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (isBn ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-emerald-800" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              helperText={
                mode === 'register'
                  ? (isBn ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' : 'Minimum 6 characters')
                  : undefined
              }
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
            <div className="p-4 bg-amber-50/90 text-amber-950 text-xs rounded-xl border border-amber-300 shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900 border-b border-amber-200 pb-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{isBn ? 'ফায়ারবেসে Email/Password চালু করার নিয়ম' : 'Enable Email/Password in Firebase'}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {isBn
                  ? 'গুগল ফায়ারবেসের ডিফল্ট সিকিউরিটির কারণে প্রজেক্টে Email/Password অপশনটি ম্যানুয়ালি একবার চালু (Enable) করে নিতে হয়। নিচের ৩টি সহজ ধাপে এটি অন করুন:'
                  : 'Google Firebase requires Email/Password sign-in to be enabled in the project console. Follow these 3 easy steps:'}
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-950 font-medium">
                <li>
                  {isBn ? (
                    <>
                      নিচের বাটনে চাপ দিয়ে ফায়ারবেস কনসোলের <strong>Sign-in method</strong> পেজে যান।
                    </>
                  ) : (
                    <>Open the Firebase Console Sign-in method settings.</>
                  )}
                </li>
                <li>
                  {isBn ? (
                    <>
                      তালিকায় <strong>Email/Password</strong> প্রোভাইডারে ক্লিক করুন।
                    </>
                  ) : (
                    <>Click on the <strong>Email/Password</strong> provider.</>
                  )}
                </li>
                <li>
                  {isBn ? (
                    <>
                      <strong>Enable</strong> টগলটি অন করে <strong>Save</strong> বাটনে চাপ দিন।
                    </>
                  ) : (
                    <>Toggle <strong>Enable</strong> and click <strong>Save</strong>.</>
                  )}
                </li>
              </ol>

              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://console.firebase.google.com/project/master-idiom-9mn89/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-center text-xs transition-colors shadow-xs"
                >
                  {isBn ? '⚙️ ফায়ারবেস কনসোলে চালু করুন' : '⚙️ Open Firebase Console'}
                </a>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-center text-xs transition-colors shadow-xs"
                >
                  {isBn ? 'গুগল দিয়ে দ্রুত লগইন' : 'Sign in with Google'}
                </button>
              </div>
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
            {mode === 'login' && (isBn ? 'লগইন করুন / কন্টিনিউ' : 'Login / Continue')}
            {mode === 'register' && (isBn ? 'একাউন্ট তৈরি করুন' : 'Create Account / Continue')}
            {mode === 'forgot' && (isBn ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
          </Button>
        </form>

        {/* Alternative Google Sign-In */}
        {mode !== 'forgot' && (
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                {isBn ? 'অথবা বিকল্প পদ্ধতি' : 'Or alternative method'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-50 group"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isBn ? 'গুগল দিয়ে সরাসরি সাইন-ইন' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}

        {/* Footer Switcher */}
        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
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
                {isBn ? 'নতুন একাউন্ট রেজিস্ট্রেশন করুন' : 'Register New Account'}
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
                {isBn ? 'লগইন করুন' : 'Sign In'}
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
