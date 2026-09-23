import React, { useState, useEffect } from 'react';
import { Sparkles, FileCode2, Copy, Check, ArrowRightLeft, ShieldCheck, Scale, RefreshCw } from 'lucide-react';

export default function RedlineViewer({ 
  selectedClause, 
  chunks, 
  onGenerateRedline, 
  redlineResult, 
  isGenerating 
}) {
  const [activeClause, setActiveClause] = useState(selectedClause || null);
  const [instructions, setInstructions] = useState("Make this clause mutual, balanced, and standard for enterprise software agreements.");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedClause) {
      setActiveClause(selectedClause);
    } else if (chunks && chunks.length > 0 && !activeClause) {
      setActiveClause(chunks[0]);
    }
  }, [selectedClause, chunks]);

  const handleRunRedline = () => {
    if (!activeClause) return;
    onGenerateRedline({
      clause_id: activeClause.id || activeClause.clause_id,
      clause_text: activeClause.text || activeClause.flagged_text,
      category: activeClause.category || activeClause.risk_category || "General Legal Terms",
      instructions: instructions
    });
  };

  const handleCopyRevision = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Clause Selector Header */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clause Redline & Revisor
            </span>
          </div>

          {/* Quick clause chooser dropdown */}
          <select
            value={activeClause?.id || ""}
            onChange={(e) => {
              const found = (chunks || []).find(c => c.id === e.target.value);
              if (found) setActiveClause(found);
            }}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.78rem', maxWidth: '240px' }}
          >
            {(chunks || []).map(c => (
              <option key={c.id} value={c.id}>
                #{c.clause_index}: {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Clause Text Box */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '10px 12px',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px', fontWeight: 600 }}>
            CURRENT CLAUSE TEXT ({activeClause?.title || "Selected Section"}):
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
            {activeClause?.text || activeClause?.flagged_text || "No clause selected."}
          </p>
        </div>

        {/* Negotiation Goal / Custom Prompt */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Negotiation Objectives / Redline Instructions:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Insert 12-month liability cap, mutual indemnity, 30-day cure period..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleRunRedline}
              disabled={isGenerating || !activeClause}
              className="btn-primary"
              style={{ padding: '0 14px', fontSize: '0.8rem' }}
            >
              <Sparkles size={14} />
              <span>{isGenerating ? "Drafting..." : "Generate Redline"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Redline Output Display */}
      {redlineResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Side by Side Diff */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {/* Original */}
            <div className="glass-panel" style={{ padding: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#fca5a5', marginBottom: '8px' }}>
                Original Language (Flagged)
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                {redlineResult.original_text}
              </p>
            </div>

            {/* Proposed Revision */}
            <div className="glass-panel" style={{ padding: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6ee7b7' }}>
                  Proposed Counter-Language
                </div>
                <button
                  onClick={() => handleCopyRevision(redlineResult.proposed_revision)}
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#6ee7b7' }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy Clause"}</span>
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#f8fafc', lineHeight: '1.45', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                {redlineResult.proposed_revision}
              </p>
            </div>
          </div>

          {/* Legal Rationale & Risk Mitigation */}
          <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.05em' }}>
              Legal Rationale & Leverage Analysis
            </div>
            
            {redlineResult.explanation && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                <strong>Why this change:</strong> {redlineResult.explanation}
              </p>
            )}

            {redlineResult.risk_mitigation && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#a7f3d0'
              }}>
                <strong>Risk Mitigation:</strong> {redlineResult.risk_mitigation}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <ArrowRightLeft size={32} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Ready to Redline
          </h4>
          <p style={{ fontSize: '0.8rem', maxWidth: '320px', margin: '0 auto' }}>
            Select any clause from the left document viewer or click "Generate Redline" to draft balanced negotiation language.
          </p>
        </div>
      )}
    </div>
  );
}
