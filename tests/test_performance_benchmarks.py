import io
import time
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.document_parser import DocumentParserService
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.embedding_service import EmbeddingService
from backend.app.services.retrieval_service import RetrievalService
from backend.app.services.grounded_answer_service import GroundedAnswerService
from backend.app.services.ingestion_service import ingestion_service
from backend.app.utils.sample_contracts import SAMPLE_SAAS_MSA

client = TestClient(app)

BENCHMARK_CONTRACT = SAMPLE_SAAS_MSA

def test_performance_pipeline_benchmarking():
    """
    Measures and validates execution latency across all pipeline stages:
    1. Upload time
    2. Parsing time
    3. Segmentation time
    4. Embedding & Indexing time
    5. Retrieval time
    6. Grounded QA response time
    """
    raw_bytes = BENCHMARK_CONTRACT.encode("utf-8")
    timings = {}

    # 1. Measure Upload Time (HTTP stream processing)
    t0 = time.perf_counter()
    res_upload = client.post(
        "/api/documents/upload",
        files={"file": ("Benchmark_Contract.txt", io.BytesIO(raw_bytes), "text/plain")}
    )
    t_upload = (time.perf_counter() - t0) * 1000
    assert res_upload.status_code == 200
    timings["Upload & Ingestion Total (ms)"] = round(t_upload, 2)

    # 2. Measure Parsing Time (in-memory parsing)
    t0 = time.perf_counter()
    parsed = DocumentParserService.parse("Benchmark_Contract.txt", raw_bytes)
    t_parse = (time.perf_counter() - t0) * 1000
    assert parsed["document_type"] == "txt"
    timings["Parsing Time (ms)"] = round(t_parse, 2)

    # 3. Measure Segmentation Time
    t0 = time.perf_counter()
    sections = ClauseSegmentationService.segment_document(parsed)
    t_segment = (time.perf_counter() - t0) * 1000
    assert len(sections) > 0
    timings["Segmentation Time (ms)"] = round(t_segment, 2)

    # 4. Measure Embedding & Indexing Time
    flat_clauses = [c.to_dict() for s in sections for c in s.clauses]
    retriever = RetrievalService()
    t0 = time.perf_counter()
    retriever.index_clauses(flat_clauses)
    t_embed = (time.perf_counter() - t0) * 1000
    timings["Embedding & Vector Indexing Time (ms)"] = round(t_embed, 2)

    # 5. Measure Retrieval Time (Vector dot product + keyword boost)
    t0 = time.perf_counter()
    results = retriever.search("What is the limitation of liability cap?", top_k=4)
    t_retrieval = (time.perf_counter() - t0) * 1000
    assert len(results) > 0
    timings["Retrieval Time (ms)"] = round(t_retrieval, 2)

    # 6. Measure Grounded QA Engine Response Time
    import asyncio
    t0 = time.perf_counter()
    qa_res = asyncio.run(GroundedAnswerService.answer(
        question="What is the limitation of liability cap?",
        history=None,
        retrieved_chunks=results
    ))
    t_qa = (time.perf_counter() - t0) * 1000
    timings["Grounded QA Engine Time (ms)"] = round(t_qa, 2)

    print("\n" + "=" * 60)
    print("  CLARITY PERFORMANCE & LATENCY BENCHMARKS")
    print("=" * 60)
    for k, v in timings.items():
        print(f"  * {k:<40} : {v:>7.2f} ms")
    print("=" * 60)

    # Latency Assertions (Performance guarantees)
    assert t_parse < 100.0, f"Parsing took {t_parse}ms, expected < 100ms"
    assert t_segment < 200.0, f"Segmentation took {t_segment}ms, expected < 200ms"
    assert t_embed < 50.0, f"Embedding indexing took {t_embed}ms, expected < 50ms"
    assert t_retrieval < 20.0, f"Retrieval took {t_retrieval}ms, expected < 20ms"
    assert t_qa < 2000.0, f"Grounded QA took {t_qa}ms, expected < 2000ms"

def test_caching_and_repeat_latency_benchmarks():
    """
    Tests and benchmarks before/after latency for repeat comparisons and repeat retrievals.
    Validates cache hit performance and cache invalidation on modified input.
    """
    from backend.app.services.comparison_service import ComparisonService
    
    # 1. Benchmark RetrievalService Pre-Caching and Repeat Query Performance
    raw_bytes = BENCHMARK_CONTRACT.encode("utf-8")
    parsed = DocumentParserService.parse("Benchmark_Contract.txt", raw_bytes)
    sections = ClauseSegmentationService.segment_document(parsed)
    flat_clauses = [c.to_dict() for s in sections for c in s.clauses]

    # Initialize with pre-cached index
    retriever = RetrievalService(clauses=flat_clauses)
    assert retriever.doc_matrix is not None
    assert len(retriever.vocab) > 0

    # Cold Retrieval (first query call)
    t0 = time.perf_counter()
    cold_results = retriever.search("indemnification liabilities", top_k=4)
    cold_retrieval_ms = (time.perf_counter() - t0) * 1000

    # Repeat Retrieval (cache hit)
    t0 = time.perf_counter()
    warm_results = retriever.search("indemnification liabilities", top_k=4)
    warm_retrieval_ms = (time.perf_counter() - t0) * 1000

    assert len(cold_results) == len(warm_results)
    assert warm_retrieval_ms <= cold_retrieval_ms or warm_retrieval_ms < 1.0

    # Test Invalidation on build_index
    retriever.build_index(flat_clauses[:2])
    assert len(retriever._query_cache) == 0

    # 2. Benchmark ComparisonService Cold vs Repeat Cached Comparison
    doc_a = BENCHMARK_CONTRACT
    doc_b = BENCHMARK_CONTRACT.replace("October 1, 2026", "November 1, 2026")

    # Clear comparison cache to measure cold
    ComparisonService._cache.clear()
    t0 = time.perf_counter()
    res_cold = ComparisonService.compare_two_documents(doc_a, doc_b, "v1", "v2")
    cold_compare_ms = (time.perf_counter() - t0) * 1000

    # Repeat Comparison (cache hit)
    t0 = time.perf_counter()
    res_warm = ComparisonService.compare_two_documents(doc_a, doc_b, "v1", "v2")
    warm_compare_ms = (time.perf_counter() - t0) * 1000

    assert res_cold["summary"]["total_pairs"] == res_warm["summary"]["total_pairs"]
    assert warm_compare_ms < 1.0, f"Cached comparison took {warm_compare_ms}ms, expected < 1.0ms"

    print("\n" + "=" * 60)
    print("  REPEAT LATENCY & CACHING BENCHMARKS")
    print("=" * 60)
    print(f"  * Cold Retrieval Latency          : {cold_retrieval_ms:>7.2f} ms")
    print(f"  * Repeat Retrieval (Cache Hit)    : {warm_retrieval_ms:>7.2f} ms")
    print(f"  * Cold Comparison Latency         : {cold_compare_ms:>7.2f} ms")
    print(f"  * Repeat Comparison (Cache Hit)   : {warm_compare_ms:>7.2f} ms")
    print("=" * 60)
