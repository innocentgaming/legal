import React, { useState } from 'react';
import ClauseSummaryPanel from '../components/ClauseSummaryPanel';
import RiskPanel from '../components/RiskPanel';
import QAPanel from '../components/QAPanel';
import { ShieldAlert, MessageSquare, Sparkles, Scale } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function WorkspacePage({
  document,
  clauses,
  analysis,
  analysisLoading,
  onRunAudit,
  chatMessages,
  chatThinking,
  onSendMessage,
  onNavigate,
  onSelectForRedline,
}) {
  const [activeTab, setActiveTab] = useState('risk'); // 'risk' | 'qa'
  const [activeClauseId, setActiveClauseId] = useState(null);

  if (!document) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
          No Document Ingested Yet
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Please upload a legal agreement or load a benchmark sample to activate the workspace.
        </p>
        <button onClick={() => onNavigate(ROUTES.UPLOAD)} className="btn-primary">
          Ingest Contract
        </button>
      </div>
    );
  }

  const handleJumpToClause = (clauseId) => {
    setActiveClauseId(clauseId);
  };

  const handleRedlineClick = (clause) => {
    onSelectForRedline(clause);
    onNavigate(ROUTES.COMPARISON);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      gap: '16px',
      height: 'calc(100vh - 84px)',
      padding: '12px 20px',
      overflow: 'hidden',
    }}>
      {/* Left Column: Clause Summary Panel */}
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <ClauseSummaryPanel
          clauses={clauses}
          activeClauseId={activeClauseId}
          onClauseClick={(c) => setActiveClauseId(c.id)}
          onRedlineClick={handleRedlineClick}
        />
      </div>

      {/* Right Column: Tabbed Intelligence (Risk & QA Panels) */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px 6px',
        }}>
          <button
            onClick={() => setActiveTab('risk')}
            style={{
              flex: 1,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'risk' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'risk' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'risk' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <ShieldAlert size={15} color={activeTab === 'risk' ? '#818cf8' : 'var(--text-dim)'} />
            <span>Risk Panel</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            style={{
              flex: 1,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'qa' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'qa' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'qa' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <MessageSquare size={15} color={activeTab === 'qa' ? '#818cf8' : 'var(--text-dim)'} />
            <span>Q&A Panel</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'risk' && (
            <RiskPanel
              analysis={analysis}
              loading={analysisLoading}
              onRunAudit={onRunAudit}
              onJumpToClause={handleJumpToClause}
              onRedlineClause={handleRedlineClick}
            />
          )}

          {activeTab === 'qa' && (
            <QAPanel
              messages={chatMessages}
              thinking={chatThinking}
              onSendMessage={onSendMessage}
              onJumpToClause={handleJumpToClause}
            />
          )}
        </div>
      </div>
    </div>
  );
}
