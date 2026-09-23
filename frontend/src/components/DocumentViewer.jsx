import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Sparkles, Copy, Check, Bookmark, ArrowUpRight, Filter } from 'lucide-react';

export default function DocumentViewer({ 
  chunks, 
  metadata, 
  activeClauseId, 
  onSelectForRedline,
  onClauseClick 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const clauseRefs = useRef({});

  // Auto-scroll to active clause when activeClauseId changes
  useEffect(() => {
    if (activeClauseId && clauseRefs.current[activeClauseId]) {
      clauseRefs.current[activeClauseId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeClauseId]);

  // Extract unique categories
  const categories = ["ALL", ...Array.from(new Set((chunks || []).map(c => c.category || "General Legal Terms")))];

  // Filter clauses by search query and category
  const filteredChunks = (chunks || []).filter(c => {
    const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.section_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Indemnification": return "#ef4444";
      case "Limitation of Liability": return "#f59e0b";
      case "Confidentiality": return "#3b82f6";
      case "Termination & Remedies": return "#ec4899";
      case "Intellectual Property": return "#8b5cf6";
      case "Governing Law & Disputes": return "#06b6d4";
      default: return "#64748b";
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      border: '1px solid var(--border-subtle)'
    }}>
      {/* Top Controls: Search & Category Filter */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Document Explorer
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Showing {filteredChunks.length} of {chunks?.length || 0} Clauses
          </span>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '6px 12px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text"
            placeholder="Search keywords, definitions, sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedCategory === cat ? '#a5b4fc' : 'var(--text-muted)',
                border: selectedCategory === cat ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {filteredChunks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.88rem' }}>No clauses match your current filter.</p>
          </div>
        ) : (
          filteredChunks.map((chunk) => {
            const isActive = activeClauseId === chunk.id;
            const catColor = getCategoryColor(chunk.category);

            return (
              <div
                key={chunk.id}
                ref={(el) => (clauseRefs.current[chunk.id] = el)}
                id={chunk.id}
                onClick={() => onClauseClick && onClauseClick(chunk)}
                className={`glass-panel ${isActive ? 'highlight-target' : ''}`}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  background: isActive ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Clause Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.07)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: '#cbd5e1'
                    }}>
                      #{chunk.clause_index}
                    </span>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isActive ? '#fbbf24' : '#f8fafc'
                    }}>
                      {chunk.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: catColor,
                      background: `${catColor}15`,
                      border: `1px solid ${catColor}40`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {chunk.category}
                    </span>

                    {/* Quick Redline action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForRedline(chunk);
                      }}
                      title="Draft AI Redline for this clause"
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#a5b4fc' }}
                    >
                      <Sparkles size={12} />
                      <span>Redline</span>
                    </button>

                    {/* Copy button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(chunk.id, chunk.text);
                      }}
                      title="Copy clause text"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === chunk.id ? '#10b981' : 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {copiedId === chunk.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Clause Body Text */}
                <p style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {chunk.text}
                </p>

                {/* Citation footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)'
                }}>
                  <span>{chunk.word_count} words • {chunk.char_count} chars</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>ID: {chunk.id}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
