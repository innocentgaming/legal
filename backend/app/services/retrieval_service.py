from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import heapq
from backend.app.services.embedding_service import EmbeddingService

class RetrievalService:
    """
    In-memory hybrid dense + sparse retrieval service.
    Pre-caches TF-IDF vocabulary dictionary, document matrix, and normalized text
    once during document creation/ingestion.
    Reuses cached instance attributes across all subsequent query/retrieval calls.
    """

    def __init__(self, document: Optional[Any] = None, clauses: Optional[List[Dict[str, Any]]] = None):
        self.document = document
        self.clauses: List[Dict[str, Any]] = []
        self.doc_matrix: np.ndarray | None = None
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._clause_texts_lower: List[str] = []
        self._query_cache: Dict[str, List[Dict[str, Any]]] = {}

        # Support document object (with .clauses attribute) or raw clauses list
        target_clauses = clauses
        if target_clauses is None and document is not None:
            if hasattr(document, "clauses"):
                raw_c = document.clauses
                target_clauses = [c.to_dict() if hasattr(c, "to_dict") else c for c in raw_c]
            elif isinstance(document, list):
                target_clauses = document

        if target_clauses:
            self.build_index(target_clauses)

    def build_index(self, clauses: List[Dict[str, Any]]) -> Tuple[Dict[str, int], np.ndarray]:
        """
        Constructs and caches vocabulary, IDF vectors, document matrix, and normalized text
        once at document-ingestion time.
        """
        self.clauses = [c.to_dict() if hasattr(c, "to_dict") else c for c in clauses]
        self._query_cache.clear()

        if not self.clauses:
            self.doc_matrix = None
            self.vocab = {}
            self.idf = {}
            self._clause_texts_lower = []
            return {}, np.zeros((0, 0), dtype=np.float32)

        corpus = [(c.get("title", "") + " " + c.get("text", c.get("original_text", ""))) for c in self.clauses]
        self._clause_texts_lower = [doc.lower() for doc in corpus]
        
        # Pre-compute and store matrix, vocabulary, and IDF as instance attributes
        self.doc_matrix, self.vocab, self.idf = EmbeddingService.compute_tfidf_matrix(corpus)
        return self.vocab, self.doc_matrix

    def _build_index(self, clauses: List[Dict[str, Any]]) -> Tuple[Dict[str, int], np.ndarray]:
        return self.build_index(clauses)

    def index_clauses(self, clauses: List[Dict[str, Any]]) -> None:
        """
        Backward-compatible alias for build_index.
        """
        self.build_index(clauses)

    def _vectorize(self, text: str, vocab: Optional[Dict[str, int]] = None) -> np.ndarray:
        """
        Encodes query text into a normalized TF-IDF vector reusing pre-cached vocab and idf.
        """
        active_vocab = vocab if vocab is not None else self.vocab
        return EmbeddingService.encode_query(text, active_vocab, self.idf)

    def _cosine_top_k(self, query_vec: np.ndarray, matrix: Optional[np.ndarray] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Fast cosine dot product against pre-computed matrix with heapq Top-K selection.
        """
        active_matrix = matrix if matrix is not None else self.doc_matrix
        if active_matrix is None or len(self.clauses) == 0:
            return self.clauses[:top_k]

        q_norm = np.linalg.norm(query_vec)
        if q_norm > 0:
            sim_scores = np.dot(active_matrix, query_vec.T).flatten()
        else:
            sim_scores = np.zeros(len(self.clauses), dtype=np.float32)

        top_candidates = heapq.nlargest(top_k, enumerate(sim_scores), key=lambda x: x[1])
        results = []
        for idx, score in top_candidates:
            clause_dict = dict(self.clauses[idx])
            clause_dict["relevance_score"] = float(score)
            results.append(clause_dict)
        return results

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Reuses cached instance attributes (doc_matrix, vocab, idf, clause_texts_lower)
        to perform sub-millisecond similarity scoring without rebuilding TF-IDF indices.
        """
        if not self.clauses or self.doc_matrix is None or len(self.vocab) == 0:
            return self.clauses[:top_k]

        cache_key = f"{query}::{top_k}"
        if cache_key in self._query_cache:
            return self._query_cache[cache_key]

        q_vec = self._vectorize(query)
        q_norm = np.linalg.norm(q_vec)
        
        if q_norm > 0:
            sim_scores = np.dot(self.doc_matrix, q_vec.T).flatten()
        else:
            sim_scores = np.zeros(len(self.clauses), dtype=np.float32)

        # Keyword boost using pre-cached lowercased text
        query_tokens = EmbeddingService.tokenize(query)
        exact_boosts = []
        for text_lower in self._clause_texts_lower:
            b = 0.0
            for qt in query_tokens:
                if len(qt) > 3 and qt in text_lower:
                    b += 0.12
            exact_boosts.append(b)

        total_scores = sim_scores + np.array(exact_boosts, dtype=np.float32)
        top_candidates = heapq.nlargest(top_k, enumerate(total_scores), key=lambda x: x[1])

        results = []
        for idx, score in top_candidates:
            clause_dict = dict(self.clauses[idx])
            clause_dict["relevance_score"] = float(score)
            results.append(clause_dict)

        # Cache query results
        if len(self._query_cache) > 64:
            self._query_cache.clear()
        self._query_cache[cache_key] = results

        return results

    def query(self, text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Reuses pre-computed cached index to answer query.
        """
        return self.search(text, top_k=top_k)

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Alias for search/retrieve.
        """
        return self.search(query, top_k=top_k)
