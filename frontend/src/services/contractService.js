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
  sendQuery: (query, history = [], topK = 4) => {
    return apiClient.post('/chat/query', { query, history, top_k: topK });
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

  compareDocuments: (textA, textB, labelA = 'Version A', labelB = 'Version B') => {
    return apiClient.post('/comparison/documents', {
      document_text_a: textA,
      document_text_b: textB,
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
