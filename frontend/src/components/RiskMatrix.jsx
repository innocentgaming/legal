import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, ExternalLink, FileWarning, Check } from 'lucide-react';

export default function RiskMatrix({ 
  analysis, 
  onJumpToClause, 
  onSelectForRedline, 
  isAnalyzing, 
  onTriggerAnalysis 
}) {
  const [severityFilter, setSeverityFilter] = useState("ALL");

  if (!analysis) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <ShieldAlert size={28} color="#818cf8" className={isAnalyzing ? "pulsing-radar" : ""} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
          {isAnalyzing ? "Analyzing Legal Risk Exposure..." : "No Risk Audit Generated Yet"}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: '20px', lineHeight: '1.5' }}>
          Run an automated AI Legal Risk Audit to detect uncapped liabilities, one-sided indemnities, non-competes, and missing protective clauses.
        </p>
        <button 
          onClick={onTriggerAnalysis} 
          disabled={isAnalyzing}
          className="btn-primary"
        >
          <Sparkles size={16} />
          <span>{isAnalyzing ? "Auditing in Progress..." : "Run AI Risk Audit"}</span>
        </button>
      </div>
    );
  }

  const { overall_risk_score, risk_level, executive_summary, key_findings, missing_clauses, favorable_terms } = analysis;

  const filteredFindings = (key_findings || []).filter(f => {
    if (severityFilter === "ALL") return true;
    return f.severity?.toUpperCase() === severityFilter;
  });

  const getSeverityBadge = (severity) => {
    const s = severity?.toUpperCase();
    if (s === "HIGH") return <span className="badge-high">High Risk</span>;
    if (s === "MEDIUM" || s === "MED") return <span className="badge-med">Medium Risk</span>;
    return <span className="badge-low">Low Risk</span>;
  };

  const getScoreColor = (score) => {
    if (score >= 65) return "#ef4444";
    if (score >= 40) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    }}>
      {/* Risk Score Overview Banner */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>
            Overall Risk Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(overall_risk_score) }}>
              {overall_risk_score}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/100</span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${getScoreColor(overall_risk_score)}20`,
              color: getScoreColor(overall_risk_score),
              border: `1px solid ${getScoreColor(overall_risk_score)}40`
            }}>
              {risk_level} Risk Level
            </span>
          </div>
        </div>

        {/* Mini Meter Bars */}
        <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Audit Score</span>
            <span>{overall_risk_score >= 65 ? "Requires Revisions" : (overall_risk_score >= 40 ? "Needs Review" : "Standard")}</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.max(5, overall_risk_score))}%`,
              height: '100%',
              background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
              borderRadius: '999px',
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {executive_summary && (
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc', marginBottom: '4px' }}>
            Executive Legal Summary
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
            {executive_summary}
          </p>
        </div>
      )}

      {/* Key Findings Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Key Findings ({key_findings?.length || 0})
            </span>
          </div>

          {/* Severity Filter */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: severityFilter === sev ? '#a5b4fc' : 'var(--text-muted)',
                  border: severityFilter === sev ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Finding Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredFindings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No findings under the selected severity filter.
            </div>
          ) : (
            filteredFindings.map((finding, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Finding Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getSeverityBadge(finding.severity)}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {finding.clause_title || finding.risk_category || "Flagged Clause"}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {finding.clause_id}
                  </span>
                </div>

                {/* Issue Summary */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                  {finding.issue_summary}
                </p>

                {/* Recommendation Box */}
                {finding.legal_recommendation && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.78rem',
                    color: '#c7d2fe',
                    lineHeight: '1.4'
                  }}>
                    <strong>Recommendation:</strong> {finding.legal_recommendation}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  {finding.clause_id && (
                    <button
                      onClick={() => onJumpToClause(finding.clause_id)}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      <ExternalLink size={12} />
                      <span>View in Document</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectForRedline({
                      id: finding.clause_id,
                      title: finding.clause_title,
                      text: finding.flagged_text || finding.issue_summary,
                      category: finding.risk_category,
                      recommendation: finding.legal_recommendation
                    })}
                    className="btn-primary"
                    style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                  >
                    <Sparkles size={12} />
                    <span>Redline Clause</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Missing Standard Clauses Checklist */}
      {missing_clauses && missing_clauses.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <FileWarning size={16} color="#ef4444" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#fca5a5' }}>
              Missing Protective Clauses ({missing_clauses.length})
            </span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {missing_clauses.map((clause, i) => (
              <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span>
                <span>{clause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Favorable Terms Checklist */}
      {favorable_terms && favorable_terms.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#6ee7b7' }}>
              Favorable / Standard Terms
            </span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {favorable_terms.map((term, i) => (
              <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} color="#10b981" />
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
