import React from 'react';
import { 
  ArrowRight, 
  FileCheck2, 
  Building2, 
  UserCheck, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Cpu
} from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function LandingPage({ onNavigate, onLoadSample }) {
  const exampleContracts = [
    {
      id: 'vendor-msa',
      title: 'Enterprise SaaS Agreement (MSA)',
      category: 'SaaS MSA',
      desc: 'Master Services Agreement covering liability caps, IP warranties, SLA commitments, and auto-renewals.',
      icon: FileCheck2,
      sampleId: 'saas-msa',
      accent: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
      badgeColor: '#a5b4fc',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeBorder: 'rgba(99, 102, 241, 0.3)',
    },
    {
      id: 'nda-mutual',
      title: 'Mutual Non-Disclosure Agreement',
      category: 'Mutual NDA',
      desc: 'Two-way confidentiality and proprietary trade secret protection with standard disclosure exclusions.',
      icon: Lock,
      sampleId: 'mutual-nda',
      accent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      badgeColor: '#6ee7b7',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeBorder: 'rgba(16, 185, 129, 0.3)',
    },
    {
      id: 'employment-exec',
      title: 'Proprietary IP & Inventions Agreement',
      category: 'Employment IP',
      desc: 'Executive assignment of inventions, non-compete covenant restrictions, and post-termination survival terms.',
      icon: UserCheck,
      sampleId: 'employment-ip',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      badgeColor: '#fde68a',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.3)',
    },
    {
      id: 'lease-commercial',
      title: 'Commercial Property Lease',
      category: 'Commercial Lease',
      desc: 'Triple-net property lease covering base rent escalations, maintenance covenants, and use restrictions.',
      icon: Building2,
      sampleId: 'saas-msa',
      accent: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      badgeColor: '#f472b6',
      badgeBg: 'rgba(236, 72, 153, 0.15)',
      badgeBorder: 'rgba(236, 72, 153, 0.3)',
    },
  ];

  const valuePillars = [
    {
      icon: Lock,
      title: '0-Disk Ephemeral Privacy',
      desc: 'Contracts are analyzed in volatile RAM and never retained on disk.',
      color: '#38bdf8',
    },
    {
      icon: CheckCircle2,
      title: '100% Fact Grounded',
      desc: 'Exact line-level clause citations with strict anti-hallucination guardrails.',
      color: '#34d399',
    },
    {
      icon: Scale,
      title: '10-Section Lawyer Briefing',
      desc: 'Prepares structured executive dossiers and negotiation levers for counsel.',
      color: '#a78bfa',
    },
    {
      icon: Cpu,
      title: 'Hybrid Intelligence Engine',
      desc: 'Sub-30ms local deterministic rule engine with optional Gemini AI acceleration.',
      color: '#fbbf24',
    },
  ];

  const workflowSteps = [
    { num: '01', title: 'Upload & Parse', desc: 'Preserves headings, numbered clauses, and layout across PDF, DOCX, & TXT.' },
    { num: '02', title: 'Clause Simplification', desc: '4-Pillar breakdown: plain meaning, key rights, obligations, and deadlines.' },
    { num: '03', title: 'Risk Radar Audit', desc: 'Scores contract risk 0–100 across Liability, IP, Termination, and Payment.' },
    { num: '04', title: 'Grounded Q&A', desc: 'Interactive chat answering questions strictly using verbatim document citations.' },
    { num: '05', title: 'Semantic Diff', desc: 'Side-by-side alignment classifying clauses as MATCH, MODIFIED, ADDED, or REMOVED.' },
    { num: '06', title: 'Counsel Dossier', desc: 'Generates exportable 10-section briefing with key questions for your attorney.' },
  ];

  return (
    <div style={{
      maxWidth: '1140px',
      margin: '0 auto',
      padding: '30px 24px 60px',
      display: 'flex',
      flexDirection: 'column',
      gap: '44px',
    }}>
      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH AMBIENT GLOW                         */}
      {/* ========================================================= */}
      <section 
        aria-label="Clarity Legal Document Assistant Introduction"
        style={{
          textAlign: 'center',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Shimmer Pill Badge */}
        <div className="pill-badge" style={{ marginBottom: '18px' }}>
          <Sparkles size={14} color="#818cf8" aria-hidden="true" />
          <span>Professional Legal Intelligence & Co-Pilot</span>
        </div>

        {/* Phase 8 Exact Required Headline with Gradient Glow */}
        <h1 className="gradient-text" style={{
          fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
          fontWeight: 800,
          lineHeight: '1.18',
          letterSpacing: '-0.03em',
          maxWidth: '860px',
          marginBottom: '16px',
        }}>
          Understand your legal documents before you talk to a lawyer.
        </h1>

        {/* Phase 8 Exact Required Subheading */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          lineHeight: '1.6',
          marginBottom: '28px',
        }}>
          Clarity helps you understand, question, compare and prepare.
        </p>

        {/* CTA Button Group */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '36px' }}>
          <button
            onClick={() => onNavigate(ROUTES.UPLOAD)}
            className="btn-primary"
            aria-label="Analyze a document"
            style={{ padding: '12px 28px', fontSize: '0.96rem' }}
          >
            <span>Analyze a document</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <button
            onClick={() => {
              if (onLoadSample) onLoadSample('saas-msa');
              else onNavigate(ROUTES.UPLOAD);
            }}
            className="btn-secondary"
            aria-label="Try interactive sample"
            style={{ padding: '12px 24px', fontSize: '0.96rem' }}
          >
            <Sparkles size={16} color="#818cf8" aria-hidden="true" />
            <span>Try SaaS MSA Demo</span>
          </button>
        </div>

        {/* 4 Value Pillar Counters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          width: '100%',
          maxWidth: '1040px',
        }}>
          {valuePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="stat-pill-card" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${p.color}18`,
                    border: `1px solid ${p.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={15} color={p.color} />
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {p.title}
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SAMPLE BENCHMARKS SECTION                              */}
      {/* ========================================================= */}
      <section aria-labelledby="examples-heading" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 id="examples-heading" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Sample Contract Benchmarks
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click any benchmark agreement to immediately activate instant analysis, risk scoring, and Q&A.
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 600 }}>
            4 Pre-Loaded Agreements
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          {exampleContracts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onLoadSample) {
                    onLoadSample(item.sampleId);
                  } else {
                    onNavigate(ROUTES.UPLOAD);
                  }
                }}
                className="interactive-card"
                style={{
                  padding: '20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
                aria-label={`Analyze sample ${item.title}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: item.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}>
                    <Icon size={20} color="#ffffff" aria-hidden="true" />
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: item.badgeBg,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeBorder}`,
                    letterSpacing: '0.02em',
                  }}>
                    {item.category}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                    {item.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#818cf8', fontWeight: 700, marginTop: 'auto', paddingTop: '4px' }}>
                  <span>Load and Audit</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DOCUMENT ANALYSIS WORKFLOW PIPELINE                   */}
      {/* ========================================================= */}
      <section aria-labelledby="workflow-heading" className="glass-panel" style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 id="workflow-heading" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              End-to-End Legal Co-Pilot Pipeline
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Rigorous, non-hallucinatory contract analysis workflow from ingestion to attorney consultation.
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            6 Core Phases
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}>
          {workflowSteps.map((s, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
              }}
            >
              <div style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#818cf8',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(99, 102, 241, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                alignSelf: 'flex-start',
              }}>
                Phase {s.num}
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {s.title}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
