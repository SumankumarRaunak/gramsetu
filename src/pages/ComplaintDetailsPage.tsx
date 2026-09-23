import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Calendar,
  Printer,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Star,
  Check,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { StatusBadge } from '../components/StatusBadge';
import { ComplaintStatus } from '../types';

export const ComplaintDetailsPage: React.FC = () => {
  const {
    selectedComplaint,
    simulateAutoEscalation,
    setCurrentPage,
    language,
    t,
  } = useApp();

  const [showReceipt, setShowReceipt] = useState(false);
  const [escalating, setEscalating] = useState(false);

  if (!selectedComplaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No complaint selected</h2>
        <button
          onClick={() => setCurrentPage('my_complaints')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs"
        >
          Go to My Complaints
        </button>
      </div>
    );
  }

  const c = selectedComplaint;

  const handleSimulateEscalation = () => {
    setEscalating(true);
    setTimeout(() => {
      simulateAutoEscalation(c.id);
      setEscalating(false);
    }, 350);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {c.id}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {t[`cat_${c.category}` as keyof typeof t] || c.category}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs font-semibold text-emerald-800 capitalize">
                Priority: {c.priority}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {c.title}
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl pt-1">
              {c.description}
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <StatusBadge status={c.status} />
            <button
              onClick={() => setShowReceipt(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.btnDownloadReceipt}</span>
            </button>
          </div>
        </div>

        {/* 3 Prominent Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              {t.currentAuthority}
            </span>
            <p className="text-sm font-extrabold text-emerald-950 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{c.currentAuthority}</span>
            </p>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              Active custodian of file
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              {t.dueDate}
            </span>
            <p className="text-sm font-extrabold text-emerald-950 mt-1 flex items-center gap-1.5 font-mono">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{c.dueDate}</span>
            </p>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              {c.daysLeft > 0 ? `${c.daysLeft} days remaining for compliance` : 'SLA window completed'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Location & Citizen
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1 truncate">
              {c.location.village}, {c.location.ward}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Citizen: {c.submittedBy.name}
            </p>
          </div>
        </div>

        {/* 7-Day Auto-Escalation Rule & Simulator */}
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200/70 text-amber-900 shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                {language === 'hi' ? '7-दिवसीय स्वचालित अग्रेषण नियम' : '7-Day Statutory Non-Action Escalation Rule'}
              </h4>
              <p className="text-[11px] text-amber-900 leading-relaxed max-w-xl mt-0.5">
                {language === 'hi'
                  ? 'यदि 7 दिन में पंचायत पदाधिकारी कार्रवाई नहीं करते, तो पोर्टल इसे स्वतः मुखिया जी और फिर प्रखंड पदाधिकारी को अग्रेषित करता है।'
                  : 'If the assigned officer does not act within 7 days, the system automatically transfers the case to Mukhiya → Block Officer → DM.'}
              </p>
            </div>
          </div>

          {c.status !== 'resolved' && c.currentAuthority !== 'DM / District Authority' && (
            <button
              onClick={handleSimulateEscalation}
              disabled={escalating}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${escalating ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? '7-दिन समय सीमा समाप्त का परीक्षण करें' : 'Simulate 7-Day Expiry'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Status Timeline + Evidence/Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: The Comprehensive Status Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {t.timelineHeading}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'शिकायत का संपूर्ण निवारण सफर' : 'Real-time step-by-step progress journey'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Audit Trail
            </span>
          </div>

          {/* Timeline Visualizer */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {c.timeline.map((event, idx) => {
              const isResolved = event.status === 'resolved';
              const isEscalation = event.isEscalation;

              return (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isResolved
                        ? 'bg-emerald-700 border-emerald-200 text-white'
                        : isEscalation
                        ? 'bg-slate-700 border-slate-300 text-white'
                        : 'bg-white border-emerald-800 text-emerald-800'
                    }`}
                  >
                    {isResolved ? <Check className="w-3 h-3" /> : <span className="text-[10px]">{idx + 1}</span>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {language === 'hi' ? event.titleHi : event.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {event.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {language === 'hi' ? event.descriptionHi : event.description}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{event.actor}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{event.actorRole.replace('_', ' ')}</span>
                    </div>

                    {isEscalation && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <strong className="block text-[11px] uppercase font-bold text-amber-800">
                            Automatic Escalation Triggered
                          </strong>
                          <span>Reason: {event.escalationReason}</span>
                        </div>
                      </div>
                    )}

                    {event.proofImageUrl && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 inline-block">
                        <p className="text-[10px] font-bold text-emerald-900 mb-1">
                          Verified Resolution Proof:
                        </p>
                        <img
                          src={event.proofImageUrl}
                          alt="Proof in timeline"
                          className="w-32 h-20 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Evidence & Official Remarks (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Resolution Proof Card */}
          {c.resolutionProofUrl && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'समस्या हल हो गई — समाधान प्रमाण' : 'Problem Solved — Resolution Proof'}</span>
              </div>
              <img
                src={c.resolutionProofUrl}
                alt="Resolution proof"
                className="w-full h-48 rounded-2xl object-cover border border-emerald-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              {c.resolutionRemarks && (
                <p className="text-xs text-slate-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                  {c.resolutionRemarks}
                </p>
              )}
            </div>
          )}

          {/* Citizen Feedback Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'नागरिक फीडबैक' : 'Citizen Feedback'}</span>
            </div>
            {c.feedback ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-4 h-4 ${
                          n <= c.feedback!.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={[
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      c.feedback.resolvedStatus === 'yes'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : c.feedback.resolvedStatus === 'partially'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200',
                    ].join(' ')}
                  >
                    {c.feedback.resolvedStatus === 'yes'
                      ? language === 'hi'
                        ? 'समाधान संतोषजनक'
                        : 'Problem Solved'
                      : c.feedback.resolvedStatus === 'partially'
                      ? language === 'hi'
                        ? 'आंशिक समाधान'
                        : 'Partially Solved'
                      : language === 'hi'
                      ? 'समाधान नहीं'
                      : 'Not Solved'}
                  </span>
                </div>
                {c.feedback.comment && (
                  <p className="text-xs text-slate-700 bg-slate-50 rounded-xl border border-slate-200/70 p-3 leading-relaxed">
                    "{c.feedback.comment}"
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono">Submitted {c.feedback.submittedAt}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'इस शिकायत के लिए अभी कोई फीडबैक दर्ज नहीं हुआ।'
                  : 'No feedback has been submitted for this complaint yet.'}
              </p>
            )}
          </div>

          {/* Citizen Evidence Photo */}
          {c.evidenceImageUrl && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{t.evidenceTitle}</span>
                <span className="text-[10px] text-slate-400 font-normal">Original Upload</span>
              </div>
              <img
                src={c.evidenceImageUrl}
                alt="Citizen Evidence"
                className="w-full h-44 rounded-2xl object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>{c.location.landmark || `${c.location.village}, ${c.location.ward}`}</span>
              </p>
            </div>
          )}

          {/* Official Remarks Log */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>{t.officialRemarksTitle}</span>
            </div>

            <div className="space-y-2.5">
              {c.officialRemarks.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-800">{rem.author} ({rem.role})</span>
                    <span className="font-mono">{rem.timestamp}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">{rem.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slip Modal */}
      <ReceiptModal
        complaint={c}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};
