import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setCurrentPage, login, language, t } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="min-h-[800px] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-10 space-y-6">
        {/* Government Civic Seal & Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-700/30 bg-emerald-950 flex items-center justify-center mx-auto shadow-sm">
            <img
              src="/src/assets/images/bihar_civic_crest_1790114318514.jpg"
              alt="GramSwaraj Civic Crest"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {language === 'hi' ? 'ग्राम स्वराज लॉगिन पोर्टल' : 'GramSwaraj Portal Login'}
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none font-mono"
                placeholder="••••••••"
                autoComplete="current-password"
              />
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