import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import logoImage from '../assets/images/logo.jpg';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setCurrentPage, login, signInWithGoogle, language, t } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessToast('');
    setIsSubmitting(true);
    try {
      await login(identifier, password);
      setSuccessToast(language === 'hi' ? 'सफलतापूर्वक लॉगिन हुआ! प्रवेश हो रहा है...' : 'Signed in successfully! Opening your dashboard...');
    } catch (err) {
      setErrorMsg((err as Error)?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessToast('');
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg((err as Error)?.message || 'Unable to sign in with Google. Please try again.');
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-10 space-y-6">
        {/* Government Civic Seal & Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-700/30 bg-emerald-950 flex items-center justify-center mx-auto shadow-sm">
            <img
              src={logoImage}
              alt="GramSetu Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {language === 'hi' ? 'ग्राम सेतु लॉगिन पोर्टल' : 'GramSetu Portal Login'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'अपने पंजीकृत खाते से साइन इन करें'
              : 'Sign in to your registered account'}
          </p>
        </div>

        {/* Success Alert */}
        {successToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'पंजीकृत ईमेल' : 'Registered Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none font-mono"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full text-sm shadow-md"
          >
            <span>{isSubmitting ? (language === 'hi' ? 'प्रवेश हो रहा है...' : 'Signing in...') : t.btnLogin}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleSubmitting || isSubmitting}
          className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#4285F4]">G</span>
          {isGoogleSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        {/* Register Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {language === 'hi' ? 'नया नागरिक खाता बनाना चाहते हैं?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setCurrentPage('register')}
              className="text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              {t.btnRegister}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
