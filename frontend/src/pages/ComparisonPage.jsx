import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  Copy, 
  Check, 
  Scale, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  Eye, 
  X, 
  BookOpen, 
  Info
} from 'lucide-react';
import { comparisonService } from '../services/contractService';
import { LoadingState } from '../components/LoadingState';

// Pre-packaged comparison benchmarks
const BENCHMARK_PAIRS = [
  {
    id: 'msa_benchmark',
    title: 'Enterprise MSA: Balanced vs Vendor-Aggressive',
    labelA: 'Standard Balanced MSA (v1.0)',
    labelB: 'Vendor Counter-Proposal (v2.0)',
    docA: `MASTER SERVICES AGREEMENT

1. SERVICES AND DELIVERABLES
Provider shall deliver cloud architecture consulting services to Customer in accordance with attached Statements of Work.

2. INDEMNIFICATION
Each party shall defend, indemnify and hold harmless the other party from and against any third-party claims arising from gross negligence or intentional misconduct.

3. LIMITATION OF LIABILITY
In no event shall either party's aggregate liability exceed the total fees paid under this agreement in the prior twelve (12) months. Neither party shall be liable for indirect or consequential damages.

4. TERMINATION FOR CONVENIENCE
Either party may terminate this agreement for convenience upon thirty (30) days prior written notice.

5. EXPRESS WARRANTIES
Provider warrants that all professional services will be performed in a timely, professional, and workmanlike manner in compliance with industry standards.`,
    docB: `AMENDED MASTER SERVICES AGREEMENT

1. SERVICES AND DELIVERABLES
Provider shall deliver cloud architecture consulting services to Customer in accordance with attached Statements of Work.

2. TERMINATION FOR CONVENIENCE
Either party may terminate this agreement for convenience upon ten (10) days prior written notice without cause.

3. LIMITATION OF LIABILITY
Customer agrees that Provider's liability is completely excluded, and Customer liability under this agreement shall be unlimited.

4. INDEMNIFICATION
Customer shall defend, indemnify and hold harmless Provider from all third-party claims, lawsuits, and regulatory penalties.

5. MANDATORY ARBITRATION
All disputes arising under this agreement shall be settled through binding confidential arbitration in New York City.`
  },
  {
    id: 'nda_benchmark',
    title: 'Non-Disclosure: Mutual NDA vs Unilateral NDA',
    labelA: 'Mutual NDA (Standard)',
    labelB: 'Unilateral NDA (Discloser-Only)',
    docA: `MUTUAL NON-DISCLOSURE AGREEMENT

1. CONFIDENTIALITY OBLIGATIONS
Each receiving party shall protect the disclosing party's confidential information with the same degree of care it uses for its own proprietary information, but no less than reasonable care.

2. PERMITTED DISCLOSURES
A party may disclose confidential information to its employees and contractors who need to know and are bound by confidentiality terms at least as restrictive as this Agreement.

3. TERM AND SURVIVAL
This Agreement shall remain in effect for three (3) years from the Effective Date. Confidentiality obligations shall survive for two (2) years following termination.`,
    docB: `CONFIDENTIALITY AGREEMENT

1. CONFIDENTIALITY OBLIGATIONS
Recipient shall hold all Proprietary Information disclosed by Company in strictest confidence and shall not disclose it to any third party without prior written authorization.

2. PERMITTED DISCLOSURES
Recipient may disclose Proprietary Information only to its direct officers who have executed individual confidentiality undertakings approved in advance by Company.

3. TERM AND SURVIVAL
This Agreement shall remain in effect indefinitely. Recipient's non-disclosure duties shall survive in perpetuity.`
  }
];

export default function ComparisonPage({
  document,
  clauses,
  selectedClause,
}) {
  const [activeTab, setActiveTab] = useState('two_doc'); // 'two_doc' | 'clause'
  
  // Two-Document Comparison state
  const [docTextA, setDocTextA] = useState(
    document?.raw_text || (clauses ? clauses.map(c => c.text || c.original_text).join('\n\n') : BENCHMARK_PAIRS[0].docA)
  );
  const [docTextB, setDocTextB] = useState(BENCHMARK_PAIRS[0].docB);
  const [labelA, setLabelA] = useState(BENCHMARK_PAIRS[0].labelA);
  const [labelB, setLabelB] = useState(BENCHMARK_PAIRS[0].labelB);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'MODIFIED' | 'ADDED' | 'REMOVED' | 'MATCH'
  const [inspectedClause, setInspectedClause] = useState(null);

  // Client-side comparison cache
  const comparisonCacheRef = useRef({});

  // Clause Redline state
  const [activeClause, setActiveClause] = useState(() => selectedClause || (clauses && clauses[0]) || null);
  const [instructions, setInstructions] = useState('Make this clause mutual, balanced, with aggregate liability cap and reasonable cure periods.');
  const [redlineResult, setRedlineResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const runTwoDocComparison = useCallback(async (textA, textB, lA, lB) => {
    if (!textA.trim() || !textB.trim()) {
      alert('Please provide text for both Document A and Document B.');
      return;
    }
    const cacheKey = `${textA.slice(0, 100)}_${textB.slice(0, 100)}_${lA}_${lB}`;
    if (comparisonCacheRef.current[cacheKey]) {
      setComparisonResult(comparisonCacheRef.current[cacheKey]);
      return;
    }
    setIsComparing(true);
    try {
      const data = await comparisonService.compareDocuments(textA, textB, lA, lB);
      comparisonCacheRef.current[cacheKey] = data;
      setComparisonResult(data);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClause) {
      setActiveClause(selectedClause);
    }
  }, [selectedClause]);

  // Run initial benchmark comparison on mount
  useEffect(() => {
    if (!comparisonResult && docTextA && docTextB) {
      runTwoDocComparison(docTextA, docTextB, labelA, labelB);
    }
  }, [comparisonResult, docTextA, docTextB, labelA, labelB, runTwoDocComparison]);

  const handleLoadBenchmark = useCallback((pair) => {
    setDocTextA(pair.docA);
    setDocTextB(pair.docB);
    setLabelA(pair.labelA);
    setLabelB(pair.labelB);
    runTwoDocComparison(pair.docA, pair.docB, pair.labelA, pair.labelB);
  }, [runTwoDocComparison]);

  const handleGenerateRedline = useCallback(async () => {
    if (!activeClause) return;
    setIsGenerating(true);
    try {
      const data = await comparisonService.redlineClause(
        activeClause.text || activeClause.original_text || activeClause.flagged_text,
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
  }, [activeClause, instructions]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const filteredPairs = useMemo(() => {
    if (!comparisonResult?.clause_pairs) return [];
    if (filterType === 'ALL') return comparisonResult.clause_pairs;
    return comparisonResult.clause_pairs.filter((pair) => pair.difference_type === filterType);
  }, [comparisonResult, filterType]);

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '14px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      height: 'calc(100vh - 84px)',
      overflowY: 'auto'
    }}>
      {/* Top Header & Tab Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <GitCompare size={20} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Two-Document Comparison & Redline
            </h2>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Semantic clause alignment, difference detection (Match, Modified, Added, Removed), and objective legal analysis.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('two_doc')}
            className={activeTab === 'two_doc' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <ArrowRightLeft size={14} />
            <span>Two-Document Diff</span>
          </button>
          <button
            onClick={() => setActiveTab('clause')}
            className={activeTab === 'clause' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <Scale size={14} />
            <span>Clause Redlining</span>
          </button>
        </div>
      </div>

      {activeTab === 'two_doc' ? (
        /* Phase 6 Two-Document Comparison View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Preset Benchmark Selector & Input Collapsible */}
          <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={15} color="#818cf8" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Comparison Sample Presets:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {BENCHMARK_PAIRS.map((bp) => (
                  <button
                    key={bp.id}
                    onClick={() => handleLoadBenchmark(bp)}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    <span>{bp.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-Side Input Areas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Doc A Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <input
                    type="text"
                    value={labelA}
                    onChange={(e) => setLabelA(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed var(--border-subtle)',
                      color: '#60a5fa',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      outline: 'none',
                      padding: '2px 4px'
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>LEFT (Doc A)</span>
                </div>
                <textarea
                  value={docTextA}
                  onChange={(e) => setDocTextA(e.target.value)}
                  placeholder="Paste Document A contract text..."
                  style={{
                    height: '110px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Doc B Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <input
                    type="text"
                    value={labelB}
                    onChange={(e) => setLabelB(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed var(--border-subtle)',
                      color: '#a78bfa',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      outline: 'none',
                      padding: '2px 4px'
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RIGHT (Doc B)</span>
                </div>
                <textarea
                  value={docTextB}
                  onChange={(e) => setDocTextB(e.target.value)}
                  placeholder="Paste Document B contract text..."
                  style={{
                    height: '110px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Run Comparison Trigger */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => runTwoDocComparison(docTextA, docTextB, labelA, labelB)}
                disabled={isComparing}
                className="btn-primary"
                style={{ padding: '7px 24px', fontSize: '0.8rem' }}
              >
                <ArrowRightLeft size={14} />
                <span>{isComparing ? 'Aligning Clauses & Computing Diff...' : 'Run Semantic Two-Document Comparison'}</span>
              </button>
            </div>
          </div>

          {/* Results Area */}
          {isComparing ? (
            <LoadingState message="Semantically aligning clauses, classifying differences, and generating objective explanations..." />
          ) : comparisonResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Summary Metrics Bar */}
              <div className="glass-panel" style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#c7d2fe',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {comparisonResult.summary?.similarity_score || 0}% Semantic Alignment
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {comparisonResult.summary?.total_pairs || 0} total clause provisions analyzed
                  </span>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  >
                    All ({comparisonResult.summary?.total_pairs || 0})
                  </button>
                  <button
                    onClick={() => setFilterType('MODIFIED')}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: filterType === 'MODIFIED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24'
                    }}
                  >
                    <AlertTriangle size={11} />
                    <span>Modified ({comparisonResult.summary?.modified_count || 0})</span>
                  </button>
                  <button
                    onClick={() => setFilterType('ADDED')}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: filterType === 'ADDED' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa'
                    }}
                  >
                    <PlusCircle size={11} />
                    <span>Added ({comparisonResult.summary?.added_count || 0})</span>
                  </button>
                  <button
                    onClick={() => setFilterType('REMOVED')}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: filterType === 'REMOVED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#f87171'
                    }}
                  >
                    <MinusCircle size={11} />
                    <span>Removed ({comparisonResult.summary?.removed_count || 0})</span>
                  </button>
                  <button
                    onClick={() => setFilterType('MATCH')}
                    className="btn-secondary"
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 8px',
                      background: filterType === 'MATCH' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      color: '#34d399'
                    }}
                  >
                    <CheckCircle2 size={11} />
                    <span>Match ({comparisonResult.summary?.matches_count || 0})</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Clause Alignment Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredPairs.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No clause pairs found matching the selected filter ({filterType}).
                  </div>
                ) : (
                  filteredPairs.map((pair, idx) => {
                    const ca = pair.document_a_clause;
                    const cb = pair.document_b_clause;
                    const dtype = pair.difference_type;

                    let badgeColor = '#34d399';
                    let badgeBg = 'rgba(16, 185, 129, 0.15)';
                    let badgeBorder = 'rgba(16, 185, 129, 0.35)';
                    let BadgeIcon = CheckCircle2;

                    if (dtype === 'MODIFIED') {
                      badgeColor = '#fbbf24';
                      badgeBg = 'rgba(245, 158, 11, 0.15)';
                      badgeBorder = 'rgba(245, 158, 11, 0.35)';
                      BadgeIcon = AlertTriangle;
                    } else if (dtype === 'ADDED') {
                      badgeColor = '#60a5fa';
                      badgeBg = 'rgba(59, 130, 246, 0.15)';
                      badgeBorder = 'rgba(59, 130, 246, 0.35)';
                      BadgeIcon = PlusCircle;
                    } else if (dtype === 'REMOVED') {
                      badgeColor = '#f87171';
                      badgeBg = 'rgba(239, 68, 68, 0.15)';
                      badgeBorder = 'rgba(239, 68, 68, 0.35)';
                      BadgeIcon = MinusCircle;
                    }

                    return (
                      <div
                        key={idx}
                        className="glass-panel"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          borderLeft: `4px solid ${badgeColor}`
                        }}
                      >
                        {/* Card Header with Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: badgeBg,
                              border: `1px solid ${badgeBorder}`,
                              color: badgeColor,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              <BadgeIcon size={12} />
                              <span>{dtype}</span>
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {ca?.title || cb?.title || `Clause Pair ${idx+1}`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {pair.similarity > 0 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                Similarity: {Math.round(pair.similarity * 100)}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Two-Column Side-by-Side Clauses */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {/* LEFT: Document A */}
                          <div style={{
                            padding: '10px',
                            borderRadius: '6px',
                            background: ca ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa' }}>
                                {labelA || 'Document A'} {ca?.clause_number ? `(Clause ${ca.clause_number})` : ''}
                              </span>
                              {ca && (
                                <button
                                  onClick={() => setInspectedClause({ ...ca, sourceLabel: labelA })}
                                  className="btn-secondary"
                                  style={{ padding: '1px 6px', fontSize: '0.65rem' }}
                                >
                                  <Eye size={10} />
                                  <span>Inspect</span>
                                </button>
                              )}
                            </div>
                            <p style={{
                              fontSize: '0.76rem',
                              color: ca ? 'var(--text-main)' : 'var(--text-dim)',
                              lineHeight: '1.45',
                              margin: 0,
                              fontStyle: ca ? 'normal' : 'italic'
                            }}>
                              {ca ? ca.original_text : '[Clause omitted / not present in Document A]'}
                            </p>
                          </div>

                          {/* RIGHT: Document B */}
                          <div style={{
                            padding: '10px',
                            borderRadius: '6px',
                            background: cb ? 'rgba(167, 139, 250, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa' }}>
                                {labelB || 'Document B'} {cb?.clause_number ? `(Clause ${cb.clause_number})` : ''}
                              </span>
                              {cb && (
                                <button
                                  onClick={() => setInspectedClause({ ...cb, sourceLabel: labelB })}
                                  className="btn-secondary"
                                  style={{ padding: '1px 6px', fontSize: '0.65rem' }}
                                >
                                  <Eye size={10} />
                                  <span>Inspect</span>
                                </button>
                              )}
                            </div>
                            <p style={{
                              fontSize: '0.76rem',
                              color: cb ? 'var(--text-main)' : 'var(--text-dim)',
                              lineHeight: '1.45',
                              margin: 0,
                              fontStyle: cb ? 'normal' : 'italic'
                            }}>
                              {cb ? cb.original_text : '[Clause omitted / not present in Document B]'}
                            </p>
                          </div>
                        </div>

                        {/* Objective Legal Explanation & Impact Section */}
                        {dtype !== 'MATCH' && (
                          <div style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            {/* Concrete Plain Language Difference */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <Info size={13} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: 700, color: '#e0e7ff' }}>Plain-Language Difference: </span>
                                <span>{pair.explanation}</span>
                              </div>
                            </div>

                            {/* Why it Matters */}
                            {pair.why_it_matters && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', paddingLeft: '19px' }}>
                                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                  <span style={{ fontWeight: 700, color: '#93c5fd' }}>Why the difference matters: </span>
                                  <span>{pair.why_it_matters}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Clause Redlining Generator Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Select Clause to Redline:</span>
              <select
                value={activeClause?.id || activeClause?.clause_id || ''}
                onChange={(e) => {
                  const found = (clauses || []).find((c) => (c.id || c.clause_id) === e.target.value);
                  if (found) setActiveClause(found);
                }}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', maxWidth: '300px' }}
              >
                {(clauses || []).map((c) => (
                  <option key={c.id || c.clause_id} value={c.id || c.clause_id}>
                    #{c.clause_index || c.clause_number}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Text */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 12px',
              borderRadius: '6px',
              maxHeight: '110px',
              overflowY: 'auto',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: '1.45',
            }}>
              {activeClause?.text || activeClause?.original_text || 'No clause selected.'}
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
      )}

      {/* Clause Detail Inspection Modal */}
      {inspectedClause && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '640px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(99, 102, 241, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  {inspectedClause.sourceLabel || 'Document Clause'}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {inspectedClause.title} {inspectedClause.clause_number ? `(${inspectedClause.clause_number})` : ''}
                </h3>
              </div>
              <button
                onClick={() => setInspectedClause(null)}
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.3)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: 'var(--text-main)'
            }}>
              {inspectedClause.original_text || inspectedClause.text}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setInspectedClause(null)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.78rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
