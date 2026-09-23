import re
import math
from typing import List, Dict, Any, Tuple
import numpy as np

class EmbeddingService:
    """
    Lightweight vector and lexical embedding generator.
    Zero external model downloads or heavy weights required.
    """

    STOPWORDS = {
        "the", "and", "or", "to", "in", "of", "a", "an", "is", "for", "with", 
        "by", "at", "from", "as", "be", "this", "that", "which", "shall", "may",
        "are", "such", "any", "other", "all", "on", "not", "have", "has", "but"
    }

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
        return [t for t in tokens if t not in cls.STOPWORDS]

    @classmethod
    def compute_tfidf_matrix(cls, corpus: List[str]) -> Tuple[np.ndarray, Dict[str, int], Dict[str, float]]:
        tokenized_docs = [cls.tokenize(doc) for doc in corpus]
        N = len(corpus)
        if N == 0:
            return np.zeros((0, 0), dtype=np.float32), {}, {}

        # Compute document frequencies
        df: Dict[str, int] = {}
        for tokens in tokenized_docs:
            for term in set(tokens):
                df[term] = df.get(term, 0) + 1

        # Compute BM25-smoothed IDF
        idf = {term: math.log(1.0 + (N - count + 0.5) / (count + 0.5)) for term, count in df.items()}
        vocab = {term: i for i, term in enumerate(idf.keys())}
        vocab_size = len(vocab)

        matrix = np.zeros((N, vocab_size), dtype=np.float32)
        for d_idx, tokens in enumerate(tokenized_docs):
            if not tokens:
                continue
            d_len = len(tokens)
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            for term, count in tf.items():
                if term in vocab:
                    matrix[d_idx, vocab[term]] = (count / d_len) * idf[term]

        # L2-normalize
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        normalized_matrix = matrix / norms

        return normalized_matrix, vocab, idf

    @classmethod
    def encode_query(cls, query: str, vocab: Dict[str, int], idf: Dict[str, float]) -> np.ndarray:
        tokens = cls.tokenize(query)
        q_vec = np.zeros((1, len(vocab)), dtype=np.float32)
        if not tokens or not vocab:
            return q_vec

        q_len = len(tokens)
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1

        for term, count in tf.items():
            if term in vocab:
                q_vec[0, vocab[term]] = (count / q_len) * idf[term]

        norm = np.linalg.norm(q_vec)
        if norm > 0:
            q_vec = q_vec / norm
        return q_vec
