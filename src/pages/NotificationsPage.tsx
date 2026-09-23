import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCheck,
  Mail,
  Zap,
  RotateCcw,
  BadgeCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedComplaintId,
    setCurrentPage,
    language,
    t,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'received':
        return <Mail className="w-5 h-5 text-emerald-700" />;
      case 'forwarded':
        return <Zap className="w-5 h-5 text-emerald-700" />;
      case 'status_updated':
        return <RotateCcw className="w-5 h-5 text-emerald-700" />;
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-700" />;
      case 'verification_pending':
        return <BadgeCheck className="w-5 h-5 text-sky-600" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'closed':
        return <Lock className="w-5 h-5 text-emerald-700" />;
      case 'feedback_required':
        return <Sparkles className="w-5 h-5 text-emerald-700" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.notificationsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'hi'
              ? 'आपकी शिकायतों के अग्रेषण, अधिकारी आवंटन एवं निस्तारण की आधिकारिक सूचनाएं'
              : 'Official real-time alerts regarding escalation, status updates, and resolutions'}
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllNotificationsRead}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t.btnMarkAllRead}</span>
          </button>
        )}
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl divide-y divide-slate-100 overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">No notifications in this view.</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                setSelectedComplaintId(notif.complaintId);
                setCurrentPage('details');
              }}
              className={`p-5 transition-colors cursor-pointer flex items-start justify-between gap-4 hover:bg-slate-50 ${
                notif.read ? 'bg-white' : 'bg-emerald-50/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      {language === 'hi' ? notif.titleHi : notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {language === 'hi' ? notif.messageHi : notif.message}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                      {notif.complaintId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{notif.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <span className="hidden sm:inline">Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
