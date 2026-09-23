import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FilePlus,
  Search,
  Clock,
  Bell,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const CitizenDashboard: React.FC = () => {
  const {
    user,
    complaints,
    setCurrentPage,
    setSelectedComplaintId,
    language,
    t,
  } = useApp();

  const citizenComplaints = complaints;

  const totalCount = citizenComplaints.length;
  const pendingCount = citizenComplaints.filter((c) => c.status === 'pending' || c.status === 'forwarded').length;
  const inProgressCount = citizenComplaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = citizenComplaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Government Welcome Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/60 border border-emerald-600/40 rounded-full text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Rural Citizen Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {language === 'hi' ? `स्वागत है, ${user.name}` : `Welcome, ${user.name}`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {language === 'hi'
              ? 'ग्राम स्वराज पोर्टल पर आपकी पंचायत की सभी शिकायतों का वास्तविक समय रिकॉर्ड और अधिकारी आवंटन।'
              : 'Direct civic dashboard monitoring real-time authority action, 7-day statutory SLAs, and photo proofs.'}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.village} ({user.ward})</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{user.panchayat}, {user.district}</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="shrink-0">
          <button
            onClick={() => setCurrentPage('submit')}
            className="btn btn-primary w-full sm:w-auto shadow-md"
          >
            <FilePlus className="w-4 h-4" />
            <span>{t.btnSubmitComplaint}</span>
          </button>
        </div>
      </div>

      {/* 4 Quantitative KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.statTotal}
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 mt-2 tabular-nums">
            {totalCount}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in jurisdiction</span>
        </div>

        {/* Pending */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t.statPending}
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-900 mt-2 tabular-nums">
            {pendingCount}
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Awaiting officer action</span>
        </div>

        {/* In Progress */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t.statInProgress}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-900 mt-2 tabular-nums">
            {inProgressCount}
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Field repair dispatched</span>
        </div>

        {/* Resolved */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {t.statResolved}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-emerald-900 mt-2 tabular-nums">
            {resolvedCount}
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">With verified photo proof</span>
        </div>
      </div>

      {/* Main Grid: Recent Complaints + Quick Services */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Grievances (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {t.recentComplaints}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live official register with designated authority tier & statutory SLA deadline
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('my_complaints')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {citizenComplaints.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedComplaintId(c.id);
                  setCurrentPage('details');
                }}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t[`cat_${c.category}` as keyof typeof t] || c.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {c.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Custodian: <strong className="text-slate-800">{c.currentAuthority}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Due: <strong className="text-emerald-900 font-mono">{c.dueDate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {c.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === 'hi' ? 'समस्या हल' : 'Problem Solved'}
                      </span>
                    )}
                    <StatusBadge status={c.status} />
                  </div>
                  <button className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    {t.viewDetails}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Citizen Services (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {t.quickActions}
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => setCurrentPage('submit')}
                className="w-full p-3.5 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FilePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.btnSubmitComplaint}</p>
                    <p className="text-[11px] text-slate-500">Roads, lights, drinking water</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentPage('track')}
                className="w-full p-3.5 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.btnTrackComplaint}</p>
                    <p className="text-[11px] text-slate-500">Live SLA status & authority</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentPage('my_complaints')}
                className="w-full p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.navMyComplaints}</p>
                    <p className="text-[11px] text-slate-500">Official slips & records</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentPage('feedback_help')}
                className="w-full p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.navHelp}</p>
                    <p className="text-[11px] text-slate-500">24x7 Helpline & FAQs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
