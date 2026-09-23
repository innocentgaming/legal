import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import WorkspacePage from './pages/WorkspacePage';
import ComparisonPage from './pages/ComparisonPage';
import BriefingPage from './pages/BriefingPage';
import { ErrorAlert } from './components/LoadingState';

import { useContract } from './hooks/useContract';
import { useRiskAudit } from './hooks/useRiskAudit';
import { useChat } from './hooks/useChat';
import { contractService } from './services/contractService';
import { ROUTES } from './types/constants';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.LANDING);
  const [selectedClauseForRedline, setSelectedClauseForRedline] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  const {
    document,
    clauses,
    loading: contractLoading,
    error: contractError,
    setError: setContractError,
    uploadDocument,
    loadSampleDocument,
    resetDocument,
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
      .then(setSystemStatus)
      .catch((err) => console.warn('Backend not yet reachable:', err.message));
  }, []);

  const handleFileUpload = async (file) => {
    try {
      const res = await uploadDocument(file);
      clearAudit();
      clearChat();
      setCurrentRoute(ROUTES.WORKSPACE);
      // Auto run audit
      runAudit();
    } catch (err) {
      // Handled by hook
    }
  };

  const handleLoadSample = async (sampleId) => {
    try {
      const res = await loadSampleDocument(sampleId);
      clearAudit();
      clearChat();
      setCurrentRoute(ROUTES.WORKSPACE);
      // Auto run audit
      runAudit();
    } catch (err) {
      // Handled by hook
    }
  };

  const activeError = contractError || analysisError || chatError;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-main)',
      overflow: 'hidden',
    }}>
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        document={document}
        systemStatus={systemStatus}
      />

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
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {currentRoute === ROUTES.LANDING && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <LandingPage onNavigate={setCurrentRoute} />
          </div>
        )}

        {currentRoute === ROUTES.UPLOAD && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <UploadPage
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              loading={contractLoading}
              document={document}
              onNavigate={setCurrentRoute}
            />
          </div>
        )}

        {currentRoute === ROUTES.WORKSPACE && (
          <WorkspacePage
            document={document}
            clauses={clauses}
            analysis={analysis}
            analysisLoading={analysisLoading}
            onRunAudit={runAudit}
            chatMessages={chatMessages}
            chatThinking={chatThinking}
            onSendMessage={sendMessage}
            onNavigate={setCurrentRoute}
            onSelectForRedline={(c) => setSelectedClauseForRedline(c)}
          />
        )}

        {currentRoute === ROUTES.COMPARISON && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <ComparisonPage
              document={document}
              clauses={clauses}
              selectedClause={selectedClauseForRedline}
            />
          </div>
        )}

        {currentRoute === ROUTES.BRIEFING && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <BriefingPage
              document={document}
              clauses={clauses}
            />
          </div>
        )}
      </main>
    </div>
  );
}
