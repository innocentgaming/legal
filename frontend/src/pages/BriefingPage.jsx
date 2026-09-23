import React, { useState, useEffect } from 'react';
import { Briefcase, Sparkles, CheckCircle2, AlertOctagon, Download, UserCheck } from 'lucide-react';
import { briefingService } from '../services/contractService';
import { LoadingState } from '../components/LoadingState';

export default function BriefingPage({ document, clauses }) {
  const [targetRole, setTargetRole] = useState('General Counsel');
  const [briefingData, setBriefingData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document && !briefingData) {
      handleGenerateBriefing();
    }
  }, [document]);

  const handleGenerateBriefing = async () => {
    if (!document) return;
    setLoading(true);
    try {
      const data = await briefingService.generateBriefing(targetRole);
      setBriefingData(data);
    } catch (err) {
      alert(`Failed to generate briefing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBriefing = () => {
    if (!briefingData) return;
    const blob = new Blob([JSON.stringify(briefingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lawyer_Briefing_${document?.filename || 'contract'}.json`;
    a.click();
  };

  if (!document) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No Document Ingested</h3>
        <p style={{ color: 'var(--text-muted)' }}>Please upload a contract to generate a lawyer briefing.</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '960px',
      margin: '16px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Header controls */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Briefcase size={22} color="#818cf8" />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Lawyer Executive Briefing</h2>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Target Document: <strong>{document.filename}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <option value="General Counsel">General Counsel</option>
            <option value="Procurement Lead">Procurement Lead</option>
            <option value="C-Suite Executive">C-Suite Executive</option>
          </select>

          <button onClick={handleGenerateBriefing} disabled={loading} className="btn-primary" style={{ fontSize: '0.78rem' }}>
            <Sparkles size={13} />
            <span>Regenerate</span>
          </button>

          {briefingData && (
            <button onClick={handleExportBriefing} className="btn-secondary" style={{ fontSize: '0.78rem' }}>
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Synthesizing deal-breaker risks & negotiation action checklist..." size="large" />
      ) : briefingData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Executive Summary */}
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '4px' }}>
              Strategic Executive Summary
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              {briefingData.executive_summary}
            </p>
          </div>

          {/* Deal Breaker Risks */}
          <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertOctagon size={16} color="#ef4444" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#fca5a5' }}>
                Deal-Breaker Risk Exposures ({briefingData.deal_breaker_risks.length})
              </span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {briefingData.deal_breaker_risks.map((risk, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Negotiation Strategy */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6ee7b7', marginBottom: '8px' }}>
              Recommended Negotiation Strategy
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {briefingData.negotiation_strategy.map((step, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '10px' }}>
              Action Item Checklist ({briefingData.action_items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {briefingData.action_items.map((item, i) => (
                <div key={i} className="glass-panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={item.priority === 'Critical' ? 'badge-high' : 'badge-med'}>
                      {item.priority}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {item.clause_ref}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.action}</p>
                  {item.suggested_language && (
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                      <strong>Suggested Counter-Text:</strong> "{item.suggested_language}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
