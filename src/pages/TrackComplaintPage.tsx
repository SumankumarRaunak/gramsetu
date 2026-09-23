import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ComplaintStatus } from '../types';
import { trackComplaintPublic } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface TimelineRowPublic {
  status: string;
  remarks: string;
  changed_by: string;
  created_at: string;
  photo_url?: string;
}

interface PublicTrackResult {
  complaint_id: string;
  category?: string;
  title?: string;
  description?: string;
  status?: string;
  village?: string;
  ward?: string;
  landmark?: string;
  current_authority?: string;
  current_authority_designation?: string;
  created_at?: string;
  resolved_at?: string | null;
  timeline?: TimelineRowPublic[];
}

const dbToUiStatus = (db: string | undefined): ComplaintStatus => {
  const S = (db || '').toUpperCase();
  if (S === 'RESOLVED' || S === 'CLOSED') return 'resolved';
  if (S === 'REJECTED') return 'rejected';
  if (S === 'FORWARDED' || S === 'ASSIGNED') return 'forwarded';
  if (S === 'IN_PROGRESS') return 'in_progress';
  return 'pending';
};

export const TrackComplaintPage: React.FC = () => {
  const { complaints, setSelectedComplaintId, setCurrentPage, language, t } = useApp();

  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<PublicTrackResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setIsSearching(true);
    setSearched(true);
    setNotFound(false);
    setResult(null);
    try {
      const data = await trackComplaintPublic(searchId.trim());
      setResult(data as PublicTrackResult | null);
      if (!data) setNotFound(true);
    } catch {
      setResult(null);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const status = result ? dbToUiStatus(result.status) : 'pending';
  const dueDate = result?.created_at
    ? new Date(new Date(result.created_at).getTime() + 7 * 86400000).toISOString().slice(0, 10)
    : '';
  const createdDate = result?.created_at ? result.created_at.slice(0, 10) : '';
  const knownLocally = result ? complaints.find((c) => c.id === result.complaint_id) : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Real-time Public Grievance Tracking Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.trackPageHeading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {t.trackPageSub}
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CID2026/09/00001"
              className="w-full pl-12 pr-28 py-3 text-sm border border-slate-300 rounded-2xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-primary absolute right-2 top-2 shadow-xs disabled:opacity-60"
            >
              {isSearching ? 'Searching...' : t.btnSearch}
            </button>
          </div>
        </form>
      </div>

      {/* Search Result Card */}
      {searched && result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {result.complaint_id}
                </span>
                {result.category && (
                  <span className="text-xs font-semibold text-slate-500 capitalize">{result.category}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {result.title}
              </h3>
            </div>

            <div>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* 3 Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t.currentAuthority}
              </span>
              <p className="text-sm font-extrabold text-emerald-950 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{result.current_authority || 'Not yet assigned'}</span>
              </p>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                {result.current_authority_designation || 'Assigned custodian'}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t.dueDate}
              </span>
              <p className="text-sm font-extrabold text-emerald-950 mt-1 flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>{dueDate || '—'}</span>
              </p>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                7-Day Statutory SLA
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Location
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {result.ward || ''} {result.village ? `, ${result.village}` : ''}
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {result.landmark || '—'}
              </span>
            </div>
          </div>

          {/* Public Timeline */}
          {result.timeline && result.timeline.length > 0 ? (
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Public Resolution Timeline ({result.timeline.length} events)
              </h4>
              <div className="space-y-2.5">
                {result.timeline.map((ev, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 capitalize flex flex-wrap items-center gap-2">
                        <span>{ev.status.replace(/_/g, ' ')}</span>
                        {ev.status === 'RESOLVED' || ev.status === 'CLOSED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'hi' ? 'समस्या हल' : 'Problem Solved'}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-slate-600">
                        {ev.remarks} · <span className="font-mono text-[10px] text-slate-400">{ev.created_at.slice(0, 16).replace('T', ' ')}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">by {ev.changed_by}</p>
                      {ev.photo_url && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                          <p className="text-[10px] font-bold text-emerald-900 mb-1">
                            {language === 'hi' ? 'समाधान प्रमाण' : 'Verified Resolution Proof'}:
                          </p>
                          <img
                            src={ev.photo_url}
                            alt="Resolution proof"
                            className="w-32 h-20 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-5">
              Submitted on {createdDate || '—'}. No status events recorded yet.
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                if (knownLocally) {
                  setSelectedComplaintId(knownLocally.id);
                  setCurrentPage('details');
                }
              }}
              disabled={!knownLocally}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{knownLocally ? t.btnViewTimeline : 'Login to view full timeline'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {searched && !isSearching && !result && (
        <div className={`bg-white rounded-3xl p-8 border text-center space-y-3 ${notFound ? 'border-slate-200' : ''}`}>
          {notFound ? (
            <>
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                {t.trackNoFound}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please verify the ID on your acknowledgement receipt slip.
              </p>
            </>
          ) : (
            <Loader2 className="w-8 h-8 text-emerald-600 mx-auto animate-spin" />
          )}
        </div>
      )}
    </div>
  );
};