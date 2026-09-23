import React from 'react';
import { Scale, FileText, UploadCloud, GitCompare, Briefcase, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function Navbar({ currentRoute, onNavigate, document, systemStatus }) {
  const navItems = [
    { route: ROUTES.LANDING, label: 'Overview', icon: Scale },
    { route: ROUTES.UPLOAD, label: 'Upload & Ingest', icon: UploadCloud },
    { route: ROUTES.WORKSPACE, label: 'Workspace', icon: FileText, disabled: !document },
    { route: ROUTES.COMPARISON, label: 'Compare Documents', icon: GitCompare },
    { route: ROUTES.BRIEFING, label: 'Lawyer Briefing', icon: Briefcase, disabled: !document },
  ];

  return (
    <header 
      role="banner"
      className="glass-panel" 
      style={{
        margin: '10px 16px 0 16px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand & Logo */}
      <div 
        onClick={() => onNavigate(ROUTES.LANDING)}
        role="button"
        tabIndex={0}
        aria-label="Clarity Home"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(ROUTES.LANDING); }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Scale size={18} color="#ffffff" aria-hidden="true" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              CLARITY
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              padding: '1px 5px',
              borderRadius: '3px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}>
              LEGAL
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', margin: 0 }}>
            Document Analysis & Preparation
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav 
        role="navigation" 
        aria-label="Main Navigation"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => !item.disabled && onNavigate(item.route)}
              disabled={item.disabled}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: isActive ? '#ffffff' : (item.disabled ? 'var(--text-dim)' : 'var(--text-muted)'),
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? "#818cf8" : (item.disabled ? "#475569" : "var(--text-dim)")} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right-Side Document Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {document ? (
          <div 
            onClick={() => onNavigate(ROUTES.WORKSPACE)}
            role="button"
            tabIndex={0}
            aria-label={`Active document: ${document.filename}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(ROUTES.WORKSPACE); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            <FileText size={13} color="#818cf8" aria-hidden="true" />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {document.filename}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            No document loaded
          </span>
        )}
      </div>
    </header>
  );
}
