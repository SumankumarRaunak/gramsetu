import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, Lock, Mail, Phone, MapPin, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { setCurrentPage, register, language, t } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    village: '',
    panchayat: '',
    block: '',
    ward: '',
    district: '',
    password: '',
    confirmPassword: '',
    terms: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.village) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!formData.terms) {
      setError('Please accept Terms & Conditions.');
      return;
    }

    setError('');
    setIsRegistering(true);
    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        village: formData.village,
        ward: formData.ward || '',
        panchayat: formData.panchayat,
        block: formData.block,
        district: formData.district,
        password: formData.password,
      });
      setSuccess(true);
      setNeedsEmailConfirm(result.needsEmailConfirm);
      if (!result.needsEmailConfirm) {
        setTimeout(() => setCurrentPage('dashboard'), 1200);
      }
    } catch (err) {
      setError((err as Error)?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Side: Smart Village Illustration / Banner */}
        <div className="lg:col-span-5 relative bg-emerald-950 text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
          <img
            src="/src/assets/images/smart_village_hero_1790113390546.jpg"
            alt="Smart Village Bihar"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-emerald-900/50" />

          {/* Brand & Top Lockup */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 border border-emerald-600/40 rounded-full text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Bihar Gram Swaraj Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {language === 'hi'
                ? 'आपकी आवाज आपके गाँव को बेहतर बना सकती है।'
                : 'Your Voice Can Make Your Village Better.'}
            </h2>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Register your citizen account to report water, road, lighting, and sanitation grievances directly to Panchayat & District administration.
            </p>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 space-y-3 pt-6 border-t border-emerald-800/60">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct 7-day action with automated escalation</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SMS & Online real-time progress tracking</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified photo proof upon resolution</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {language === 'hi' ? 'नागरिक खाता बनाएं' : 'Create Your Citizen Account'}
            </h1>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'गाँव की समस्याओं की रिपोर्ट करने और उनके समाधान को ट्रैक करने के लिए पंजीकरण करें।'
                : 'Register to report village problems and track their resolution.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {needsEmailConfirm
                  ? 'Account created! A verification email has been sent. Please confirm your email, then login.'
                  : 'Account created successfully! Redirecting to Citizen Dashboard...'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  placeholder="e.g. Aarav Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (मोबाइल) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none font-mono"
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Email Address (ईमेल)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Village (गाँव) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="Village name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ward (वार्ड)
                </label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="Ward No. 01"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Panchayat (पंचायत) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.panchayat}
                  onChange={(e) => setFormData({ ...formData, panchayat: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="Panchayat name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Block (प्रखंड) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="Block name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  District (ज़िला) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="e.g. Madhubani"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (पासवर्ड) *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password (पासवर्ड दोबारा) *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600">
                I agree to the Bihar Gram Swaraj Grievance Terms & Conditions and certify local residency.
              </label>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="btn btn-primary w-full text-sm shadow-md"
            >
              <span>{isRegistering ? 'Creating account...' : language === 'hi' ? 'खाता बनाएं' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => setCurrentPage('login')}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
