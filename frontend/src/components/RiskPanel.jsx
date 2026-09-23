import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Sparkles, ExternalLink, ShieldCheck, AlertCircle, FileWarning } from 'lucide-react';
import { LoadingState } from './LoadingState';

export default function RiskPanel({
  analysis,
  loading,
  onRunAudit,
  onJumpToClause,
  onRedlineClause,
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');

  if (loading) {
    return <LoadingState message="Running hybrid legal risk audit..." size="large" />;
  }

  if (!analysis) {
    return (
      <div 
        role="region"
        aria-label="Risk Audit Status"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: 'rgba(99, 102, 241, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <ShieldAlert size={22} color="#818cf8" aria-hidden="true" />
        </div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
          Risk Audit Pending
        </h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.4', marginBottom: '14px' }}>
          Evaluate liability ceilings, one-sided indemnity terms, and potential negotiation levers.
        </p>
        <button onClick={onRunAudit} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          <Sparkles size={13} aria-hidden="true" />
          <span>Run Risk Audit</span>
        </button>
      </div>
    );
  }

  const { overall_risk_score, risk_level, executive_summary, key_findings, missing_clauses, clause_risks } = analysis;

  // Use clause_risks or key_findings
  const findingsList = (clause_risks || []).length > 0
    ? clause_risks.filter(r => r.risk_level !== 'STANDARD')
    : (key_findings || []);

  const filteredFindings = findingsList.filter((f) => {
    if (severityFilter === 'ALL') return true;
    const rLvl = (f.risk_level || f.severity || '').toUpperCase().replace(' ', '_');
    return rLvl.includes(severityFilter);
  });

  const getScoreColor = (score) => {
    if (score >= 60) return '#ef4444';
    if (score >= 35) return '#f59e0b';
    return '#10b981';
  };

  const getScoreBadgeText = (score) => {
    if (score >= 60) return 'HIGH RISK';
    if (score >= 35) return 'WORTH NOTING';
    return 'STANDARD';
  };

  return (
    <div 
      role="region"
      aria-label="Risk Audit Results"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Risk Score Summary Card */}
      <div className="glass-panel" style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
            Document Risk Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: getScoreColor(overall_risk_score) }}>
              {overall_risk_score}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/100</span>
            <span className={overall_risk_score >= 60 ? 'badge-high' : (overall_risk_score >= 35 ? 'badge-med' : 'badge-low')}>
              {getScoreBadgeText(overall_risk_score)}
            </span>
          </div>
        </div>

        <button 
          onClick={onRunAudit} 
          className="btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
          aria-label="Re-run legal risk audit"
        >
          <Sparkles size={11} aria-hidden="true" />
          <span>Re-Audit</span>
        </button>
      </div>

      {/* Executive Summary */}
      {executive_summary && (
        <div className="glass-panel" style={{ padding: '10px 12px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '3px' }}>
            Audit Summary
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.45', margin: 0 }}>
            {executive_summary}
          </p>
        </div>
      )}

      {/* Key Risk Findings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={14} color="#f59e0b" aria-hidden="true" />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)' }}>
              Flagged Clauses ({findingsList.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '3px' }} role="group" aria-label="Severity Filter">
            {['ALL', 'HIGH', 'WORTH'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev === 'WORTH' ? 'WORTH_NOTING' : sev)}
                aria-pressed={severityFilter === (sev === 'WORTH' ? 'WORTH_NOTING' : sev)}
                style={{
                  background: severityFilter.includes(sev) ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: severityFilter.includes(sev) ? '#a5b4fc' : 'var(--text-dim)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sev === 'HIGH' ? 'HIGH RISK' : (sev === 'WORTH' ? 'WORTH NOTING' : 'ALL')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredFindings.map((f, idx) => {
            const riskLvl = (f.risk_level || (f.severity === 'High' ? 'HIGH_RISK' : 'WORTH_NOTING')).toUpperCase();
            const isHigh = riskLvl === 'HIGH_RISK';
            const badgeClass = isHigh ? 'badge-high' : 'badge-med';
            const badgeLabel = isHigh ? 'HIGH RISK' : 'WORTH NOTING';
            const title = f.source_clause || f.clause_title || f.title || `Clause ${f.clause_id}`;
            const reason = f.reason || f.issue_summary;
            const evidence = f.evidence || f.flagged_text;

            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  border: isHigh ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={badgeClass}>
                    {isHigh ? <AlertTriangle size={10} /> : <AlertCircle size={10} />}
                    <span>{badgeLabel}</span>
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {title}
                  </span>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {reason}
                </p>

                {evidence && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '0.7rem',
                    color: '#cbd5e1',
                    fontStyle: 'italic',
                  }}>
                    "{evidence}"
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                  {f.clause_id && onJumpToClause && (
                    <button
                      onClick={() => onJumpToClause(f.clause_id)}
                      className="btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.66rem' }}
                      aria-label={`Jump to ${title}`}
                    >
                      <ExternalLink size={10} aria-hidden="true" />
                      <span>Inspect</span>
                    </button>
                  )}
                  {onRedlineClause && (
                    <button
                      onClick={() => onRedlineClause(f)}
                      className="btn-primary"
                      style={{ padding: '2px 7px', fontSize: '0.66rem' }}
                      aria-label={`Redline ${title}`}
                    >
                      <Sparkles size={10} aria-hidden="true" />
                      <span>Redline</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Clauses Section */}
      {missing_clauses && missing_clauses.length > 0 && (
        <div className="glass-panel" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
            <FileWarning size={12} />
            <span>Missing Protective Terms ({missing_clauses.length})</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {missing_clauses.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
