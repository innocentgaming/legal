import React from 'react';
import { Scale, ShieldCheck, Sparkles, Zap, Lock, ArrowRight, FileText, GitCompare, Briefcase } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function LandingPage({ onNavigate }) {
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '24px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '36px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', paddingTop: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '0.8rem',
          color: '#a5b4fc',
          marginBottom: '16px',
        }}>
          <Sparkles size={14} color="#818cf8" />
          <span>Clarity AI Legal Co-Pilot — Phase 1 Production Shell</span>
        </div>

        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '14px',
          lineHeight: '1.15',
        }}>
          Contract Intelligence. Risk Auditing. Grounded RAG.
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 24px auto',
          lineHeight: '1.6',
        }}>
          A lightweight, modular legal analysis engine with PDF/DOCX ingestion, in-memory hybrid vector search, and citation-backed legal intelligence.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate(ROUTES.UPLOAD)}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.9rem' }}
          >
            <span>Get Started / Upload Contract</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate(ROUTES.COMPARISON)}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <GitCompare size={16} />
            <span>Document Comparator</span>
          </button>
        </div>
      </div>

      {/* 4 Feature Pillars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <FileText size={20} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Document Workspace</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            Interactive clause segmentation with search filters and structural hierarchy preservation.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <ShieldCheck size={20} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Risk Audit Panel</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            Automated scoring for uncapped liabilities, one-sided indemnity, and missing protective terms.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <GitCompare size={20} color="#06b6d4" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Clause Comparison</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            Side-by-side contract diffing and balanced counter-language generator.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Briefcase size={20} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Lawyer Briefing</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            Action-oriented negotiation playbooks and deal-breaker summaries for General Counsel.
          </p>
        </div>
      </div>
    </div>
  );
}
