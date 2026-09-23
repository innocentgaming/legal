import React, { useState } from 'react';
import { Scale, FileText, UploadCloud, GitCompare, Briefcase, Menu, X } from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function Navbar({ currentRoute, onNavigate, document }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { route: ROUTES.LANDING, label: 'Overview', icon: Scale },
    { route: ROUTES.UPLOAD, label: 'Upload & Ingest', icon: UploadCloud },
    { route: ROUTES.WORKSPACE, label: 'Workspace', icon: FileText },
    { route: ROUTES.COMPARISON, label: 'Compare Documents', icon: GitCompare },
    { route: ROUTES.BRIEFING, label: 'Lawyer Briefing', icon: Briefcase },
  ];

  const handleNavClick = (route) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

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
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Brand & Logo (Clickable with Accessibility) */}
      <div 
        onClick={() => handleNavClick(ROUTES.LANDING, false)}
        role="button"
        tabIndex={0}
        aria-label="Clarity AI Legal Co-Pilot — Go to Overview"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavClick(ROUTES.LANDING, false); }}
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

      {/* Desktop Navigation Links */}
      <nav 
        role="navigation" 
        aria-label="Main Navigation"
        className="desktop-nav"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => handleNavClick(item.route, item.disabled)}
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

      {/* Right-Side Document Status & Mobile Hamburger Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {document ? (
          <div 
            onClick={() => handleNavClick(ROUTES.WORKSPACE, false)}
            role="button"
            tabIndex={0}
            aria-label={`Active document: ${document.filename}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavClick(ROUTES.WORKSPACE, false); }}
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
          <span className="desktop-nav-status" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            No document loaded
          </span>
        )}

        {/* Mobile Hamburger Menu Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
          aria-expanded={mobileMenuOpen}
          style={{
            display: 'none',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: 'var(--text-main)',
            padding: '6px',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Mobile Navigation Menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;

            return (
              <button
                key={item.route}
                onClick={() => handleNavClick(item.route, item.disabled)}
                disabled={item.disabled}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isActive ? '#ffffff' : (item.disabled ? 'var(--text-dim)' : 'var(--text-muted)'),
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                }}
              >
                <Icon size={16} color={isActive ? "#818cf8" : (item.disabled ? "#475569" : "var(--text-dim)")} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
