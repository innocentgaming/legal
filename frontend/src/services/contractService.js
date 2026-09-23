import { apiClient } from './apiClient';

export const contractService = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/documents/upload', formData);
  },

  loadSample: (sampleId) => {
    return apiClient.post(`/documents/sample/${sampleId}`, {});
  },

  getCurrentDocument: () => {
    return apiClient.get('/documents/current');
  },

  getSystemStatus: () => {
    return apiClient.get('/status');
  },
};

export const analysisService = {
  auditContract: () => {
    return apiClient.post('/analysis/audit', {});
  },
};

export const chatService = {
  askQA: (question, documentId = null) => {
    return apiClient.post('/qa', { question, document_id: documentId });
  },

  sendQuery: (query, history = [], topK = 4) => {
    return apiClient.post('/qa', { question: query, query, history, top_k: topK });
  },
};

export const comparisonService = {
  redlineClause: (clauseText, category, instructions, clauseId = null) => {
    return apiClient.post('/comparison/clause', {
      clause_text: clauseText,
      category,
      instructions,
      clause_id: clauseId,
    });
  },

  compareDocuments: (docA, docB, labelA = 'Document A', labelB = 'Document B') => {
    return apiClient.post('/compare', {
      document_a: docA,
      document_b: docB,
      label_a: labelA,
      label_b: labelB,
    });
  },
};

export const briefingService = {
  generateBriefing: (targetRole = 'General Counsel', focusAreas = []) => {
    return apiClient.post('/briefing/generate', {
      target_role: targetRole,
      focus_areas: focusAreas,
    });
  },
};
