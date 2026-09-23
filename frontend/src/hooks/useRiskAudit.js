import { useState, useCallback } from 'react';
import { analysisService } from '../services/contractService';

export function useRiskAudit() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analysisService.auditContract();
      setAnalysis(data.analysis);
      return data.analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAudit = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    runAudit,
    clearAudit,
    setAnalysis,
  };
}
