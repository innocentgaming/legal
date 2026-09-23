from typing import List, Dict, Any
import numpy as np
from backend.app.services.embedding_service import EmbeddingService

class RetrievalService:
    """
    In-memory hybrid dense + sparse retrieval service.
    Fast vector math with cosine similarity and exact legal term boosting.
    """

    def __init__(self):
        self.clauses: List[Dict[str, Any]] = []
        self.doc_matrix: np.ndarray | None = None
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def index_clauses(self, clauses: List[Dict[str, Any]]) -> None:
        self.clauses = clauses
        if not clauses:
            self.doc_matrix = None
            self.vocab = {}
            self.idf = {}
            return

        corpus = [c["title"] + " " + c["text"] for c in clauses]
        self.doc_matrix, self.vocab, self.idf = EmbeddingService.compute_tfidf_matrix(corpus)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.clauses or self.doc_matrix is None or len(self.vocab) == 0:
            return self.clauses[:top_k]

        q_vec = EmbeddingService.encode_query(query, self.vocab, self.idf)
        q_norm = np.linalg.norm(q_vec)
        
        if q_norm > 0:
            sim_scores = np.dot(self.doc_matrix, q_vec.T).flatten()
        else:
            sim_scores = np.zeros(len(self.clauses), dtype=np.float32)

        # Keyword boost for legal numbers and terms of art
        query_tokens = EmbeddingService.tokenize(query)
        exact_boosts = []
        for c in self.clauses:
            text_lower = (c["title"] + " " + c["text"]).lower()
            b = 0.0
            for qt in query_tokens:
                if len(qt) > 3 and qt in text_lower:
                    b += 0.12
            exact_boosts.append(b)

        total_scores = sim_scores + np.array(exact_boosts, dtype=np.float32)
        top_indices = np.argsort(total_scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            clause_dict = dict(self.clauses[idx])
            clause_dict["relevance_score"] = float(total_scores[idx])
            results.append(clause_dict)

        return results
