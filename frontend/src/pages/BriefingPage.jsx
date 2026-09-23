import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Download, 
  Printer, 
  Check, 
  Copy, 
  Clock, 
  ShieldAlert, 
  HelpCircle, 
  Scale, 
  Layers, 
  Info
} from 'lucide-react';
import { briefingService } from '../services/contractService';
import { LoadingState } from '../components/LoadingState';

import { ROUTES } from '../types/constants';

export default function BriefingPage({ document, onNavigate, onLoadSample }) {
  const [targetRole, setTargetRole] = useState('General Counsel');
  const [briefingData, setBriefingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  const handleGenerateBriefing = useCallback(async () => {
    if (!document) return;
    setLoading(true);
    try {
      const data = await briefingService.generateBriefing(targetRole);
      // Backend returns { status: "success", briefing: { ... }, disclaimer: "..." }
      setBriefingData(data.briefing || data);
    } catch (err) {
      alert(`Failed to generate briefing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [document, targetRole]);

  useEffect(() => {
    if (document && !briefingData) {
      handleGenerateBriefing();
    }
  }, [document, briefingData, handleGenerateBriefing]);

  const handleExportMarkdown = () => {
    if (!briefingData) return;
    const md = briefingData.markdown_content || '# Lawyer Briefing';
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lawyer_Briefing_${document?.filename || 'contract'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    if (!briefingData?.markdown_content) return;
    navigator.clipboard.writeText(briefingData.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (!document) {
    return (
      <main 
        role="main"
        aria-label="Lawyer Briefing Preparation"
        style={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto',
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
          <Briefcase size={28} color="#818cf8" aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
          Lawyer Consultation Briefing
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.55', marginBottom: '24px' }}>
          Generate a structured, 10-section briefing dossier for your legal counsel with exact clause citations, negotiation levers, and targeted questions before your consultation.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
          {onNavigate && (
            <button 
              onClick={() => onNavigate(ROUTES.UPLOAD)} 
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <span>Upload Your Contract</span>
            </button>
          )}

          {onLoadSample && (
            <>
              <button 
                onClick={() => onLoadSample('saas-msa')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
              >
                <Sparkles size={16} color="#818cf8" aria-hidden="true" />
                <span>Test with SaaS MSA Sample</span>
              </button>
              <button 
                onClick={() => onLoadSample('mutual-nda')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
              >
                <Sparkles size={16} color="#818cf8" aria-hidden="true" />
                <span>Test with Mutual NDA Sample</span>
              </button>
            </>
          )}
        </div>

        <div className="glass-panel" style={{
          padding: '16px 20px',
          width: '100%',
          textAlign: 'left',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            What’s in the 10-Section Dossier:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>✓ Executive Summary</div>
            <div>✓ Critical Red Flags</div>
            <div>✓ Questions for Counsel</div>
            <div>✓ Negotiation Levers</div>
            <div>✓ Missing Clauses</div>
            <div>✓ Exact Clause Citations</div>
            <div>✓ Favorable Terms</div>
            <div>✓ Markdown & PDF Export</div>
          </div>
        </div>
      </main>
    );
  }

  const b = briefingData;

  return (
    <div style={{
      maxWidth: '1180px',
      margin: '14px auto',
      padding: '0 20px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: 'calc(100vh - 84px)',
      overflowY: 'auto'
    }}>
      {/* Top Header & Export Action Controls (Hidden during print) */}
      <div className="glass-panel no-print" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <Briefcase size={20} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Prepare for My Lawyer — 1-Page Briefing
            </h2>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Document: <strong>{document.filename}</strong> • Structured with citations for your consultation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '6px 10px' }}
          >
            <option value="General Counsel">General Counsel</option>
            <option value="Outside Commercial Counsel">Outside Commercial Counsel</option>
            <option value="Procurement & Negotiation Lead">Procurement Lead</option>
            <option value="Founder / Executive">Founder / Executive</option>
          </select>

          <button onClick={handleGenerateBriefing} disabled={loading} className="btn-primary" style={{ fontSize: '0.76rem', padding: '6px 14px' }}>
            <Sparkles size={13} />
            <span>Regenerate</span>
          </button>

          {b && (
            <>
              <button onClick={handleCopyMarkdown} className="btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 10px' }}>
                {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy MD'}</span>
              </button>

              <button onClick={handleExportMarkdown} className="btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 10px' }}>
                <Download size={13} />
                <span>Export .MD</span>
              </button>

              <button onClick={handlePrintPDF} className="btn-secondary" style={{ fontSize: '0.76rem', padding: '6px 10px', color: '#60a5fa' }}>
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#c7d2fe',
        fontSize: '0.78rem',
        fontWeight: 600,
        lineHeight: '1.4'
      }}>
        <Info size={16} color="#818cf8" style={{ flexShrink: 0 }} />
        <span>
          <strong>DISCLAIMER:</strong> {b?.disclaimer || "Clarity provides document understanding and preparation support. It is not a substitute for professional legal advice."}
        </span>
      </div>

      {/* Main Briefing Body */}
      {loading ? (
        <LoadingState message="Synthesizing 10-section lawyer preparation briefing with exact citations..." size="large" />
      ) : b ? (
        <div ref={printRef} className="printable-briefing" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* SECTION 1: Document Overview */}
          {b.section_1_overview && (
            <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#a5b4fc', margin: 0 }}>
                  1. Document Overview
                </h3>
                <span className="badge-low">{b.section_1_overview.contract_type}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px', fontSize: '0.78rem' }}>
                <div><strong>Target File:</strong> {b.section_1_overview.filename}</div>
                <div><strong>Parties:</strong> {b.section_1_overview.parties_detected?.join(' & ') || 'Not specified'}</div>
                <div><strong>Term / Duration:</strong> {b.section_1_overview.effective_term}</div>
                <div><strong>Total Clauses:</strong> {b.section_1_overview.total_clauses_analyzed}</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                {b.section_1_overview.summary_paragraph}
              </p>
            </div>
          )}

          {/* SECTION 2: Key Clauses */}
          {b.section_2_key_clauses && (
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#6ee7b7', marginBottom: '10px' }}>
                2. Key Clauses ({b.section_2_key_clauses.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {b.section_2_key_clauses.map((k, idx) => (
                  <div key={idx} style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6ee7b7' }}>
                        Clause {k.clause_number}: {k.title}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        {k.source_citation}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                      {k.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: High-Risk / Worth-Noting Clauses */}
          {b.section_3_risk_clauses && (
            <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <ShieldAlert size={16} color="#ef4444" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#fca5a5', margin: 0 }}>
                  3. High-Risk & Worth-Noting Clauses ({b.section_3_risk_clauses.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {b.section_3_risk_clauses.map((r, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5' }}>
                        Clause {r.clause_number}: {r.title}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className={r.risk_level === 'HIGH_RISK' ? 'badge-high' : 'badge-med'}>{r.risk_level}</span>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>{r.source_citation}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: '1.4', marginBottom: '4px' }}>
                      <strong>Issue:</strong> {r.reason}
                    </div>
                    {r.evidence && (
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                        "{r.evidence}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2-Column Grid for Sections 4 & 5 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* SECTION 4: Open Questions */}
            {b.section_4_open_questions && (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <HelpCircle size={15} color="#818cf8" />
                  <h3 style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: '#a5b4fc', margin: 0 }}>
                    4. Open Questions & Missing Terms
                  </h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {b.section_4_open_questions.map((q, idx) => (
                    <li key={idx} style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#818cf8', fontWeight: 700 }}>•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION 5: Important Deadlines */}
            {b.section_5_deadlines && (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Clock size={15} color="#fbbf24" />
                  <h3 style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24', margin: 0 }}>
                    5. Important Deadlines & Timeframes
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {b.section_5_deadlines.map((d, idx) => (
                    <div key={idx} style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fbbf24' }}>
                        <span>{d.action}</span>
                        <span>{d.timeframe}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        {d.impact} ({d.source_citation})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2-Column Grid for Sections 6 & 7 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* SECTION 6: Key Obligations */}
            {b.section_6_obligations && (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: '#60a5fa', marginBottom: '10px' }}>
                  6. Key Obligations ({b.section_6_obligations.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {b.section_6_obligations.map((o, idx) => (
                    <div key={idx} style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{o.duty}</div>
                      <div style={{ color: '#93c5fd', fontSize: '0.68rem', marginTop: '2px' }}>
                        [{o.source_citation}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: Key Rights */}
            {b.section_7_rights && (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa', marginBottom: '10px' }}>
                  7. Key Rights & Entitlements ({b.section_7_rights.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {b.section_7_rights.map((r, idx) => (
                    <div key={idx} style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.2)', fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{r.entitlement}</div>
                      <div style={{ color: '#c4b5fd', fontSize: '0.68rem', marginTop: '2px' }}>
                        [{r.source_citation}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: Potential Negotiation Points */}
          {b.section_8_negotiation_points && (
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#6ee7b7', marginBottom: '10px' }}>
                8. Potential Negotiation Points ({b.section_8_negotiation_points.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {b.section_8_negotiation_points.map((np, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ color: '#6ee7b7' }}>{np.topic}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{np.source_citation}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '3px' }}>Current: {np.current_clause_state}</div>
                    <div style={{ color: '#e0e7ff', fontWeight: 600 }}>
                      👉 {np.suggested_discussion_point}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 9: Questions to Ask a Lawyer */}
          {b.section_9_lawyer_questions && (
            <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Scale size={16} color="#818cf8" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: '#c7d2fe', margin: 0 }}>
                  9. Questions to Ask Your Lawyer ({b.section_9_lawyer_questions.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {b.section_9_lawyer_questions.map((lq, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                      {lq.category} • {lq.relevant_clause}
                    </div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                      "{lq.question}"
                    </p>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Context: {lq.context}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: Document Comparison Findings */}
          {b.section_10_comparison_findings && (
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} color="#a78bfa" />
                  <h3 style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', color: '#c4b5fd', margin: 0 }}>
                    10. Document Comparison Findings
                  </h3>
                </div>
                {b.section_10_comparison_findings.comparison_performed && (
                  <span className="badge-low">{b.section_10_comparison_findings.similarity_score}% Similar</span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.45', margin: 0 }}>
                {b.section_10_comparison_findings.key_differences_summary}
              </p>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
