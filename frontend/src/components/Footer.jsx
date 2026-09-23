import React from 'react';
import { Scale, Mail, Phone, ExternalLink } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function Footer({ onNavigate, document }) {
  const currentYear = 2026;

  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.95)',
        padding: '24px 20px 20px',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '20px',
        }}
      >
        {/* Brand & Purpose */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            onClick={() => onNavigate(ROUTES.LANDING)}
            role="button"
            tabIndex={0}
            aria-label="Clarity Home"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(ROUTES.LANDING); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={15} color="#ffffff" aria-hidden="true" />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              CLARITY
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: '1.45', margin: 0 }}>
            AI-powered legal contract review, citation-grounded RAG, and lawyer consultation preparation.
          </p>
        </div>

        {/* Navigation Quicklinks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.04em' }}>
            Navigation
          </span>
          <button
            onClick={() => onNavigate(ROUTES.LANDING)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.74rem', padding: '2px 0' }}
          >
            Overview & Benchmarks
          </button>
          <button
            onClick={() => onNavigate(ROUTES.UPLOAD)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.74rem', padding: '2px 0' }}
          >
            Upload Contract
          </button>
          <button
            onClick={() => onNavigate(ROUTES.WORKSPACE)}
            disabled={!document}
            style={{ background: 'none', border: 'none', color: document ? 'var(--text-muted)' : 'var(--text-dim)', textAlign: 'left', cursor: document ? 'pointer' : 'not-allowed', fontSize: '0.74rem', padding: '2px 0' }}
          >
            Document Workspace {document ? `(${document.filename})` : ''}
          </button>
          <button
            onClick={() => onNavigate(ROUTES.COMPARISON)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', cursor: 'pointer', fontSize: '0.74rem', padding: '2px 0' }}
          >
            Two-Document Comparison
          </button>
          <button
            onClick={() => onNavigate(ROUTES.BRIEFING)}
            disabled={!document}
            style={{ background: 'none', border: 'none', color: document ? 'var(--text-muted)' : 'var(--text-dim)', textAlign: 'left', cursor: document ? 'pointer' : 'not-allowed', fontSize: '0.74rem', padding: '2px 0' }}
          >
            Lawyer Preparation Briefing
          </button>
        </div>

        {/* Contact & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.04em' }}>
            Contact & Support
          </span>
          <a
            href="mailto:support@claritylegal.ai"
            style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.74rem' }}
          >
            <Mail size={13} aria-hidden="true" />
            <span>support@claritylegal.ai</span>
          </a>
          <a
            href="tel:+18005550199"
            style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.74rem' }}
          >
            <Phone size={13} aria-hidden="true" />
            <span>+1 (800) 555-0199</span>
          </a>
          <a
            href="https://github.com/innocentgaming/legal"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '0.74rem', marginTop: '2px' }}
          >
            <span>GitHub Repository</span>
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Bottom Bar & Legal Notice */}
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
        }}
      >
        <div>
          © {currentYear} Clarity Legal AI. All rights reserved. Professional Legal Intelligence Platform.
        </div>
        <div>
          <strong>Legal Disclaimer:</strong> Clarity is an AI-powered document preparation tool and does not provide legal advice or create an attorney-client relationship.
        </div>
      </div>
    </footer>
  );
}
