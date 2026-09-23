import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintStatus, AuthorityTier } from '../types';
import { uploadEvidence } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  MessageSquare,
  Camera,
  Share2,
  Filter,
  Search,
  ChevronRight,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Star,
  ArrowLeft,
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const {
    complaints,
    updateComplaintStatus,
    forwardComplaint,
    verifyComplaint,
    rejectComplaint,
    simulateAutoEscalation,
    user,
    setSelectedComplaintId,
    setCurrentPage,
    language,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'forwarded' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [actionComplaint, setActionComplaint] = useState<Complaint | null>(null);

  // Form states for the Action Drawer/Modal
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('in_progress');
  const [forwardTarget, setForwardTarget] = useState<AuthorityTier>('Mukhiya');
  const [forwardReason, setForwardReason] = useState('Requires higher department fund sanction & tender approval.');
  const [officialRemark, setOfficialRemark] = useState('');
  const [proofImage, setProofImage] = useState('/src/assets/images/street_light_proof_1790113405855.jpg');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isForwardingMode, setIsForwardingMode] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Stats
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'pending').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const forwarded = complaints.filter((c) => c.status === 'forwarded').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const overdue = complaints.filter((c) => c.daysLeft <= 0 && c.status !== 'resolved').length;

  const filtered = complaints.filter((c) => {
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.submittedBy.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenAction = (c: Complaint) => {
    setActionComplaint(c);
    setSelectedStatus(c.status === 'pending' ? 'in_progress' : c.status);
    setOfficialRemark('');
    setProofFile(null);
    setProofImage('');
    setIsForwardingMode(false);
  };

  const handleApplyStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionComplaint) return;
    setIsApplying(true);
    try {
      let proofUrl: string | undefined;
      if (selectedStatus === 'resolved') {
        if (!proofFile) {
          setSuccessToast('Resolution proof photo is mandatory before marking Resolved.');
          setIsApplying(false);
          return;
        }
        proofUrl = await uploadEvidence(proofFile, user.id);
      }
      await updateComplaintStatus(
        actionComplaint.id,
        selectedStatus,
        undefined,
        officialRemark || `Status set to ${selectedStatus.replace('_', ' ')} by ${user.name}`,
        proofUrl
      );
      setSuccessToast(`Complaint ${actionComplaint.id} updated successfully.`);
      setActionComplaint(null);
    } catch (err) {
      setSuccessToast((err as Error)?.message || 'Failed to update complaint status.');
    } finally {
      setIsApplying(false);
      setTimeout(() => setSuccessToast(''), 3500);
    }
  };

  const handleApplyForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionComplaint) return;
    setIsApplying(true);
    try {
      await forwardComplaint(actionComplaint.id, forwardTarget, forwardReason);
      setSuccessToast(`Complaint ${actionComplaint.id} escalated to ${forwardTarget}.`);
      setActionComplaint(null);
    } catch (err) {
      setSuccessToast((err as Error)?.message || 'Failed to forward complaint.');
    } finally {
      setIsApplying(false);
      setTimeout(() => setSuccessToast(''), 3500);
    }
  };

  const handleVerify = async (c: Complaint) => {
    try {
      await verifyComplaint(c.id, 'Complaint verified and accepted for processing.');
      setSuccessToast(`Complaint ${c.id} verified and accepted.`);
    } catch (err) {
      setSuccessToast((err as Error)?.message || 'Failed to verify complaint.');
    }
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleReject = async (c: Complaint) => {
    try {
      await rejectComplaint(c.id, 'Complaint rejected: insufficient information / outside jurisdiction.');
      setSuccessToast(`Complaint ${c.id} rejected.`);
    } catch (err) {
      setSuccessToast((err as Error)?.message || 'Failed to reject complaint.');
    }
    setTimeout(() => setSuccessToast(''), 3500);
  };

  if (user.role === 'citizen') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              {language === 'hi' ? 'गोपनीय प्रशासनिक सुरक्षा' : 'Restricted Administrative Access'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-3">
              {language === 'hi' ? 'केवल अधिकृत अधिकारियों हेतु सुरक्षित' : 'Authorized Officials Only'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              {language === 'hi'
                ? 'अधिकारी नियंत्रण कक्ष केवल पंजीकृत प्रशासक और अधिकृत अधिकारियों के लिए है। कृपया अपने अधिकारिक खाते से लॉगिन करें।'
                : 'The officer console is restricted to the registered Administrator and verified officials. Please sign in with your official account.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className="btn btn-primary w-full"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('track')}
              className="btn btn-light w-full"
            >
              {language === 'hi' ? 'नागरिक ट्रैकिंग' : 'Citizen Tracking'}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentPage('landing')}
              className="text-slate-600 hover:text-slate-900 text-xs cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'होम पेज पर लौटें' : 'Back to Home'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Role Switcher */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/60 border border-emerald-500/40 rounded-full text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {user.role === 'admin'
                  ? 'Central Grievance Administration Console (केंद्रीय शिकायत प्रशासन कंसोल)'
                  : 'Government Officer Resolution Console'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {user.role === 'admin'
                ? 'Central Grievance Administration'
                : t.authorityPortalTitle}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Logged in as: <strong className="text-emerald-300 font-bold">{user.name}</strong>{' '}
              {user.role === 'admin' ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase ml-1">
                  Administrator
                </span>
              ) : (
                `(${user.role.replace('_', ' ').toUpperCase()})`
              )}{' '}
              · Jurisdiction:{' '}
              {user.role === 'admin'
                ? 'All Districts (State-wide)'
                : user.designation
                ? user.designation
                : user.panchayat
                ? `${user.panchayat}, ${user.district}`
                : 'Assigned Complaints Only'}
            </p>
          </div>
        </div>

        {/* 6 Dashboard Cards: Total, New, Pending, In Progress, Overdue, Resolved */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{total}</span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">New Received</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{pending}</span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pending Action</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{pending + forwarded}</span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">In Progress</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{inProgress}</span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Overdue Escalated</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{overdue}</span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Resolved</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">{resolved}</span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-700" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Complaint Management Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Village Grievance Register & Action Queue
            </h2>
            <p className="text-xs text-slate-500">
              Manage field allocations, status updates, escalation forwarding, and photographic resolution proofs
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search citizen, ID, or title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
            />
          </div>
        </div>

        {/* Table Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'pending', 'in_progress', 'forwarded', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="p-3">ID</th>
                <th className="p-3">Citizen</th>
                <th className="p-3">Category</th>
                <th className="p-3">Current Authority</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Feedback</th>
                <th className="p-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-950">
                    <button
                      onClick={() => {
                        setSelectedComplaintId(c.id);
                        setCurrentPage('details');
                      }}
                      className="hover:underline text-emerald-800"
                    >
                      {c.id}
                    </button>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">{c.submittedBy.name}</p>
                    <p className="text-[10px] text-slate-500">{c.location.ward}, {c.location.village}</p>
                  </td>
                  <td className="p-3 capitalize text-slate-700">
                    {t[`cat_${c.category}` as keyof typeof t] || c.category}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {c.currentAuthority}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {c.dueDate}
                    {c.daysLeft <= 0 && c.status !== 'resolved' && (
                      <span className="text-[10px] text-red-600 font-bold block">Overdue!</span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">
                    {c.feedback ? (
                      <div className="text-[11px] space-y-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3 h-3 ${
                                n <= c.feedback!.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {c.feedback.resolvedStatus === 'yes'
                            ? 'Solved'
                            : c.feedback.resolvedStatus === 'partially'
                            ? 'Partially solved'
                            : 'Not solved'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {user.role === 'admin' && c.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerify(c)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleOpenAction(c)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take Action</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authority Action Modal / Drawer */}
      {actionComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                  Officer Action Desk · {actionComplaint.id}
                </span>
                <h3 className="text-base font-bold tracking-tight">
                  {actionComplaint.title}
                </h3>
              </div>
              <button
                onClick={() => setActionComplaint(null)}
                className="p-1 rounded-full hover:bg-emerald-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Toggle Mode: Update Status vs Forward to Higher Tier */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsForwardingMode(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    !isForwardingMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />{t.btnUpdateStatus} & Remarks
                </button>
                <button
                  type="button"
                  onClick={() => setIsForwardingMode(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    isForwardingMode ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />{t.btnForward}
                </button>
              </div>

              {!isForwardingMode ? (
                /* Mode 1: Status Update & Proof */
                <form onSubmit={handleApplyStatusUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      1. Select New Status:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['pending', 'in_progress', 'resolved', 'rejected'] as ComplaintStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatus(st)}
                          className={`p-2.5 rounded-xl border text-center capitalize font-bold transition-all cursor-pointer ${
                            selectedStatus === st
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      2. Add Official Remark (दफ्तर टिप्पणी):
                    </label>
                    <textarea
                      rows={3}
                      value={officialRemark}
                      onChange={(e) => setOfficialRemark(e.target.value)}
                      placeholder="e.g. Electrician team dispatched to Ward 5 with replacement luminary and wire spool..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none leading-relaxed"
                    />
                  </div>

                  {/* Resolution Proof Photo (If marking as resolved) */}
                  {selectedStatus === 'resolved' && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <Camera className="w-4 h-4 text-emerald-700" />
                        <span>Upload Resolution Proof (अनिवार्य प्रमाण फोटो)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        A resolution proof photo is mandatory before a complaint can be marked <strong>Resolved</strong>.
                        The photo is stored with the complaint and shown to the citizen.
                      </p>

                      <div className="flex items-center gap-3">
                        {proofImage ? (
                          <img
                            src={proofImage}
                            alt="Proof preview"
                            className="w-20 h-20 rounded-xl object-cover border border-emerald-300"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                            <Camera className="w-6 h-6" />
                          </div>
                        )}
                        <div className="space-y-1.5 flex-1">
                          <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-900 cursor-pointer transition-colors">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{proofFile ? 'Change proof photo' : 'Select proof photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setProofFile(f);
                                  setProofImage(URL.createObjectURL(f));
                                }
                              }}
                            />
                          </label>
                          {proofFile && (
                            <p className="text-[10px] font-semibold text-emerald-900">{proofFile.name}</p>
                          )}
                          {!proofFile && (
                            <p className="text-[10px] font-bold text-red-600">
                              Photo required — action will be blocked without it.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionComplaint(null)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isApplying || (selectedStatus === 'resolved' && !proofFile)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isApplying ? 'Saving...' : 'Save & Update Status'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode 2: Forward to Higher Tier */
                <form onSubmit={handleApplyForward} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      Select Higher Administrative Tier:
                    </label>
                    <select
                      value={forwardTarget}
                      onChange={(e) => setForwardTarget(e.target.value as AuthorityTier)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    >
                      <option value="Mukhiya">Mukhiya (Tier 2 - Panchayat Head)</option>
                      <option value="Block Officer">Block Officer / BDO (Tier 3)</option>
                      <option value="DM / District Authority">District Magistrate / DM (Tier 4 - Collectorate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      Escalation Reason & Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={forwardReason}
                      onChange={(e) => setForwardReason(e.target.value)}
                      placeholder="Specify why this file is forwarded (e.g. estimated expenditure exceeds local limits, inter-department coordination needed)..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none leading-relaxed"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Forwarding this will automatically log an escalation event in the Citizen's Live Timeline and send an alert notification.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActionComplaint(null)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isApplying ? 'Forwarding...' : `Forward File to ${forwardTarget}`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
