import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ComplaintStatus } from '../types';
import {
  Search,
  Filter,
  Calendar,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  FilePlus,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { StatusBadge } from '../components/StatusBadge';

export const MyComplaintsPage: React.FC = () => {
  const {
    complaints,
    setSelectedComplaintId,
    setCurrentPage,
    language,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | ComplaintStatus>('all');
  const [search, setSearch] = useState('');
  const [modalComplaintId, setModalComplaintId] = useState<string | null>(null);

  const tabs: { key: 'all' | ComplaintStatus; label: string }[] = [
    { key: 'all', label: t.tabAll },
    { key: 'pending', label: t.tabPending },
    { key: 'in_progress', label: t.tabInProgress },
    { key: 'forwarded', label: t.tabForwarded },
    { key: 'resolved', label: t.tabResolved },
    { key: 'rejected', label: t.tabRejected },
  ];

  const filteredComplaints = complaints.filter((c) => {
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.village.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedForSlip = complaints.find((c) => c.id === modalComplaintId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.myComplaintsHeading}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete archive of your village grievances, assigned officers, and statutory timelines
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('submit')}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          <span>{t.btnSubmitComplaint}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or title..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
          />
        </div>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No complaints found</p>
            <p className="text-xs text-slate-500">There are no grievances matching your current filter.</p>
          </div>
        ) : (
          filteredComplaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {t[`cat_${c.category}` as keyof typeof t] || c.category}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span><strong>{c.currentAuthority}</strong></span>
                  </span>
                  <span className="font-mono text-emerald-900">
                    Due: <strong>{c.dueDate}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  onClick={() => setModalComplaintId(c.id)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Slip</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedComplaintId(c.id);
                    setCurrentPage('details');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>{t.viewDetails}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slip Modal */}
      {selectedForSlip && (
        <ReceiptModal
          complaint={selectedForSlip}
          isOpen={!!modalComplaintId}
          onClose={() => setModalComplaintId(null)}
        />
      )}
    </div>
  );
};
