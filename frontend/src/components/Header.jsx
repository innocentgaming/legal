import React from 'react';
import { Scale, ShieldCheck, Sparkles, FileText, Download, RefreshCw, Cpu } from 'lucide-react';

export default function Header({ 
  metadata, 
  analysis, 
  systemStatus, 
  onLoadSample, 
  onTriggerAnalysis, 
  isAnalyzing,
  onReset 
}) {
  const riskScore = analysis?.overall_risk_score;

  const getRiskBadge = () => {
    if (riskScore === undefined || riskScore === null) return null;
    if (riskScore >= 65) {
      return <span className="badge-high">Risk Score: {riskScore}/100 • Critical</span>;
    }
    if (riskScore >= 40) {
      return <span className="badge-med">Risk Score: {riskScore}/100 • Moderate</span>;
    }
    return <span className="badge-low">Risk Score: {riskScore}/100 • Low Risk</span>;
  };

  const handleExportSummary = () => {
    if (!metadata) return;
    const report = {
      timestamp: new Date().toISOString(),
      metadata,
      risk_audit: analysis || "Not audited yet",
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CLARITY_Audit_${metadata.filename.replace(/\.[^/.]+$/, "")}.json`;
    a.click();
  };

  return (
    <header className="glass-panel" style={{
      margin: '16px 20px 0 20px',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
        }}>
          <Scale size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              CLARITY
            </h1>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(99, 102, 241, 0.4)'
            }}>
              AI Legal Co-Pilot
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Contract Risk Intelligence • Clause Redlining • Grounded Legal RAG
          </p>
        </div>
      </div>

      {/* Active Document Status Pill */}
      {metadata ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <FileText size={16} color="#818cf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metadata.filename}
          </span>
          <span className="badge-neutral" style={{ fontSize: '0.7rem' }}>
            {metadata.clause_count} Clauses • {metadata.file_type?.toUpperCase()}
          </span>
          {getRiskBadge()}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-dim)',
          fontSize: '0.8rem'
        }}>
          <ShieldCheck size={16} />
          <span>No Document Loaded</span>
        </div>
      )}

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Sample Selector Dropdown */}
        <select 
          onChange={(e) => {
            if (e.target.value) onLoadSample(e.target.value);
            e.target.value = "";
          }}
          className="btn-secondary"
          style={{ padding: '7px 12px', fontSize: '0.8rem', background: '#1e293b' }}
          defaultValue=""
        >
          <option value="" disabled>📂 Load Benchmark Sample</option>
          <option value="saas-msa">Enterprise SaaS MSA (High Risk)</option>
          <option value="mutual-nda">Mutual NDA (Standard)</option>
          <option value="employment-ip">IP Assignment Agreement</option>
        </select>

        {metadata && (
          <>
            <button 
              onClick={onTriggerAnalysis} 
              disabled={isAnalyzing}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            >
              <Sparkles size={15} />
              {isAnalyzing ? "Auditing..." : (analysis ? "Re-Audit Risk" : "Run AI Risk Audit")}
            </button>

            <button 
              onClick={handleExportSummary} 
              className="btn-secondary"
              title="Export Legal Audit JSON"
              style={{ padding: '7px 10px' }}
            >
              <Download size={15} />
            </button>

            <button 
              onClick={onReset} 
              className="btn-secondary"
              title="Close Document"
              style={{ padding: '7px 10px' }}
            >
              <RefreshCw size={15} />
            </button>
          </>
        )}

        {/* Engine status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-dim)'
        }}>
          <Cpu size={13} color={systemStatus?.has_gemini_key || systemStatus?.has_openai_key ? "#10b981" : "#06b6d4"} />
          <span>{systemStatus?.active_llm_provider || "In-Memory Engine"}</span>
        </div>
      </div>
    </header>
  );
}
