import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, Sparkles, Copy, Check, Filter } from 'lucide-react';
import { getCategoryBadgeColor } from '../utils/formatters';

export default function ClauseSummaryPanel({
  clauses = [],
  activeClauseId,
  onClauseClick,
  onRedlineClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const clauseRefs = useRef({});

  useEffect(() => {
    if (activeClauseId && clauseRefs.current[activeClauseId]) {
      clauseRefs.current[activeClauseId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeClauseId]);

  const categories = ['ALL', ...Array.from(new Set(clauses.map((c) => c.category || 'General Legal Terms')))];

  const filteredClauses = clauses.filter((c) => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.section_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Search and Category Filter */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clause Summary Panel
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {filteredClauses.length} of {clauses.length} Clauses
          </span>
        </div>

        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '5px 10px',
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search keywords or clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              width: '100%',
            }}
          />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedCategory === cat ? '#a5b4fc' : 'var(--text-muted)',
                border: selectedCategory === cat ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {filteredClauses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No clauses found.
          </div>
        ) : (
          filteredClauses.map((clause) => {
            const isActive = activeClauseId === clause.id;
            const badgeStyle = getCategoryBadgeColor(clause.category);

            return (
              <div
                key={clause.id}
                ref={(el) => (clauseRefs.current[clause.id] = el)}
                onClick={() => onClauseClick && onClauseClick(clause)}
                className={`glass-panel ${isActive ? 'highlight-target' : ''}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  background: isActive ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}>
                      #{clause.clause_index}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isActive ? '#fbbf24' : '#f8fafc' }}>
                      {clause.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: badgeStyle.bg,
                      color: badgeStyle.text,
                      border: `1px solid ${badgeStyle.border}`,
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}>
                      {clause.category}
                    </span>

                    {onRedlineClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRedlineClick(clause);
                        }}
                        className="btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                      >
                        <Sparkles size={11} />
                        <span>Redline</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(clause.id, clause.text);
                      }}
                      style={{ background: 'none', border: 'none', color: copiedId === clause.id ? '#10b981' : 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    >
                      {copiedId === clause.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}>
                  {clause.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
