import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles, Zap, Lock } from 'lucide-react';

export default function Dropzone({ onFileUpload, onLoadSample, isUploading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{
      maxWidth: '960px',
      margin: '40px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      {/* Hero Welcome Banner */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '0.8rem',
          color: '#a5b4fc',
          marginBottom: '16px'
        }}>
          <Sparkles size={15} color="#818cf8" />
          <span>Next-Generation AI Contract Review & Legal Negotiation Co-Pilot</span>
        </div>
        <h2 style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          Analyze Contracts. Uncover Risks. Redline Instantly.
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '640px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Upload your legal agreements for deep clause-by-clause risk auditing, citation-grounded Q&A, and AI-assisted bilateral redlining.
        </p>
      </div>

      {/* Upload Drop Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="glass-panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          cursor: isUploading ? 'wait' : 'pointer',
          border: isDragOver ? '2px dashed #6366f1' : '2px dashed rgba(255, 255, 255, 0.15)',
          backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
          transition: 'all 0.25s ease',
          boxShadow: isDragOver ? '0 0 30px rgba(99, 102, 241, 0.2)' : 'none'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,.docx,.doc,.txt,.md"
          style={{ display: 'none' }}
        />

        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 18px auto',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UploadCloud size={32} color="#818cf8" className={isUploading ? "pulsing-radar" : ""} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
          {isUploading ? "Parsing & Indexing Legal Document..." : "Drop your legal contract here, or browse"}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Supports <strong>PDF</strong> (via PDFPlumber), <strong>DOCX</strong> (via Mammoth), and <strong>Plain Text</strong>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <span className="badge-neutral">PDF</span>
          <span className="badge-neutral">DOCX</span>
          <span className="badge-neutral">TXT</span>
          <span className="badge-neutral">Up to 25MB</span>
        </div>
      </div>

      {/* 1-Click Benchmark Contracts */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Or try an instant benchmark sample:
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            1-Click Interactive Evaluation
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {/* Sample 1 */}
          <div 
            onClick={() => onLoadSample('saas-msa')}
            className="glass-panel"
            style={{
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border-subtle)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#ef4444" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Enterprise SaaS MSA</span>
              </div>
              <span className="badge-high">High Risk</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Contains uncapped customer liability, omitted vendor indemnity, and aggressive non-compete terms.
            </p>
          </div>

          {/* Sample 2 */}
          <div 
            onClick={() => onLoadSample('mutual-nda')}
            className="glass-panel"
            style={{
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border-subtle)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mutual NDA</span>
              </div>
              <span className="badge-low">Balanced</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Standard reciprocal confidentiality agreement with standard 2-year term and trade secret carve-outs.
            </p>
          </div>

          {/* Sample 3 */}
          <div 
            onClick={() => onLoadSample('employment-ip')}
            className="glass-panel"
            style={{
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border-subtle)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>IP & Inventions Agreement</span>
              </div>
              <span className="badge-med">Moderate</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Broad assignment of inventions with post-employment non-solicitation and restrictive covenants.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Engine Guarantees */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={18} color="#06b6d4" />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Zero Data Retention</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>In-memory vector store</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={18} color="#6366f1" />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sub-Second Search</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Cosine similarity RAG</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ground Truth Citations</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Verifiable source quotes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
