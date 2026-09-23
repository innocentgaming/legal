import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, Copy, Check, Scale, ArrowRightLeft, FileCode2 } from 'lucide-react';
import { comparisonService } from '../services/contractService';
import { LoadingState } from '../components/LoadingState';

export default function ComparisonPage({
  document,
  clauses,
  selectedClause,
}) {
  const [activeTab, setActiveTab] = useState('clause'); // 'clause' | 'document'
  
  // Clause Redline state
  const [activeClause, setActiveClause] = useState(selectedClause || (clauses && clauses[0]) || null);
  const [instructions, setInstructions] = useState('Make this clause mutual, balanced, with aggregate liability cap and reasonable cure periods.');
  const [redlineResult, setRedlineResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Document Comparison state
  const [docTextA, setDocTextA] = useState(document?.raw_text || (clauses ? clauses.map(c => c.text).join('\n\n') : ''));
  const [docTextB, setDocTextB] = useState('');
  const [docCompareResult, setDocCompareResult] = useState(null);
  const [isComparingDocs, setIsComparingDocs] = useState(false);

  useEffect(() => {
    if (selectedClause) {
      setActiveClause(selectedClause);
    } else if (clauses && clauses.length > 0 && !activeClause) {
      setActiveClause(clauses[0]);
    }
  }, [selectedClause, clauses]);

  const handleGenerateRedline = async () => {
    if (!activeClause) return;
    setIsGenerating(true);
    try {
      const data = await comparisonService.redlineClause(
        activeClause.text || activeClause.flagged_text,
        activeClause.category || activeClause.risk_category || 'General Legal Terms',
        instructions,
        activeClause.id || activeClause.clause_id
      );
      setRedlineResult(data);
    } catch (err) {
      alert(`Redline failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompareDocs = async () => {
    if (!docTextA.trim() || !docTextB.trim()) {
      alert('Please provide text for both Version A and Version B.');
      return;
    }
    setIsComparingDocs(true);
    try {
      const data = await comparisonService.compareDocuments(docTextA, docTextB, 'Version A', 'Version B (Redline)');
      setDocCompareResult(data);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsComparingDocs(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '16px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Navigation Mode Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={20} color="#818cf8" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Comparison & Redlining</h2>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('clause')}
            className={activeTab === 'clause' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <Scale size={14} />
            <span>Clause Redlining</span>
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={activeTab === 'document' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <FileCode2 size={14} />
            <span>Multi-Version Document Diff</span>
          </button>
        </div>
      </div>

      {activeTab === 'clause' ? (
        /* Clause Redlining View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Controls Header */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Select Clause to Redline:</span>
              <select
                value={activeClause?.id || ''}
                onChange={(e) => {
                  const found = (clauses || []).find((c) => c.id === e.target.value);
                  if (found) setActiveClause(found);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', maxWidth: '280px' }}
              >
                {(clauses || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.clause_index}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Text */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 12px',
              borderRadius: '6px',
              maxHeight: '100px',
              overflowY: 'auto',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: '1.45',
            }}>
              {activeClause?.text || 'No clause selected.'}
            </div>

            {/* Objective input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Negotiation goals, e.g. add 12-month cap, mutual indemnity..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleGenerateRedline}
                disabled={isGenerating || !activeClause}
                className="btn-primary"
                style={{ padding: '0 16px', fontSize: '0.8rem' }}
              >
                <Sparkles size={14} />
                <span>{isGenerating ? 'Drafting...' : 'Generate Redline'}</span>
              </button>
            </div>
          </div>

          {/* Redline Output */}
          {isGenerating ? (
            <LoadingState message="Drafting balanced counter-language & legal rationale..." />
          ) : redlineResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Diff Tokens View */}
              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc' }}>
                    Visual Redline Diff
                  </span>
                  <button
                    onClick={() => handleCopy(redlineResult.proposed_revision)}
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px', color: '#6ee7b7' }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy Counter-Language'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.84rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {redlineResult.diff_tokens && redlineResult.diff_tokens.length > 0 ? (
                    redlineResult.diff_tokens.map((token, i) => {
                      if (token.type === 'delete') return <span key={i} className="diff-del">{token.text} </span>;
                      if (token.type === 'insert') return <span key={i} className="diff-ins">{token.text} </span>;
                      return <span key={i}>{token.text} </span>;
                    })
                  ) : (
                    <span>{redlineResult.proposed_revision}</span>
                  )}
                </div>
              </div>

              {/* Rationale and mitigation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-panel" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '4px' }}>
                    Legal Rationale
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    {redlineResult.explanation}
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6ee7b7', marginBottom: '4px' }}>
                    Risk Mitigation
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#a7f3d0', lineHeight: '1.4' }}>
                    {redlineResult.risk_mitigation}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Multi-Version Document Diff View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Version A (Baseline Document):</span>
              <textarea
                value={docTextA}
                onChange={(e) => setDocTextA(e.target.value)}
                placeholder="Paste Version A text..."
                style={{
                  height: '180px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Version B (Counter-Proposal / Vendor Edit):</span>
              <textarea
                value={docTextB}
                onChange={(e) => setDocTextB(e.target.value)}
                placeholder="Paste Version B text..."
                style={{
                  height: '180px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleCompareDocs}
            disabled={isComparingDocs}
            className="btn-primary"
            style={{ alignSelf: 'center', padding: '8px 24px' }}
          >
            <ArrowRightLeft size={15} />
            <span>{isComparingDocs ? 'Comparing...' : 'Run Full Document Comparison'}</span>
          </button>

          {/* Document Comparison Result */}
          {docCompareResult && (
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Similarity Score: {docCompareResult.similarity_score}%
                </span>
                <span className="badge-med">
                  {docCompareResult.total_differences} Differences Detected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {docCompareResult.clause_diffs.map((diff, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                        Section {diff.section}: {diff.title}
                      </span>
                      <span className={diff.status === 'Identical' ? 'badge-low' : (diff.status === 'Modified' ? 'badge-med' : 'badge-high')}>
                        {diff.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
