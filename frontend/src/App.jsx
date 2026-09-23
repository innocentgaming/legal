import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import WorkspacePage from './pages/WorkspacePage';
import ComparisonPage from './pages/ComparisonPage';
import BriefingPage from './pages/BriefingPage';
import NotFoundPage from './pages/NotFoundPage';
import Toast from './components/Toast';
import { ErrorAlert } from './components/LoadingState';

import { useContract } from './hooks/useContract';
import { useRiskAudit } from './hooks/useRiskAudit';
import { useChat } from './hooks/useChat';
import { contractService } from './services/contractService';
import { ROUTES } from './types/constants';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LANDING);
  const [selectedClauseForRedline, setSelectedClauseForRedline] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  const {
    document,
    clauses,
    loading: contractLoading,
    error: contractError,
    setError: setContractError,
    uploadDocument,
    loadSampleDocument,
  } = useContract();

  const {
    analysis,
    loading: analysisLoading,
    error: analysisError,
    runAudit,
    clearAudit,
  } = useRiskAudit();

  const {
    messages: chatMessages,
    thinking: chatThinking,
    error: chatError,
    sendMessage,
    clearChat,
  } = useChat();

  // Load system status on mount
  useEffect(() => {
    contractService.getSystemStatus()
      .catch((err) => console.warn('Backend status check:', err.message));
  }, []);

  // Update dynamic page title on route change
  useEffect(() => {
    switch (currentRoute) {
      case ROUTES.LANDING:
        window.document.title = 'CLARITY — AI Legal Co-Pilot';
        break;
      case ROUTES.UPLOAD:
        window.document.title = 'CLARITY — Ingest Contract';
        break;
      case ROUTES.WORKSPACE:
        window.document.title = document ? `CLARITY — ${document.filename}` : 'CLARITY — Workspace';
        break;
      case ROUTES.COMPARISON:
        window.document.title = 'CLARITY — Compare Documents';
        break;
      case ROUTES.BRIEFING:
        window.document.title = 'CLARITY — Lawyer Preparation Briefing';
        break;
      default:
        window.document.title = 'CLARITY — AI Legal Co-Pilot';
    }
  }, [currentRoute, document]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleFileUpload = async (file) => {
    try {
      await uploadDocument(file);
      clearAudit();
      clearChat();
      setCurrentRoute(ROUTES.WORKSPACE);
      showToast(`Contract "${file.name}" successfully parsed & indexed!`, 'success');
      // Auto run audit
      runAudit();
    } catch (err) {
      showToast(err.message || 'Failed to parse document.', 'error');
    }
  };

  const handleLoadSample = async (sampleId) => {
    try {
      await loadSampleDocument(sampleId);
      clearAudit();
      clearChat();
      setCurrentRoute(ROUTES.WORKSPACE);
      showToast('Benchmark sample contract loaded successfully!', 'success');
      // Auto run audit
      runAudit();
    } catch (err) {
      showToast(err.message || 'Failed to load benchmark sample.', 'error');
    }
  };

  const activeError = contractError || analysisError || chatError;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-main)',
      overflowX: 'hidden',
    }}>
      {/* Top Accessible Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        document={document}
      />

      {/* Global Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Global Error Banner if any */}
      {activeError && (
        <ErrorAlert
          message={activeError}
          onDismiss={() => {
            setContractError(null);
          }}
        />
      )}

      {/* Main Page Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentRoute === ROUTES.LANDING && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <LandingPage onNavigate={setCurrentRoute} onLoadSample={handleLoadSample} />
            <Footer onNavigate={setCurrentRoute} document={document} />
          </div>
        )}

        {currentRoute === ROUTES.UPLOAD && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <UploadPage
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              loading={contractLoading}
              document={document}
              onNavigate={setCurrentRoute}
            />
            <Footer onNavigate={setCurrentRoute} document={document} />
          </div>
        )}

        {currentRoute === ROUTES.WORKSPACE && (
          <WorkspacePage
            document={document}
            clauses={clauses}
            analysis={analysis}
            analysisLoading={analysisLoading}
            onRunAudit={() => {
              runAudit();
              showToast('Risk audit updated!', 'success');
            }}
            chatMessages={chatMessages}
            chatThinking={chatThinking}
            onSendMessage={sendMessage}
            onNavigate={setCurrentRoute}
            onSelectForRedline={(c) => setSelectedClauseForRedline(c)}
          />
        )}

        {currentRoute === ROUTES.COMPARISON && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ComparisonPage
              document={document}
              clauses={clauses}
              selectedClause={selectedClauseForRedline}
            />
          </div>
        )}

        {currentRoute === ROUTES.BRIEFING && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <BriefingPage
              document={document}
            />
          </div>
        )}

        {![ROUTES.LANDING, ROUTES.UPLOAD, ROUTES.WORKSPACE, ROUTES.COMPARISON, ROUTES.BRIEFING].includes(currentRoute) && (
          <NotFoundPage onNavigate={setCurrentRoute} />
        )}
      </main>
    </div>
  );
}
