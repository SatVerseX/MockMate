import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingScreen } from './components/LandingScreen';
import { UserDashboard } from './components/UserDashboard';
import { SetupScreen } from './components/SetupScreen';
import { SystemCheckScreen } from './components/SystemCheckScreen';
import { InstructionsScreen } from './components/InstructionsScreen';
import { LiveSession } from './components/LiveSession';
import { ResultsScreen } from './components/ResultsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AuthScreen } from './components/AuthScreen';
import { GuidePage } from './components/GuidePage';
import { PricingScreen } from './components/PricingScreen';
import { InterviewConfig, AppSettings, DEFAULT_SETTINGS } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main App Content with Router
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  
  // Session state
  const [sessionConfig, setSessionConfig] = useState<InterviewConfig | null>(() => {
    const saved = sessionStorage.getItem('mockmate-session');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Interview session tracking
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [sessionTranscript, setSessionTranscript] = useState<any[]>([]); // simplified type for state
  
  // Persistent storage
  const [settings, setSettings] = useLocalStorage<AppSettings>('mockmate-settings', DEFAULT_SETTINGS);

  // Active Screen Share Stream
  const activeStreamRef = React.useRef<MediaStream | null>(null);

  // Save session config to sessionStorage
  useEffect(() => {
    if (sessionConfig) {
      sessionStorage.setItem('mockmate-session', JSON.stringify(sessionConfig));
    } else {
      sessionStorage.removeItem('mockmate-session');
    }
  }, [sessionConfig]);

  // Navigation handlers
  const handleStart = useCallback(() => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate, user]);

  const handleStartNewInterview = useCallback(() => {
    navigate('/setup');
  }, [navigate]);

  const handleSetupComplete = useCallback((config: InterviewConfig) => {
    setSessionConfig(config);
    navigate('/system-check');
  }, [navigate]);

  const handleSystemCheckComplete = useCallback(() => {
    navigate('/instructions');
  }, [navigate]);

  const handleInstructionsComplete = useCallback((stream: MediaStream) => {
    activeStreamRef.current = stream;
    navigate('/interview');
  }, [navigate]);

  const handleEndSession = useCallback((result?: any) => {
    if (result) {
      setInterviewDuration(result.duration || 0);
      setQuestionCount(result.questionsAsked || 0);
      setWarningCount(result.warningCount || 0);
      setSessionTranscript(result.transcript || []);
    }
    navigate('/results');
  }, [navigate]);

  const handleTryAgain = useCallback(() => {
    setInterviewDuration(0);
    setQuestionCount(0);
    setWarningCount(0);
    navigate('/setup');
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    // Reset session but go to dashboard
    setSessionConfig(null);
    setInterviewDuration(0);
    setQuestionCount(0);
    setWarningCount(0);
    setSessionTranscript([]);
    navigate('/dashboard');
  }, [navigate]);

  const handleViewHistory = useCallback(() => {
    navigate('/history');
  }, [navigate]);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Protected route check - redirect to setup if no config
  const requireConfig = (element: React.ReactElement) => {
    if (!sessionConfig) {
      return <SetupScreen onComplete={handleSetupComplete} onBack={() => navigate('/dashboard')} />;
    }
    return element;
  };

  return (
    <ErrorBoundary onReset={handleGoHome}>
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black transition-colors duration-300">
        <Routes>
          <Route 
            path="/" 
            element={
              <LandingScreen 
                onStart={handleStart}
                onViewHistory={handleViewHistory}
                onOpenSettings={handleOpenSettings}
              />
            } 
          />

          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthScreen onSuccess={() => navigate('/dashboard')} />
              )
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard 
                  onStartNew={handleStartNewInterview}
                  onViewHistory={handleViewHistory}
                  onOpenSettings={handleOpenSettings}
                />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/setup" 
            element={
              <SetupScreen 
                onComplete={handleSetupComplete}
                onBack={() => navigate('/dashboard')}
              />
            } 
          />
          
          <Route 
            path="/system-check" 
            element={requireConfig(
              <SystemCheckScreen 
                config={sessionConfig!} 
                onComplete={handleSystemCheckComplete}
                onBack={() => navigate('/setup')}
              />
            )} 
          />
          
          <Route 
            path="/instructions" 
            element={requireConfig(
              <InstructionsScreen 
                config={sessionConfig!} 
                onStart={handleInstructionsComplete}
                onBack={() => navigate('/system-check')}
              />
            )} 
          />
          
          <Route 
            path="/interview" 
            element={requireConfig(
              <LiveSession 
                config={sessionConfig!} 
                settings={settings}
                screenStream={activeStreamRef.current}
                onEndSession={handleEndSession}
              />
            )} 
          />
          
          <Route 
            path="/results" 
            element={requireConfig(
              <ResultsScreen
                config={sessionConfig!}
                duration={interviewDuration}
                questionCount={questionCount}
                warningCount={warningCount}
                transcript={sessionTranscript}
                onTryAgain={handleTryAgain}
                onGoHome={handleGoHome}
              />
            )} 
          />
          
          <Route 
            path="/history" 
            element={
              <HistoryScreen 
                onBack={() => navigate('/dashboard')}
              />
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <SettingsScreen 
                onBack={() => navigate('/dashboard')}
                settings={settings}
                onSave={handleSaveSettings}
              />
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileScreen onBack={() => navigate('/dashboard')} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/guide" 
            element={<GuidePage />} 
          />

          <Route 
            path="/pricing" 
            element={
              <ProtectedRoute>
                 <PricingScreen />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all redirect to home */}
          <Route 
            path="*" 
            element={
              <LandingScreen 
                onStart={handleStart}
                onViewHistory={handleViewHistory}
                onOpenSettings={handleOpenSettings}
              />
            } 
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

// App wrapper with BrowserRouter
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;