import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import VocabularyPage from './pages/VocabularyPage';
import LearnPage from './pages/LearnPage';
import ReviewPage from './pages/ReviewPage';
import WordDetailPage from './pages/WordDetailPage';
import WordbookPage from './pages/WordbookPage';
import DashboardPage from './pages/DashboardPage';
import ToolsPage from './pages/ToolsPage';
import SettingsPage from './pages/SettingsPage';
import ListeningPage from './pages/ListeningPage';
import ListeningPracticePage from './pages/ListeningPracticePage';
import PodcastListeningPage from './pages/PodcastListeningPage';
import PodcastPracticePage from './pages/PodcastPracticePage';
import ArticleListPage from './pages/ArticleListPage';
import ArticleReadPage from './pages/ArticleReadPage';
import PronunciationPage from './pages/PronunciationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import BeginnersGuidePage from './pages/BeginnersGuidePage';
import AccountManagementPage from './pages/AccountManagementPage';
import FAQPage from './pages/FAQPage';
import EditProfilePage from './pages/EditProfilePage';
import SecurityPage from './pages/SecurityPage';
import SyncPage from './pages/SyncPage';
import PreferencesPage from './pages/PreferencesPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SupportPage from './pages/SupportPage';
import { stopPageMedia } from './hooks/useStopMediaOnUnmount';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16 text-gray-500">
        正在校验登录状态...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    return () => {
      stopPageMedia();
    };
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash, navigationType]);

  return (
    <div className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/guide" element={<BeginnersGuidePage />} />
        <Route path="/help/account" element={<AccountManagementPage />} />
        <Route path="/help/account/profile" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
        <Route path="/help/account/security" element={<RequireAuth><SecurityPage /></RequireAuth>} />
        <Route path="/help/account/sync" element={<RequireAuth><SyncPage /></RequireAuth>} />
        <Route path="/help/account/preferences" element={<RequireAuth><PreferencesPage /></RequireAuth>} />
        <Route path="/help/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/vocabulary" element={<RequireAuth><VocabularyPage /></RequireAuth>} />
        <Route path="/vocabulary/learn" element={<RequireAuth><LearnPage /></RequireAuth>} />
        <Route path="/vocabulary/review" element={<RequireAuth><ReviewPage /></RequireAuth>} />
        <Route path="/vocabulary/wordbook" element={<RequireAuth><WordbookPage /></RequireAuth>} />
        <Route path="/word/:word" element={<RequireAuth><WordDetailPage /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/tools" element={<RequireAuth><ToolsPage /></RequireAuth>} />
        <Route path="/listening" element={<RequireAuth><ListeningPage /></RequireAuth>} />
        <Route path="/pronunciation" element={<PronunciationPage />} />
        <Route path="/listening/podcasts" element={<RequireAuth><PodcastListeningPage /></RequireAuth>} />
        <Route path="/listening/podcasts/:episodeId" element={<RequireAuth><PodcastPracticePage /></RequireAuth>} />
        <Route path="/listening/:id" element={<RequireAuth><ListeningPracticePage /></RequireAuth>} />
        <Route path="/reading" element={<RequireAuth><ArticleListPage /></RequireAuth>} />
        <Route path="/reading/:id" element={<RequireAuth><ArticleReadPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col relative transition-colors duration-500">
          <div className="apple-bg-container transition-colors duration-500">
            <div className="bg-blob bg-blob-1" />
            <div className="bg-blob bg-blob-2" />
            <div className="bg-blob bg-blob-3" />
            <div className="bg-blob bg-blob-4" />
          </div>
          <div className="site-scale-shell">
            <Navbar />
            <main className="flex-1 relative z-10">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
