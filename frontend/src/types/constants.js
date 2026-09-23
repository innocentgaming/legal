export const ROUTES = {
  LANDING: '/',
  UPLOAD: '/upload',
  WORKSPACE: '/workspace',
  COMPARISON: '/comparison',
  BRIEFING: '/briefing',
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const RISK_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const SAMPLE_DOCUMENTS = [
  {
    id: 'saas-msa',
    name: 'Enterprise SaaS MSA',
    risk: 'High',
    description: 'Uncapped customer liability, omitted provider indemnity, 2-year non-compete.',
  },
  {
    id: 'mutual-nda',
    name: 'Mutual NDA',
    risk: 'Low',
    description: 'Standard reciprocal non-disclosure with 2-year term and trade secret protection.',
  },
  {
    id: 'employment-ip',
    name: 'IP Assignment Agreement',
    risk: 'Medium',
    description: 'Broad work-for-hire assignment with non-solicitation covenants.',
  },
];
