// ============================================
// AURA - Main App Component
// Multi-Page Navigation with Senior Accessibility & Contact Support
// ============================================

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConsultationProvider, useConsultation } from './context/ConsultationContext';
import { Navbar, AppView } from './components/navigation/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConsultationPage } from './pages/ConsultationPage';
import { SummaryPage } from './pages/SummaryPage';
import { HistoryPage } from './pages/HistoryPage';
import { ContactSupportPage } from './pages/ContactSupportPage';
import { AboutPage } from './pages/AboutPage';

function AppContent() {
  const { user, loading } = useAuth();
  const { reset } = useConsultation();
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [isLargeFont, setIsLargeFont] = useState(false);

  useEffect(() => {
    const savedFont = localStorage.getItem('aura_senior_font') === 'true';
    setIsLargeFont(savedFont);
  }, []);

  const handleToggleLargeFont = () => {
    const nextVal = !isLargeFont;
    setIsLargeFont(nextVal);
    localStorage.setItem('aura_senior_font', String(nextVal));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="aura-logo large animated">
          <div className="logo-pulse"></div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h2 className="loading-text">Virtual Scribe Assistant</h2>
        <p className="loading-subtext">Voice-First AI Clinical Consultation</p>
      </div>
    );
  }

  const handleStartConsultation = () => {
    reset();
    setView('consultation');
  };

  const handleViewHistory = () => {
    setView('history');
  };

  const handleConsultationComplete = (consultationId: string) => {
    setSelectedConsultationId(consultationId);
    setView('summary');
  };

  const handleSelectConsultation = (consultationId: string) => {
    setSelectedConsultationId(consultationId);
    setView('summary');
  };

  const handleBackToDashboard = () => {
    reset();
    setView('dashboard');
  };

  const renderView = () => {
    if (view === 'login') {
      return <LoginPage onLoginSuccess={() => setView('dashboard')} />;
    }

    switch (view) {
      case 'consultation':
        return (
          <ConsultationPage
            onBack={handleBackToDashboard}
            onComplete={handleConsultationComplete}
          />
        );
      case 'summary':
        return selectedConsultationId ? (
          <SummaryPage
            consultationId={selectedConsultationId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <DashboardPage
            onStartConsultation={handleStartConsultation}
            onViewHistory={handleViewHistory}
          />
        );
      case 'history':
        return (
          <HistoryPage
            onBack={handleBackToDashboard}
            onSelectConsultation={handleSelectConsultation}
          />
        );
      case 'support':
        return <ContactSupportPage onBack={handleBackToDashboard} />;
      case 'about':
        return (
          <AboutPage
            onBack={handleBackToDashboard}
            onStartConsultation={handleStartConsultation}
          />
        );
      default:
        return (
          <DashboardPage
            onStartConsultation={handleStartConsultation}
            onViewHistory={handleViewHistory}
          />
        );
    }
  };

  return (
    <div className={`app-wrapper ${isLargeFont ? 'senior-font-mode' : ''}`}>
      {view !== 'login' && (
        <Navbar
          currentView={view}
          onNavigate={(targetView) => setView(targetView)}
          isLargeFont={isLargeFont}
          onToggleLargeFont={handleToggleLargeFont}
        />
      )}
      <main className="app-main-content">
        <div className="ambient-background-glow" aria-hidden="true">
          <div className="glow-orb orb-top-left"></div>
          <div className="glow-orb orb-bottom-right"></div>
          <div className="glow-orb orb-center-cyan"></div>
        </div>
        <div className="view-transition-container" key={view + (view === 'summary' ? `-${selectedConsultationId}` : '')}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConsultationProvider>
        <AppContent />
      </ConsultationProvider>
    </AuthProvider>
  );
}

export default App;
