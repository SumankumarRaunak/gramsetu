import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { sampleFAQs } from '../data/initialData';
import {
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const FeedbackHelpPage: React.FC = () => {
  const {
    complaints,
    submitFeedback,
    language,
    t,
  } = useApp();

  // Find resolved complaints or default to the water supply one
  const resolvedList = complaints.filter((c) => c.status === 'resolved');
  const [selectedComplaintId, setSelectedComplaintId] = useState(
    resolvedList[0]?.id || ''
  );

  const [resolvedStatus, setResolvedStatus] = useState<'yes' | 'partially' | 'no'>('yes');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!selectedComplaintId || !complaints.some((c) => c.id === selectedComplaintId)) {
      if (complaints.length > 0) setSelectedComplaintId(complaints[0].id);
    }
  }, [complaints, selectedComplaintId]);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await submitFeedback(selectedComplaintId, rating, resolvedStatus, comment);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setComment('');
      }, 4000);
    } catch (err) {
      setSubmitError((err as Error)?.message || 'Failed to submit feedback.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* SECTION 1: Citizen Feedback Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-900 border border-emerald-200 mb-2">
            <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>Citizen Audit & Satisfaction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.feedbackTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.feedbackSub}
          </p>
        </div>

        {submittedSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-950">
              {language === 'hi' ? 'फीडबैक सफलतापूर्वक दर्ज हो गया!' : 'Thank you for your valuable feedback!'}
            </h3>
            <p className="text-xs text-emerald-800">
              Your evaluation has been logged directly into the District Panchayati Raj performance registry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {submitError}
              </div>
            )}

            {/* Select Complaint to review */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Select Complaint to Review:
              </label>
              <select
                value={selectedComplaintId}
                onChange={(e) => setSelectedComplaintId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.title} ({c.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Question 1: Was problem resolved? */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. {t.q1}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {(
                  [
                    ['yes', t.q1_yes, 'bg-emerald-600 border-emerald-300'],
                    ['partially', t.q1_partial, 'bg-amber-500 border-amber-300'],
                    ['no', t.q1_no, 'bg-rose-600 border-rose-300'],
                  ] as const
                ).map(([key, label, dot]) => {
                  const selected = resolvedStatus === key;
                  return (
                    <label
                      key={key}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        selected ? 'border-emerald-700 bg-emerald-50/80 font-bold text-emerald-950' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolvedStatus"
                        checked={selected}
                        onChange={() => setResolvedStatus(key)}
                        className="text-emerald-700 focus:ring-emerald-500"
                      />
                      <span className={`w-2 h-2 rounded-full ${dot.split(' ')[0]}`} />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Satisfaction Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                2. {t.q2}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-2xl cursor-pointer hover:scale-115 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating} of 5 Stars ({rating >= 4 ? 'Satisfied' : rating === 3 ? 'Average' : 'Needs improvement'})
                </span>
              </div>
            </div>

            {/* Question 3: Additional Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. {t.q3}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience with the officer, repair quality, and turnaround speed..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.btnSubmitFeedback}</span>
            </button>
          </form>
        )}
      </div>

      {/* SECTION 2: Frequently Asked Questions (FAQ) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.faqTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'शिकायत निवारण एवं स्वचालित अग्रेषण संबंधी आम सवाल'
                : 'Common queries regarding submission, tracking, and the 7-day escalation rule'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sampleFAQs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div key={faq.id} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                    {language === 'hi' ? faq.questionHi : faq.questionEn}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2.5 pl-1 animate-in fade-in">
                    {language === 'hi' ? faq.answerHi : faq.answerEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Official Help Directory & Contacts */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block">
            Official Rural Governance Assistance
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {t.helplineTitle}
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            For urgent community emergencies like transformer breakdown, water contamination, or flood drainage, reach out directly to government control rooms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-emerald-900/40 rounded-2xl border border-emerald-700/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Phone className="w-4 h-4" />
              <span>{language === 'hi' ? 'इमरजेंसी हेल्पलाइन (S K Raunak)' : 'Emergency Helpline'}</span>
            </div>
            <a href="tel:9142946979" className="text-xl font-mono font-bold text-white block hover:text-emerald-300 transition-colors">
              9142946979
            </a>
            <p className="text-[11px] text-emerald-200">S K Raunak (मुख्य हेल्पलाइन)</p>
          </div>

          <div className="p-4 bg-emerald-900/40 rounded-2xl border border-emerald-700/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Mail className="w-4 h-4" />
              <span>{language === 'hi' ? 'आधिकारिक ईमेल' : 'Official Support Email'}</span>
            </div>
            <a href="mailto:suman914294@gmail.com" className="text-xs font-mono font-bold text-white block truncate hover:text-emerald-300 transition-colors">
              suman914294@gmail.com
            </a>
            <p className="text-[11px] text-emerald-200">24x7 Support & Grievance</p>
          </div>

          <div className="p-4 bg-emerald-900/40 rounded-2xl border border-emerald-700/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <MapPin className="w-4 h-4" />
              <span>{language === 'hi' ? 'पता एवं जिला' : 'Office Location & District'}</span>
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              S K Raunak, SOCSE Department, Sandip University sijoul Madhubani Bihar 847235
            </p>
            <p className="text-[11px] text-emerald-200">District: Madhubani · PIN: 847235</p>
          </div>
        </div>
      </div>
    </div>
  );
};
