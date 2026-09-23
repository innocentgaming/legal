import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Lock, Zap, ArrowRight } from 'lucide-react';
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
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          Ingest Legal Contract
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Supports <strong>PDF</strong> (via PDFPlumber layout extraction), <strong>DOCX</strong> (via Mammoth), and <strong>Plain Text</strong>.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <LoadingState message="Parsing layout, segmenting clauses & indexing vector store..." size="large" />
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel"
          style={{
            padding: '44px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            border: isDragOver ? '2px dashed #6366f1' : '2px dashed rgba(255, 255, 255, 0.15)',
            backgroundColor: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
            transition: 'all 0.2s ease',
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
            width: '56px',
            height: '56px',
            margin: '0 auto 16px auto',
            borderRadius: '14px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UploadCloud size={28} color="#818cf8" />
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>
            Click to upload or drag & drop contract
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            PDF, DOCX, TXT up to 25MB
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            <span className="badge-neutral">PDF</span>
            <span className="badge-neutral">DOCX</span>
            <span className="badge-neutral">TXT</span>
          </div>
        </div>
      )}

      {/* Active Document Notification if loaded */}
      {document && (
        <div className="glass-panel" style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{document.filename}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {document.clause_count} clauses parsed • {document.total_words} words
              </div>
            </div>
          </div>

          <button onClick={() => onNavigate(ROUTES.WORKSPACE)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            <span>Go to Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 1-Click Samples */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Or load a benchmark contract:
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
        }}>
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onLoadSample(sample.id)}
              className="glass-panel"
              style={{
                padding: '14px',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#818cf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sample.name}</span>
                </div>
                <span className={sample.risk === 'High' ? 'badge-high' : (sample.risk === 'Medium' ? 'badge-med' : 'badge-low')}>
                  {sample.risk} Risk
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {sample.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
