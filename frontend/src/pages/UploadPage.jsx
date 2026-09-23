import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { SAMPLE_DOCUMENTS, ROUTES } from '../types/constants';
import { LoadingState } from '../components/LoadingState';

export default function UploadPage({
  onFileUpload,
  onLoadSample,
  loading,
  document,
  onNavigate,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
    <main 
      role="main"
      aria-label="Upload Contract Document"
      style={{
        maxWidth: '920px',
        margin: '16px auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>
          Ingest Legal Contract
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Supports <strong>PDF</strong> (layout preserved), <strong>DOCX</strong>, and <strong>Plain Text</strong> files up to 25MB.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '36px' }} aria-live="polite">
          <LoadingState message="Extracting layout, segmenting clauses & indexing vector store..." size="large" />
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Click to browse files or drag and drop a contract"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: isDragOver ? '2px dashed #818cf8' : '2px dashed var(--border-subtle)',
            backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.md"
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 14px auto',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UploadCloud size={26} color="#818cf8" aria-hidden="true" />
          </div>

          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
            Click to upload or drag & drop contract
          </h2>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            PDF, DOCX, TXT up to 25MB
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            <span className="badge-neutral">PDF</span>
            <span className="badge-neutral">DOCX</span>
            <span className="badge-neutral">TXT</span>
          </div>
        </div>
      )}

      {/* Active Document Status */}
      {document && (
        <section aria-label="Active Document Status" className="glass-panel" style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid var(--risk-low-border)',
          background: 'var(--risk-low-bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#34d399" aria-hidden="true" />
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>{document.filename}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {document.clause_count} clauses parsed • {document.total_words} words
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate(ROUTES.WORKSPACE)} 
            className="btn-primary" 
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            aria-label="Proceed to Document Workspace"
          >
            <span>Open Workspace</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* 1-Click Samples Section */}
      <section aria-labelledby="benchmarks-heading">
        <h2 id="benchmarks-heading" style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '10px' }}>
          Or load a benchmark agreement:
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px',
        }}>
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onLoadSample(sample.id)}
              className="glass-panel"
              style={{
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
              aria-label={`Load benchmark ${sample.name}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#818cf8" aria-hidden="true" />
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)' }}>{sample.name}</span>
                </div>
                <span className={sample.risk === 'High' ? 'badge-high' : (sample.risk === 'Medium' ? 'badge-med' : 'badge-low')}>
                  {sample.risk.toUpperCase()} RISK
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
