import React, { useState } from 'react';
import { useApp, PageId } from '../context/AppContext';
import {
  Bell,
  User,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Languages,
  Menu,
  X,
  FileText,
  Search,
  LayoutDashboard,
  HelpCircle,
  Clock,
  ArrowRight,
  Building2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    language,
    setLanguage,
    user,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedComplaintId,
    logout,
    isAuthenticated,
    t,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNavClick = (page: PageId) => {
    setCurrentPage(page);
    setShowMobileMenu(false);
  };

  const navLinks: { label: string; page: PageId; icon: React.ReactNode }[] = [
    { label: t.navHome, page: 'landing', icon: <FileText className="w-4 h-4" /> },
    { label: t.navDashboard, page: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t.navSubmit, page: 'submit', icon: <FileText className="w-4 h-4" /> },
    { label: t.navTrack, page: 'track', icon: <Search className="w-4 h-4" /> },
    { label: t.navMyComplaints, page: 'my_complaints', icon: <Clock className="w-4 h-4" /> },
    { label: t.navHelp, page: 'feedback_help', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      {/* Top subtle government emblem indicator banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-200">
              Government of Bihar · Panchayati Raj Department (बिहार सरकार - पंचायती राज विभाग)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[10px]">
            <span>Right to Public Grievance Redressal</span>
            <span aria-hidden="true">·</span>
            <a href="tel:9142946979" className="text-emerald-300 hover:text-emerald-200 font-mono font-bold transition-colors">
              इमरजेंसी हेल्पलाइन: 9142946979
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Brand element with civic seal */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-3 text-left group focus-visible:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-800/30 shadow-xs bg-emerald-950 flex items-center justify-center shrink-0">
                <img
                  src="/src/assets/images/bihar_civic_crest_1790114318514.jpg"
                  alt="GramSwaraj Civic Crest"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-emerald-800 transition-colors">
                    Smart Village
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 tracking-tight leading-tight mt-0.5">
                  {language === 'hi' ? 'शिकायत प्रबंधन पोर्टल' : 'Complaint Management Portal'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Refined Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Language toggle, Authority console, Notifications, Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Segmented Control */}
            <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-white text-emerald-950 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Officer Console */}
            {user.role !== 'citizen' && (
              <button
                onClick={() => handleNavClick('authority_dashboard')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  currentPage === 'authority_dashboard'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-emerald-900 border-emerald-700/40 hover:bg-emerald-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.navAuthorityPortal}</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-red-600 rounded-full tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold tracking-wide">
                        {t.notificationsTitle} ({unreadCount})
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
                      >
                        {t.btnMarkAllRead}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setSelectedComplaintId(notif.complaintId);
                            setCurrentPage('details');
                            setShowNotifications(false);
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                            notif.read ? 'bg-white' : 'bg-emerald-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                            <span>{language === 'hi' ? notif.titleHi : notif.title}</span>
                            <span className="text-[10px] font-normal text-slate-400 font-mono tabular-nums">
                              {notif.timestamp.split(',')[0]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {language === 'hi' ? notif.messageHi : notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => {
                        setCurrentPage('notifications');
                        setShowNotifications(false);
                      }}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Notifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Quick Menu */}
{isAuthenticated ? (
              <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[105px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {user.role === 'citizen' ? 'Citizen' : user.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 text-[10px] inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{user.village}, {user.district}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.navProfile}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage('my_complaints');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.navMyComplaints}</span>
                  </button>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      {t.btnLogout}
                    </button>
                  </div>
                </div>
              )}
            </div>
            ) : (
            <button
              onClick={() => {
                setCurrentPage('login');
                setShowMobileMenu(false);
              }}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navLinks.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left ${
                currentPage === item.page ? 'bg-emerald-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {isAuthenticated ? (
            <button
              onClick={() => handleNavClick('authority_dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left bg-emerald-800 text-white mt-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{t.navAuthorityPortal} (Officer Console)</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('login')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-left bg-emerald-800 text-white mt-2"
            >
              <User className="w-4 h-4" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
