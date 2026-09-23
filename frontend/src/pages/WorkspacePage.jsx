import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  Key, 
  Clock, 
  Copy, 
  Check, 
  FolderLock,
} from 'lucide-react';
import RiskPanel from '../components/RiskPanel';
import QAPanel from '../components/QAPanel';
import { ROUTES } from '../types/constants';

export default function WorkspacePage({
  document,
  clauses = [],
  analysis,
  analysisLoading,
  onRunAudit,
  chatMessages,
  chatThinking,
  onSendMessage,
  onNavigate,
  onLoadSample,
  onSaveContract,
  onSelectForRedline,
}) {
  const [activeTab, setActiveTab] = useState('risk'); // 'risk' | 'qa'
  const [selectedClauseId, setSelectedClauseId] = useState(
    clauses && clauses.length > 0 ? (clauses[0].clause_id || clauses[0].id) : null
  );
  const [navSearch, setNavSearch] = useState('');
  const [navRiskFilter, setNavRiskFilter] = useState('ALL');
  const [copiedText, setCopiedText] = useState(false);
  const clauseRefs = useRef({});

  useEffect(() => {
    if (clauses && clauses.length > 0) {
      setSelectedClauseId((prev) => prev || clauses[0].clause_id || clauses[0].id);
    }
  }, [clauses]);

  if (!document) {
    return (
      <main 
        role="main"
        aria-label="Empty Workspace"
        style={{
          height: '100%',
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <FileText size={28} color="#818cf8" aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          No Document Active in Workspace
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '22px', maxWidth: '440px', lineHeight: '1.5' }}>
          Please upload a legal agreement or test with a pre-configured benchmark contract to activate the workspace analysis.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => onNavigate(ROUTES.UPLOAD)} 
            className="btn-primary"
            aria-label="Upload a contract"
            style={{ padding: '10px 20px' }}
          >
            <span>Upload Contract</span>
          </button>
          {onLoadSample && (
            <>
              <button 
                onClick={() => onLoadSample('sample_saas_msa')} 
                className="btn-secondary"
                style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} color="#818cf8" aria-hidden="true" />
                <span>Test SaaS MSA</span>
              </button>
              <button 
                onClick={() => onLoadSample('sample_nda')} 
                className="btn-secondary"
                style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} color="#818cf8" aria-hidden="true" />
                <span>Test Mutual NDA</span>
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  // Active selected clause object
  const activeClause = clauses.find(
    (c) => (c.clause_id || c.id) === selectedClauseId
  ) || clauses[0] || null;

  // Filtered clause navigation list
  const filteredClauses = (clauses || []).filter((c) => {
    const cRisk = (c.risk_level || 'STANDARD').toUpperCase().replace(' ', '_');
    const matchesRisk = navRiskFilter === 'ALL' || cRisk === navRiskFilter;
    const sLower = navSearch.toLowerCase();
    const matchesSearch =
      !navSearch ||
      (c.title && c.title.toLowerCase().includes(sLower)) ||
      (c.clause_number && c.clause_number.toLowerCase().includes(sLower)) ||
      (c.plain_language && c.plain_language.toLowerCase().includes(sLower)) ||
      (c.original_text && c.original_text.toLowerCase().includes(sLower)) ||
      (c.text && c.text.toLowerCase().includes(sLower));
    return matchesRisk && matchesSearch;
  });

  const handleJumpToClause = (clauseId) => {
    setSelectedClauseId(clauseId);
    if (clauseRefs.current[clauseId]) {
      clauseRefs.current[clauseId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCopyClause = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleRedlineClick = (clause) => {
    if (onSelectForRedline) onSelectForRedline(clause);
    onNavigate(ROUTES.COMPARISON);
  };

  return (
    <div 
      className="workspace-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '270px 1fr 390px',
        gap: '14px',
        height: 'calc(100vh - 84px)',
        padding: '12px 16px',
        overflow: 'hidden',
      }}
    >
      {/* ========================================================= */}
      {/* 1. LEFT COLUMN: Clause Navigation                         */}
      {/* ========================================================= */}
      <aside 
        role="navigation"
        aria-label="Clause Navigation"
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Navigation Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.03em' }}>
              Clause Index
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {filteredClauses.length} / {clauses.length}
            </span>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '5px 8px',
          }}>
            <Search size={13} color="var(--text-dim)" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search clauses..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              aria-label="Filter clause list"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                width: '100%',
              }}
            />
          </div>

          {/* Explicit Text Risk Filters */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }} role="group" aria-label="Risk filters">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'HIGH_RISK', label: 'HIGH RISK', color: 'var(--risk-high-text)', bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)' },
              { id: 'WORTH_NOTING', label: 'WORTH NOTING', color: 'var(--risk-med-text)', bg: 'var(--risk-med-bg)', border: 'var(--risk-med-border)' },
              { id: 'STANDARD', label: 'STANDARD', color: 'var(--risk-low-text)', bg: 'var(--risk-low-bg)', border: 'var(--risk-low-border)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setNavRiskFilter(f.id)}
                aria-pressed={navRiskFilter === f.id}
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: navRiskFilter === f.id ? (f.bg || 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.03)',
                  color: navRiskFilter === f.id ? (f.color || '#fff') : 'var(--text-dim)',
                  border: navRiskFilter === f.id ? `1px solid ${f.border || '#818cf8'}` : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clause List */}
        <div 
          role="list"
          aria-label="Document Clauses"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {filteredClauses.map((c) => {
            const cid = c.clause_id || c.id;
            const isSelected = (activeClause?.clause_id || activeClause?.id) === cid;
            const rLevel = (c.risk_level || 'STANDARD').toUpperCase().replace(' ', '_');
            const cNum = c.clause_number || c.section_number || '1';

            let badgeClass = 'badge-low';
            let badgeText = 'STANDARD';
            if (rLevel === 'HIGH_RISK') {
              badgeClass = 'badge-high';
              badgeText = 'HIGH RISK';
            } else if (rLevel === 'WORTH_NOTING') {
              badgeClass = 'badge-med';
              badgeText = 'WORTH NOTING';
            }

            return (
              <button
                key={cid}
                ref={(el) => (clauseRefs.current[cid] = el)}
                onClick={() => setSelectedClauseId(cid)}
                role="listitem"
                aria-selected={isSelected}
                aria-label={`Clause ${cNum}: ${c.title || 'Clause'}. Risk level: ${badgeText}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                  background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? '#a5b4fc' : '#cbd5e1',
                  }}>
                    Clause {cNum}
                  </span>
                  <span className={badgeClass} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    {badgeText}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {c.title || `Clause ${cNum}`}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CENTER COLUMN: Document / Clause Content Viewer        */}
      {/* ========================================================= */}
      <section 
        role="main"
        aria-label="Clause Content Viewer"
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {activeClause ? (
          <>
            {/* Clause Content Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    Clause {activeClause.clause_number || '1'}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                    {activeClause.title || `Clause ${activeClause.clause_number}`}
                  </h3>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Category: <strong>{activeClause.category || 'General'}</strong> • Location: <strong>Page {activeClause.page || 1}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {onSaveContract && (
                  <button
                    onClick={onSaveContract}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
                    aria-label="Save contract to library"
                    title="Save this contract to your library"
                  >
                    <FolderLock size={12} color="#818cf8" />
                    <span>Save Contract</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyClause(activeClause.original_text || activeClause.text || '')}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  aria-label="Copy clause text"
                >
                  {copiedText ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleRedlineClick(activeClause)}
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  aria-label="Redline this clause"
                >
                  <Sparkles size={12} />
                  <span>Redline Clause</span>
                </button>
              </div>
            </div>

            {/* Clause Content Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              {/* Plain-Language Explanation */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                borderLeft: '4px solid #6366f1',
                padding: '12px 14px',
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '4px' }}>
                  Plain-English Summary (Non-Lawyer Translation)
                </div>
                <p style={{ fontSize: '0.84rem', color: '#f1f5f9', lineHeight: '1.55', margin: 0 }}>
                  {activeClause.plain_language || 'This clause establishes standard operational and legal terms for this section.'}
                </p>
              </div>

              {/* 4 Pillars Breakdown: Obligations, Rights, Deadlines, Penalties */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
              }}>
                {/* Obligations */}
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
                    <CheckCircle2 size={12} />
                    <span>Obligations (Must Do)</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {(activeClause.obligations || ['Not clearly specified in this clause.']).map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>

                {/* Rights */}
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                    <Key size={12} />
                    <span>Rights (Can Do)</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {(activeClause.rights || ['Not clearly specified in this clause.']).map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Deadlines */}
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                    <Clock size={12} />
                    <span>Deadlines & Timelines</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {(activeClause.deadlines || ['Not clearly specified in this clause.']).map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Penalties */}
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                    <ShieldAlert size={12} />
                    <span>Penalties & Liabilities</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {(activeClause.penalties || ['Not clearly specified in this clause.']).map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Original Verbatim Legal Text */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Original Verbatim Legal Text
                </div>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#e2e8f0',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}>
                  {activeClause.original_text || activeClause.text}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a clause from the left index to view detailed legal text.
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. RIGHT COLUMN: Risk + Grounded Q&A Assistant            */}
      {/* ========================================================= */}
      <aside 
        aria-label="Intelligence Panels"
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '4px 6px',
        }} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'risk'}
            onClick={() => setActiveTab('risk')}
            style={{
              flex: 1,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: activeTab === 'risk' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'risk' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'risk' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <ShieldAlert size={14} color={activeTab === 'risk' ? '#818cf8' : 'var(--text-dim)'} aria-hidden="true" />
            <span>Risk Panel</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'qa'}
            onClick={() => setActiveTab('qa')}
            style={{
              flex: 1,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: activeTab === 'qa' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'qa' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'qa' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <MessageSquare size={14} color={activeTab === 'qa' ? '#818cf8' : 'var(--text-dim)'} aria-hidden="true" />
            <span>Grounded Q&A</span>
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
              documentId={document?.metadata?.document_id || document?.id}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
