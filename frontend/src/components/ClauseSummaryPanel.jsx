import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  FileText,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Clock,
  Scale,
  CheckCircle2,
  Key,
  ShieldAlert,
  HelpCircle,
  MapPin,
} from 'lucide-react';
import { getCategoryBadgeColor, getRiskBadgeColor } from '../utils/formatters';

export default function ClauseSummaryPanel({
  clauses = [],
  activeClauseId,
  onClauseClick,
  onRedlineClick,
  onAskCopilotClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [expandedClauseIds, setExpandedClauseIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const clauseRefs = useRef({});

  // When activeClauseId changes externally (e.g. from document viewer), auto-expand and scroll
  useEffect(() => {
    if (activeClauseId) {
      setExpandedClauseIds((prev) => (prev[activeClauseId] ? prev : { ...prev, [activeClauseId]: true }));
      if (clauseRefs.current[activeClauseId]) {
        clauseRefs.current[activeClauseId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeClauseId]);

  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedClauseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    clauses.forEach((c) => {
      all[c.clause_id || c.id] = true;
    });
    setExpandedClauseIds(all);
  };

  const collapseAll = () => {
    setExpandedClauseIds({});
  };

  const handleCopy = (id, text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredClauses = clauses.filter((c) => {
    const cRisk = (c.risk_level || 'STANDARD').toUpperCase().replace(' ', '_');
    const matchesRisk = selectedRisk === 'ALL' || cRisk === selectedRisk;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (c.title && c.title.toLowerCase().includes(searchLower)) ||
      (c.clause_number && c.clause_number.toLowerCase().includes(searchLower)) ||
      (c.plain_language && c.plain_language.toLowerCase().includes(searchLower)) ||
      (c.original_text && c.original_text.toLowerCase().includes(searchLower)) ||
      (c.text && c.text.toLowerCase().includes(searchLower));

    return matchesRisk && matchesSearch;
  });

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header & Controls */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={16} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
                Clause Simplifier & Navigator
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Plain-English explanations for non-lawyers
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={expandAll}
              className="btn-secondary"
              style={{ padding: '3px 7px', fontSize: '0.68rem', borderRadius: '4px' }}
              title="Expand all clauses"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="btn-secondary"
              style={{ padding: '3px 7px', fontSize: '0.68rem', borderRadius: '4px' }}
              title="Collapse all clauses"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 10px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search clauses, terms, or plain explanations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              width: '100%',
            }}
          />
        </div>

        {/* Risk Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600 }}>Filter Risk:</span>
          {[
            { id: 'ALL', label: 'All Clauses', color: '#94a3b8' },
            { id: 'HIGH_RISK', label: 'High Risk', color: '#f87171' },
            { id: 'WORTH_NOTING', label: 'Worth Noting', color: '#fbbf24' },
            { id: 'STANDARD', label: 'Standard', color: '#34d399' },
          ].map((rf) => (
            <button
              key={rf.id}
              onClick={() => setSelectedRisk(rf.id)}
              style={{
                background: selectedRisk === rf.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                color: selectedRisk === rf.id ? rf.color : 'var(--text-muted)',
                border: selectedRisk === rf.id ? `1px solid ${rf.color}` : '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {rf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clause List Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {filteredClauses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No matching clauses found</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Try adjusting your search query or risk filters.
            </div>
          </div>
        ) : (
          filteredClauses.map((clause) => {
            const id = clause.clause_id || clause.id;
            const isExpanded = !!expandedClauseIds[id];
            const isActive = activeClauseId === id;
            const originalText = clause.original_text || clause.text || '';
            const plainLanguage = clause.plain_language || 'This clause defines terms for this contract section.';
            const riskStyle = getRiskBadgeColor(clause.risk_level);
            const catStyle = getCategoryBadgeColor(clause.category);
            const clauseNumber = clause.clause_number || clause.section_number || `${clause.clause_index || 1}`;
            const obligations = clause.obligations || ['Not clearly specified in this clause.'];
            const rights = clause.rights || ['Not clearly specified in this clause.'];
            const deadlines = clause.deadlines || ['Not clearly specified in this clause.'];
            const penalties = clause.penalties || ['Not clearly specified in this clause.'];
            const source = clause.source_location || {
              page: clause.page || 1,
              section_id: clause.section_id || 'SEC-001',
              section_title: clause.title,
            };

            return (
              <div
                key={id}
                ref={(el) => (clauseRefs.current[id] = el)}
                onClick={() => onClauseClick && onClauseClick(clause)}
                className={`glass-panel ${isActive ? 'highlight-target' : ''}`}
                style={{
                  borderRadius: '10px',
                  border: isActive
                    ? '1px solid #6366f1'
                    : isExpanded
                    ? '1px solid rgba(99, 102, 241, 0.35)'
                    : '1px solid var(--border-subtle)',
                  background: isActive
                    ? 'rgba(99, 102, 241, 0.08)'
                    : isExpanded
                    ? 'rgba(15, 23, 42, 0.65)'
                    : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Clause Header Bar */}
                <div
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => toggleExpand(id, e)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Clause Number */}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#e2e8f0',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        Clause {clauseNumber}
                      </span>

                      {/* Title */}
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: isActive ? '#a5b4fc' : '#f8fafc',
                        }}
                      >
                        {clause.title || `Clause ${clauseNumber}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Risk Badge */}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          background: riskStyle.bg,
                          color: riskStyle.text,
                          border: `1px solid ${riskStyle.border}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {riskStyle.label === 'HIGH RISK' && <AlertTriangle size={11} />}
                        {riskStyle.label === 'WORTH NOTING' && <AlertCircle size={11} />}
                        {riskStyle.label === 'STANDARD' && <ShieldCheck size={11} />}
                        {riskStyle.label}
                      </span>

                      {/* Category Badge */}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {clause.category || 'General'}
                      </span>

                      {/* Expand Toggle Button */}
                      <button
                        onClick={(e) => toggleExpand(id, e)}
                        className="btn-secondary"
                        style={{
                          padding: '3px 6px',
                          fontSize: '0.68rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                        title={isExpanded ? 'Collapse' : 'Expand full details'}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Plain-Language Explanation (Always visible on card) */}
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderLeft: '3px solid #818cf8',
                      padding: '8px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '0.8rem',
                      color: '#e0e7ff',
                      lineHeight: '1.45',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#c7d2fe', marginRight: '6px' }}>Plain Summary:</span>
                    {plainLanguage}
                  </div>
                </div>

                {/* EXPANDED VIEW */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                      background: 'rgba(10, 15, 30, 0.75)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Source / Page metadata indicator */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#818cf8" />
                        <span>Source Location: Page {source.page || clause.page || 1} • Section: {source.section_title || clause.title || 'General'}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>ID: {id}</span>
                    </div>

                    {/* Breakdown Grid: Obligations, Rights, Deadlines, Penalties */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {/* Obligations */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#60a5fa',
                            marginBottom: '6px',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Obligations (Must Do)</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {obligations.map((ob, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>{ob}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Rights */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#34d399',
                            marginBottom: '6px',
                          }}
                        >
                          <Key size={13} />
                          <span>Rights (Can Do)</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {rights.map((r, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Deadlines */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#fbbf24',
                            marginBottom: '6px',
                          }}
                        >
                          <Clock size={13} />
                          <span>Deadlines & Timelines</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {deadlines.map((dl, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>{dl}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Penalties */}
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#f87171',
                            marginBottom: '6px',
                          }}
                        >
                          <ShieldAlert size={13} />
                          <span>Penalties & Liabilities</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {penalties.map((pen, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>{pen}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Original Clause Text */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Original Legal Text
                        </span>
                        <button
                          onClick={(e) => handleCopy(id, originalText, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedId === id ? '#10b981' : 'var(--text-dim)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                          }}
                        >
                          {copiedId === id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedId === id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          color: '#cbd5e1',
                          lineHeight: '1.5',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {originalText}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {onRedlineClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRedlineClick(clause);
                          }}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Sparkles size={12} color="#818cf8" />
                          <span>Redline Clause</span>
                        </button>
                      )}

                      {onAskCopilotClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskCopilotClick(clause);
                          }}
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <HelpCircle size={12} />
                          <span>Ask Co-Pilot About This</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
