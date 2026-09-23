import re
import math
from typing import List, Dict, Any, Tuple
import numpy as np

class InMemoryVectorStore:
    """
    Lightweight, high-speed in-memory vector and lexical retrieval engine.
    Uses TF-IDF + BM25-style frequency scaling and cosine similarity.
    Requires zero external database infrastructure.
    """

    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_vectors: np.ndarray | None = None
        self.document_metadata: Dict[str, Any] = {}

    def index_document(self, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]) -> None:
        self.document_metadata = metadata
        self.chunks = chunks
        if not chunks:
            self.vocabulary = {}
            self.doc_vectors = None
            return

        # Build vocabulary & inverted index
        doc_tokens_list = [self._tokenize(c["title"] + " " + c["text"]) for c in chunks]
        N = len(chunks)

        df: Dict[str, int] = {}
        for tokens in doc_tokens_list:
            unique_terms = set(tokens)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1

        # Calculate IDF (BM25 smoothed)
        self.idf = {term: math.log(1 + (N - count + 0.5) / (count + 0.5)) for term, count in df.items()}
        self.vocabulary = {term: i for i, term in enumerate(self.idf.keys())}
        vocab_size = len(self.vocabulary)

        # Build TF-IDF document vectors
        vectors = np.zeros((N, vocab_size), dtype=np.float32)
        for doc_idx, tokens in enumerate(doc_tokens_list):
            doc_len = len(tokens)
            if doc_len == 0:
                continue
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            
            for term, count in tf.items():
                if term in self.vocabulary:
                    col_idx = self.vocabulary[term]
                    # Augmented TF * IDF
                    norm_tf = (count / doc_len)
                    vectors[doc_idx, col_idx] = norm_tf * self.idf[term]

        # Normalize vectors for cosine similarity
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        self.doc_vectors = vectors / norms

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.chunks or self.doc_vectors is None or len(self.vocabulary) == 0:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.chunks[:top_k]

        q_vec = np.zeros((1, len(self.vocabulary)), dtype=np.float32)
        q_len = len(query_tokens)
        
        q_tf: Dict[str, int] = {}
        for t in query_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1

        for term, count in q_tf.items():
            if term in self.vocabulary:
                col_idx = self.vocabulary[term]
                norm_tf = count / q_len
                q_vec[0, col_idx] = norm_tf * self.idf[term]

        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm
            # Dot product with normalized matrix = cosine similarity
            sim_scores = np.dot(self.doc_vectors, q_vec.T).flatten()
        else:
            sim_scores = np.zeros(len(self.chunks), dtype=np.float32)

        # Lexical keyword boost for exact legal matches (e.g., "indemnification", "Section 4.2")
        exact_matches = []
        for idx, chunk in enumerate(self.chunks):
            content_lower = (chunk["title"] + " " + chunk["text"]).lower()
            keyword_score = 0.0
            for qt in query_tokens:
                if len(qt) > 3 and qt in content_lower:
                    keyword_score += 0.15
            exact_matches.append(keyword_score)

        final_scores = sim_scores + np.array(exact_matches, dtype=np.float32)

        top_indices = np.argsort(final_scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            chunk_copy = dict(self.chunks[idx])
            chunk_copy["relevance_score"] = float(final_scores[idx])
            results.append(chunk_copy)

        return results

    def get_all_chunks(self) -> List[Dict[str, Any]]:
        return self.chunks

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        # Split into alphanumeric tokens, normalize
        tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
        stopwords = {
            "the", "and", "or", "to", "in", "of", "a", "an", "is", "for", "with", 
            "by", "at", "from", "as", "be", "this", "that", "which", "shall", "may"
        }
        return [t for t in tokens if t not in stopwords]
