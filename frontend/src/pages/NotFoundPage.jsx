import React from 'react';
import { FileQuestion, ArrowRight } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function NotFoundPage({ onNavigate }) {
  return (
    <main
      role="main"
      aria-label="404 Page Not Found"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <FileQuestion size={32} color="#818cf8" aria-hidden="true" />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
        404 — Page Not Found
      </h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: '1.5', marginBottom: '24px' }}>
        The requested legal workspace view does not exist. Please navigate back to the overview or upload a contract.
      </p>
      <button
        onClick={() => onNavigate(ROUTES.LANDING)}
        className="btn-primary"
        aria-label="Return to Overview"
        style={{ padding: '10px 20px', fontSize: '0.88rem' }}
      >
        <span>Return to Overview</span>
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </main>
  );
}
