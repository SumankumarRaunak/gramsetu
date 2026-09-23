import React from 'react';
import { AppProvider, useApp, PageId } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Lock } from 'lucide-react';

import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';
import { MyComplaintsPage } from './pages/MyComplaintsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FeedbackHelpPage } from './pages/FeedbackHelpPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';

const AUTH_PAGES: PageId[] = ['dashboard', 'submit', 'my_complaints', 'notifications', 'profile'];

const SignedOutGate: React.FC = () => {
  const { setCurrentPage, language } = useApp();

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-24">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'hi' ? 'लॉगिन करें' : 'Sign in to continue'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {language === 'hi'
              ? 'यह खंड केवल पंजीकृत नागरिकों के लिए है।'
              : 'This area is available to registered citizens of the community portal.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setCurrentPage('login')}
            className="btn btn-primary"
          >
            {language === 'hi' ? 'साइन इन' : 'Sign In'}
          </button>
          <button
            onClick={() => setCurrentPage('register')}
            className="btn btn-light"
          >
            {language === 'hi' ? 'खाता बनाएं' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentPage, user } = useApp();

  const renderCurrentPage = () => {
    if (AUTH_PAGES.includes(currentPage) && !user.id) {
      return <SignedOutGate />;
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'register':
        return <RegisterPage />;
      case 'login':
        return <LoginPage />;
      case 'dashboard':
        return <CitizenDashboard />;
      case 'submit':
        return <SubmitComplaintPage />;
      case 'track':
        return <TrackComplaintPage />;
      case 'details':
        return <ComplaintDetailsPage />;
      case 'my_complaints':
        return <MyComplaintsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'feedback_help':
        return <FeedbackHelpPage />;
      case 'authority_dashboard':
        return <AuthorityDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Header />
      <main className="flex-1 w-full">{renderCurrentPage()}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
