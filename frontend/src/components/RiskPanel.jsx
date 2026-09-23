import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Sparkles, ExternalLink, Check, FileWarning } from 'lucide-react';
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
    return <LoadingState message="Running AI Risk Audit on active contract..." size="large" />;
  }

  if (!analysis) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}>
          <ShieldAlert size={24} color="#818cf8" />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
          No Risk Audit Performed
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.4', marginBottom: '16px' }}>
          Run automated analysis to evaluate overall risk rating, uncapped liability traps, and non-standard terms.
        </p>
        <button onClick={onRunAudit} className="btn-primary" style={{ fontSize: '0.82rem' }}>
          <Sparkles size={14} />
          <span>Run AI Risk Audit</span>
        </button>
      </div>
    );
  }

  const { overall_risk_score, risk_level, executive_summary, key_findings, missing_clauses, favorable_terms } = analysis;

  const filteredFindings = (key_findings || []).filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity?.toUpperCase() === severityFilter;
  });

  const getScoreColor = (score) => {
    if (score >= 65) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Risk score header */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
            Risk Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: getScoreColor(overall_risk_score) }}>
              {overall_risk_score}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/100</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              background: `${getScoreColor(overall_risk_score)}20`,
              color: getScoreColor(overall_risk_score),
            }}>
              {risk_level} Risk
            </span>
          </div>
        </div>

        <button onClick={onRunAudit} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
          <Sparkles size={12} />
          <span>Re-Audit</span>
        </button>
      </div>

      {/* Summary */}
      {executive_summary && (
        <div className="glass-panel" style={{ padding: '12px 14px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '3px' }}>
            Executive Assessment
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
            {executive_summary}
          </p>
        </div>
      )}

      {/* Key findings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Key Findings ({key_findings?.length || 0})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '3px' }}>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: severityFilter === sev ? '#a5b4fc' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredFindings.map((f, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={f.severity?.toUpperCase() === 'HIGH' ? 'badge-high' : 'badge-med'}>
                  {f.severity} Risk
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {f.clause_title || f.risk_category}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {f.issue_summary}
              </p>

              {f.legal_recommendation && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '0.74rem',
                  color: '#c7d2fe',
                }}>
                  <strong>Remedy:</strong> {f.legal_recommendation}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                {f.clause_id && onJumpToClause && (
                  <button
                    onClick={() => onJumpToClause(f.clause_id)}
                    className="btn-secondary"
                    style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                  >
                    <ExternalLink size={11} />
                    <span>View Clause</span>
                  </button>
                )}
                {onRedlineClause && (
                  <button
                    onClick={() => onRedlineClause(f)}
                    className="btn-primary"
                    style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                  >
                    <Sparkles size={11} />
                    <span>Redline</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
