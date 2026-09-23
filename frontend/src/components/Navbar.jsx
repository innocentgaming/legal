import React from 'react';
import { Scale, FileText, ShieldAlert, GitCompare, Briefcase, UploadCloud, Activity } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function Navbar({ currentRoute, onNavigate, document, systemStatus }) {
  const navItems = [
    { route: ROUTES.LANDING, label: 'Overview', icon: Scale },
    { route: ROUTES.UPLOAD, label: 'Ingest Contract', icon: UploadCloud },
    { route: ROUTES.WORKSPACE, label: 'Workspace', icon: FileText, disabled: !document },
    { route: ROUTES.COMPARISON, label: 'Comparison & Redline', icon: GitCompare },
    { route: ROUTES.BRIEFING, label: 'Lawyer Briefing', icon: Briefcase, disabled: !document },
  ];

  return (
    <header className="glass-panel" style={{
      margin: '12px 20px 0 20px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Brand & Logo */}
      <div 
        onClick={() => onNavigate(ROUTES.LANDING)}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
        }}>
          <Scale size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              CLARITY
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              padding: '2px 5px',
              borderRadius: '4px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}>
              PHASE 1
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            AI Legal Co-Pilot Platform
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => !item.disabled && onNavigate(item.route)}
              disabled={item.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isActive ? '#a5b4fc' : (item.disabled ? 'var(--text-dim)' : 'var(--text-muted)'),
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} color={isActive ? "#818cf8" : (item.disabled ? "#475569" : "var(--text-dim)")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right-Side Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {document && (
          <div 
            onClick={() => onNavigate(ROUTES.WORKSPACE)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={14} color="#818cf8" />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {document.filename}
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
        }}>
          <Activity size={12} color={systemStatus ? '#10b981' : '#f59e0b'} />
          <span>{systemStatus?.active_llm_provider || 'Engine Ready'}</span>
        </div>
      </div>
    </header>
  );
}
