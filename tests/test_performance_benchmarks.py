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
    assert t_qa < 150.0, f"Grounded QA took {t_qa}ms, expected < 150ms"
