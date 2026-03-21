import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import PWAManager from './components/PWAManager';
import CallManager from './contexts/CallManager';
import BottomNav from './components/BottomNav';
import { useLocation } from 'react-router';
import { translationEngine } from './lib/translationEngine';

// Static imports for all pages
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import GroupChatPage from './pages/GroupChatPage';
import CallPage from './pages/CallPage';
import GroupCallPage from './pages/GroupCallPage';
import ContactsPage from './pages/ContactsPage';
import CallHistoryPage from './pages/CallHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import StitchDemoPage from './pages/StitchDemoPage';

const NavigationHandler = () => {
  const location = useLocation();
  const isChat = location.pathname.includes('/chat') || location.pathname.includes('/call') || location.pathname.includes('/group-call') || /^\/groups\/[^/]+$/.test(location.pathname);
  const isAuth = ['/', '/login', '/register', '/onboarding', '/profile-setup'].includes(location.pathname);
  const isDashboard = location.pathname === '/dashboard';

  if (isChat || isAuth || isDashboard) return null;
  return <BottomNav />;
};

function ErrorFallback({ error }) {
  return (
    <div style={{ color: 'white', padding: '40px', background: '#0D2137', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Algo deu errado:</h2>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(244,132,95,0.2)' }}>
        <pre style={{ color: '#F4845F', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{error.message}</pre>
        {error.stack && (
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', opacity: 0.6, fontSize: '12px' }}>Ver detalhes técnicos</summary>
            <pre style={{ fontSize: '10px', opacity: 0.5, marginTop: '10px', overflowX: 'auto' }}>{error.stack}</pre>
          </details>
        )}
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: '30px', padding: '12px 24px', background: '#0D7377', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
      >
        Tentar recarregar
      </button>
    </div>
  );
}

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  useEffect(() => {
    translationEngine.startBackgroundDownload();
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <CallManager>
          {/* ✅ Native App feel: Dynamic viewport height, organic background, text colors */}
          <div className="App transition-all duration-300 min-h-[100dvh] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col pb-[env(safe-area-inset-bottom)]">
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '10px',
                },
              }}
            />

            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<SignUpPage />} />
              <Route path="/signup" element={<Navigate to="/register" replace />} />
              <Route path="/stitch-demo" element={<StitchDemoPage />} />

              {/* Fluxo de integração/setup */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />

              {/* Rotas principais protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><StitchDemoPage /></ProtectedRoute>} />
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />

              <Route path="/messages" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
              <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
              <Route path="/groups/:id" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />


              <Route path="/call/:callId?" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
              <Route path="/call/video/:callId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
              <Route path="/call/voice/:callId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
              <Route path="/group-call/:groupId" element={<ProtectedRoute><GroupCallPage /></ProtectedRoute>} />

              <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><CallHistoryPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            <NavigationHandler />

            {/* PWA Manager */}
            <PWAManager />
          </div>
        </CallManager>
      </AuthProvider>
    </ErrorBoundary >
  );
};

export default App;
