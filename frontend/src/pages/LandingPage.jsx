import React from 'react';
import { 
  ArrowRight, 
  FileCheck2, 
  Building, 
  UserCheck, 
  Lock
} from 'lucide-react';
import { ROUTES } from '../types/constants';

export default function LandingPage({ onNavigate, onLoadSample }) {
  const exampleContracts = [
    {
      id: 'lease-commercial',
      title: 'Commercial Lease',
      category: 'Lease',
      desc: 'Standard commercial property lease covering base rent, maintenance covenants, and use restrictions.',
      icon: Building,
      sampleId: 'commercial-lease'
    },
    {
      id: 'employment-exec',
      title: 'Employment Contract',
      category: 'Employment Contract',
      desc: 'Executive offer agreement with post-termination non-compete and IP assignment provisions.',
      icon: UserCheck,
      sampleId: 'employment-contract'
    },
    {
      id: 'nda-mutual',
      title: 'Non-Disclosure Agreement',
      category: 'NDA',
      desc: 'Mutual confidentiality and trade secret protection agreement with defined disclosure exclusions.',
      icon: Lock,
      sampleId: 'nda-mutual'
    },
    {
      id: 'vendor-msa',
      title: 'Vendor Agreement',
      category: 'Vendor Agreement',
      desc: 'Master Services Agreement (MSA) with liability limitations, IP warranties, and termination windows.',
      icon: FileCheck2,
      sampleId: 'saas-msa'
    }
  ];

  const workflowSteps = [
    { num: '01', title: 'Upload & Parse', desc: 'Structure-preserving PDF, DOCX, & TXT ingestion.' },
    { num: '02', title: 'Clause Simplification', desc: 'Plain-language summaries, rights & obligations.' },
    { num: '03', title: 'Risk Classification', desc: 'Deterministic & contextual pattern audits.' },
    { num: '04', title: 'Grounded Q&A', desc: 'Strict factual answers with exact clause citations.' },
    { num: '05', title: 'Document Comparison', desc: 'Semantic two-column version alignment.' },
    { num: '06', title: 'Lawyer Briefing', desc: '10-section one-page consultation summary.' },
  ];

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      padding: '24px 20px 48px',
      display: 'flex',
      flexDirection: 'column',
      gap: '36px',
    }}>
      {/* Hero Section */}
      <section 
        aria-label="Clarity Legal Document Assistant Introduction"
        style={{
          textAlign: 'center',
          paddingTop: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: '#a5b4fc',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '14px',
        }}>
          Professional Legal Document Intelligence
        </div>

        {/* Phase 8 Exact Required Headline */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
          maxWidth: '780px',
          marginBottom: '14px',
        }}>
          Understand your legal documents before you talk to a lawyer.
        </h1>

        {/* Phase 8 Exact Required Subheading */}
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '640px',
          lineHeight: '1.55',
          marginBottom: '24px',
        }}>
          Clarity helps you understand, question, compare and prepare.
        </p>

        {/* Phase 8 Exact Required CTA */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onNavigate(ROUTES.UPLOAD)}
            className="btn-primary"
            aria-label="Analyze a document"
            style={{ padding: '10px 24px', fontSize: '0.92rem' }}
          >
            <span>Analyze a document</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Example Contracts Section */}
      <section aria-labelledby="examples-heading" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="examples-heading" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Sample Contract Benchmarks
          </h2>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            Click any agreement to test instant document analysis
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px',
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
                className="glass-panel"
                style={{
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'inherit',
                  transition: 'border-color 0.15s ease'
                }}
                aria-label={`Analyze sample ${item.title}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={16} color="#818cf8" aria-hidden="true" />
                  </div>
                  <span className="badge-neutral" style={{ fontSize: '0.66rem' }}>{item.category}</span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.title}
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {item.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, marginTop: '4px' }}>
                  <span>Load and Audit</span>
                  <ArrowRight size={12} aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Workflow Progression */}
      <section aria-labelledby="workflow-heading" className="glass-panel" style={{ padding: '20px' }}>
        <h2 id="workflow-heading" style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '14px' }}>
          Document Analysis Workflow
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}>
          {workflowSteps.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                {s.num}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {s.title}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.35', margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
