import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import heroImage from '../assets/images/smart_village_hero.jpg';
import { trackComplaintPublic } from '../lib/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  Check,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Phone,
  Mail,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    setCurrentPage,
    complaints,
    setSelectedComplaintId,
    simulateAutoEscalation,
    user,
    t,
    language,
  } = useApp();

  const [heroTrackInput, setHeroTrackInput] = useState('');
  const [heroTrackResult, setHeroTrackResult] = useState<string | null>(null);
  const [heroTrackPublic, setHeroTrackPublic] = useState<Record<string, unknown> | null>(null);

  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const pendingCount = complaints.filter((c) => c.status === 'pending' || c.status === 'forwarded').length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved');

  const handleHeroTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroTrackInput.trim();
    if (!query) return;
    const found = complaints.find(
      (c) => c.id.toLowerCase() === query.toLowerCase()
    );
    if (found) {
      setHeroTrackResult(found.id);
      setHeroTrackPublic(null);
      return;
    }
    try {
      const data = await trackComplaintPublic(query);
      if (data) {
        setHeroTrackPublic(data);
        setHeroTrackResult(query);
      } else {
        setHeroTrackResult('NOT_FOUND');
        setHeroTrackPublic(null);
      }
    } catch {
      setHeroTrackResult('NOT_FOUND');
      setHeroTrackPublic(null);
    }
  };

  const trackedComplaint = complaints.find((c) => c.id === heroTrackResult);

  return (
    <div className="space-y-16 pb-20 bg-slate-50">
      {/* 1. EXECUTIVE CIVIC HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle Rural Bihar Panorama Backdrop with Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Rural Bihar Smart Village"
            className="w-full h-full object-cover opacity-20 filter contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-emerald-950/70" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          {/* Top Statutory Trust Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'hi'
                  ? 'बिहार लोक शिकायत निवारण अधिकार अधिनियम (7-दिवसीय वैधानिक समय-सीमा)'
                  : 'Bihar Public Grievance Redressal Act · 7-Day Officer SLA Guarantee'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Madhubani District, Bihar</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">7-Day SLA · Photo Proof Mandate</span>
            </div>
          </div>

          {/* Main Headline & Narrative */}
          <div className="max-w-4xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-bold text-emerald-300">
              <span>{language === 'hi' ? 'स्मार्ट विलेज शिकायत प्रबंधन पोर्टल' : 'Smart Village Grievance Management Portal'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight text-balance">
              {language === 'hi' ? (
                <>
                  स्मार्ट विलेज{' '}
                  <span className="text-emerald-400">शिकायत प्रबंधन पोर्टल</span>
                </>
              ) : (
                <>
                  Smart Village{' '}
                  <span className="text-emerald-400">Grievance Management Portal</span>
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {language === 'hi'
                ? 'गाँव की समस्या (सड़क, स्ट्रीट लाइट, नल-जल, नाली) सीधे ऑनलाइन दर्ज करें। पारदर्शी ट्रैकिंग, 7-दिवसीय वैधानिक समय-सीमा और संबंधित अधिकारियों द्वारा त्वरित निस्तारण।'
                : 'Submit rural infrastructure grievances online with real-time tracking, 7-day officer SLA escalation, and direct oversight by the district grievance cell.'}
            </p>
          </div>

          {/* 3 CORE PILLARS REQUESTED BY USER: Citizen Complaint, Track, and Admin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
            {/* 1. CITIZEN COMPLAINT */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 border-2 border-emerald-500 shadow-2xl flex flex-col justify-between space-y-4 hover:translate-y-[-2px] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
                    <FileText className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Citizen
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950">
                    {language === 'hi' ? 'सिटीजन कंप्लेंट' : 'Citizen Complaint'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'hi' ? 'गाँव की समस्या दर्ज करें' : 'Submit Village Grievance'}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'hi'
                    ? 'सड़क, नाली, स्ट्रीट लाइट, नल-जल अथवा कचरा समस्या की फोटो व विवरण के साथ शिकायत दर्ज करें।'
                    : 'Report broken streetlights, water supply failure, road damage, or drain blocks with photo proof.'}
                </p>
              </div>

              <button
                onClick={() => setCurrentPage('submit')}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'hi' ? 'कंप्लेंट दर्ज करें (Submit)' : 'Submit Complaint'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. TRACK */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-700/50 hover:translate-y-[-2px] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shadow-xs">
                    <Search className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Track
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950">
                    {language === 'hi' ? 'ट्रैक (Track Status)' : 'Track Complaint'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'hi' ? 'शिकायत की स्थिति जांचें' : 'Check Custodian Officer & SLA'}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'hi'
                    ? 'अपनी शिकायत ID डालकर पता करें कि शिकायत अभी किस अधिकारी के पास है और कब तक समाधान होगा।'
                    : 'Enter Complaint ID to track current officer custody, 7-day deadline countdown, and full timeline.'}
                </p>
              </div>

              <button
                onClick={() => setCurrentPage('track')}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>{language === 'hi' ? 'स्थिति ट्रैक करें (Track)' : 'Track Status'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3. ADMIN */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/40 shadow-xl flex flex-col justify-between space-y-4 hover:translate-y-[-2px] transition-all relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded shadow-xs">
                    Admin
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>{language === 'hi' ? 'ऑफिसर / एडमिन पोर्टल' : 'Officer / Admin Portal'}</span>
                  </h3>
                  <p className="text-xs text-emerald-300 font-semibold">
                    {language === 'hi'
                      ? 'पंजीकृत अधिकारियों एवं प्रशासक हेतु'
                      : 'For registered officials and the Administrator'}
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'अधिकारी कंसोल: प्रशासक एवं अधिकृत अधिकारी सभी शिकायतें देख सकते हैं, स्थिति अद्यतन कर सकते हैं और उच्च स्तर पर अग्रेषित कर सकते हैं।'
                    : 'Officer console: the Administrator and verified officials review all complaints, update status, forward files, and close resolved cases.'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (user.role === 'admin' || user.role === 'dm_authority' || user.role === 'block_officer' || user.role === 'mukhiya' || user.role === 'panchayat_officer') {
                    setCurrentPage('authority_dashboard');
                  } else {
                    setCurrentPage('login');
                  }
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{language === 'hi' ? 'ऑफिसर कंसोल (लॉगिन आवश्यक)' : 'Officer Console (Login Required)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search Bar Below 3 Primary Cards */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 text-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'त्वरित शिकायत ट्रैकर' : 'Quick Instant Case Search'}</span>
              </span>
              <span className="text-[11px] text-slate-300">
                {language === 'hi' ? 'शिकायत क्रमांक यहाँ दर्ज करके सीधा विवरण देखें' : 'Enter ID directly to view case record'}
              </span>
            </div>

            <form onSubmit={handleHeroTrack} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={heroTrackInput}
                  onChange={(e) => setHeroTrackInput(e.target.value)}
                  placeholder="Enter Complaint ID (e.g. CID2026/09/00001)"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-emerald-600 outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                {language === 'hi' ? 'सर्च करें' : 'Track Now'}
              </button>
            </form>

            {/* Instant Inline Result Card */}
            {heroTrackResult && trackedComplaint && (
              <div className="p-3.5 bg-white text-slate-900 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {trackedComplaint.id}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {trackedComplaint.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {trackedComplaint.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Current Officer: <strong className="text-slate-700">{trackedComplaint.currentAuthority}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComplaintId(trackedComplaint.id);
                    setCurrentPage('details');
                  }}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  View Details
                </button>
              </div>
            )}
            {heroTrackResult && heroTrackPublic && (
              <div className="p-3.5 bg-white text-slate-900 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-emerald-800">
                    {String(heroTrackPublic.complaint_id || heroTrackResult)}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {String(heroTrackPublic.title || '')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Status: <strong className="text-slate-700">{String(heroTrackPublic.status || '')}</strong> ·{' '}
                    {String(heroTrackPublic.current_authority || 'Not assigned')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage('track')}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1"
                >
                  Full Tracking
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {heroTrackResult === 'NOT_FOUND' && (
              <div className="p-3 bg-red-50 text-red-900 border border-red-300 rounded-xl text-xs font-semibold">
                No complaint found matching ID "{heroTrackInput}".
              </div>
            )}
          </div>

          {/* EMERGENCY HELPLINE & CITIZEN ASSISTANCE DESK */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-4 sm:p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Emergency Helpline</span>
                </div>
                <h4 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                  <span>S K Raunak</span>
                  <span className="text-xs font-normal text-emerald-300 bg-emerald-400/15 px-2 py-0.5 rounded border border-emerald-400/30">
                    SOCSE Department
                  </span>
                </h4>
                <p className="text-xs text-slate-300 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    SOCSE Department, Sandip University, Sijoul · Madhubani, Bihar 847235
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                <a
                  href="tel:9142946979"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-mono">Call: 9142946979</span>
                </a>

                <a
                  href="mailto:suman914294@gmail.com"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">suman914294@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quantitative Performance Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
                {totalCount}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {language === 'hi' ? 'कुल पंजीकृत शिकायतें' : 'Complaints Registered'}
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tabular-nums">
                {resolvedCount}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {language === 'hi' ? 'सफलतापूर्वक निस्तारित' : 'Verified Resolved'}
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tabular-nums">
                7 Days
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {language === 'hi' ? 'अधिकतम सांविधिक समय' : 'Statutory Escalation Clock'}
              </span>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 tabular-nums">
                100%
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {language === 'hi' ? 'फोटो साक्ष्य के साथ' : 'Photo Proof Mandate'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE CORE 4-TIER STATUTORY ESCALATION ROADMAP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block">
                Official Administrative Escalation Ladder
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {language === 'hi'
                  ? 'शिकायत निवारण का 4-स्तरीय पदानुक्रम'
                  : 'How Complaints Forward Across 4 Administrative Tiers'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                {language === 'hi'
                  ? 'नागरिक को हर समय पता रहता है कि शिकायत किस अधिकारी के पास है। 7 दिन में कार्रवाई न होने पर स्वतः अग्रेषित होती है।'
                  : 'Transparent accountability ensuring complaints cannot be stalled. If an authority does not act within 7 days, the platform automatically escalates the file.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="text-xs font-bold text-slate-700">Strict 7-Day SLA Enforcement</span>
            </div>
          </div>

          {/* The 5-Step Connected Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Node 1: Citizen */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'नागरिक (Citizen)' : 'Citizen Filing'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Registers grievance online with photo proof and receives immediate Tracking ID & SMS token.
              </p>
              <div className="pt-1 text-[10px] font-mono text-slate-500">
                Token: ID-2026-XXXX
              </div>
            </div>

            {/* Node 2: Gram Panchayat Officer */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-300 text-left space-y-2 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="text-xs font-bold text-emerald-950">
                {language === 'hi' ? 'पंचायत पदाधिकारी' : 'Panchayat Officer'}
              </h4>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Tier 1 intake. Custodian officer required to inspect on-site and resolve or record remarks.
              </p>
              <div className="pt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                7 Days Action Window
              </div>
            </div>

            {/* Node 3: Mukhiya */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'मुखिया (Panchayat Head)' : 'Mukhiya (Tier 2)'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Auto-forwarded if Panchayat Officer fails to act. Can sanction local village 15th Finance funds.
              </p>
              <div className="pt-1 text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                Auto-Escalation Rule
              </div>
            </div>

            {/* Node 4: Block Officer (BDO) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'प्रखंड पदाधिकारी (BDO)' : 'Block Officer / BDO'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Inter-departmental approval for major repairs, electricity transformers, or school health issues.
              </p>
              <div className="pt-1 text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                Higher Sanction
              </div>
            </div>

            {/* Node 5: DM / Collectorate */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                05
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'जिला पदाधिकारी (DM)' : 'DM / Collectorate'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Apex district review. Issues administrative compliance directions and enforces verified resolution.
              </p>
              <div className="pt-1 text-[10px] font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                Final Enforcement
              </div>
            </div>
          </div>

          {/* Interactive Simulation Strip */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Clock className="w-4 h-4" />
                <span>Test the 7-Day Auto-Escalation Engine</span>
              </div>
              <p className="text-xs text-slate-300">
                Experience how a real complaint auto-escalates in the live timeline when officer deadline expires.
              </p>
            </div>

            <button
              onClick={() => {
                const firstId = complaints[0]?.id;
                if (firstId) {
                  setSelectedComplaintId(firstId);
                  setCurrentPage('details');
                } else {
                  setCurrentPage('track');
                }
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>
                {complaints.length
                  ? `Test Live Case (${complaints[0].id})`
                  : 'Open Complaint Tracking'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. THREE CORE PILLARS (Report, Track, Resolve) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block">
            Pillars of Redressal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transparent Governance In 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Designed for rural citizens with bilingual clarity, minimal text input, and zero administrative confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Report */}
          <div
            onClick={() => setCurrentPage('submit')}
            className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                1. Report Grievance
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select from 10 civic categories (road damage, street light, drinking water, drainage, sanitation). Upload photo evidence directly from your mobile.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Submit Grievance Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Track */}
          <div
            onClick={() => setCurrentPage('track')}
            className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                2. Live SLA Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check exactly which officer has custody of your file right now. View statutory days remaining and audit-stamped official officer notes.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Track Complaint</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Resolve */}
          <div
            onClick={() => setCurrentPage('my_complaints')}
            className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                3. Verified Resolution
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Officers cannot close a complaint without uploading verified photographic proof of the repaired facility. Rate your satisfaction in 1 click.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>View Resolved Cases</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFIED RESOLUTIONS (live from registry) */}
      {resolvedComplaints.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Evidence-Based Accountability
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Verified Resolutions with Photographic Proof
                </h3>
              </div>
              <span className="text-xs text-slate-500">Live from the grievance registry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resolvedComplaints.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.id}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                      {language === 'hi' ? 'समस्या हल' : 'Problem Solved'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                  {c.resolutionProofUrl && (
                    <img
                      src={c.resolutionProofUrl}
                      alt="Resolution proof"
                      className="w-full h-44 rounded-xl object-cover border border-slate-200"
                    />
                  )}
                  {c.resolutionRemarks && (
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {c.resolutionRemarks}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaintId(c.id);
                      setCurrentPage('details');
                    }}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    View full record <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
