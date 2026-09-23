import { useState, useCallback } from 'react';
import { contractService } from '../services/contractService';

export function useContract() {
  const [document, setDocument] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadDocument = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractService.uploadFile(file);
      setDocument(data.document);
      setClauses(data.clauses);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSampleDocument = useCallback(async (sampleId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractService.loadSample(sampleId);
      setDocument(data.document);
      setClauses(data.clauses);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetDocument = useCallback(() => {
    setDocument(null);
    setClauses([]);
    setError(null);
  }, []);

  const setDocumentState = useCallback((docData) => {
    if (!docData) return;
    setDocument({
      filename: docData.filename,
      char_count: docData.char_count,
      clause_count: docData.clause_count || docData.clauses?.length || 0,
    });
    setClauses(docData.clauses || []);
    setError(null);
  }, []);

  return {
    document,
    clauses,
    loading,
    error,
    setError,
    uploadDocument,
    loadSampleDocument,
    resetDocument,
    setDocumentState,
  };
}
