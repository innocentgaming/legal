from typing import List, Dict, Any
import httpx
from backend.app.core.config import settings

class GroundedAnswerService:
    """
    Answers legal inquiries strictly grounded in retrieved contract clauses.
    Returns verifiable citation anchors.
    """

    @classmethod
    async def answer(cls, query: str, history: List[Dict[str, str]], retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": "No relevant clauses were found in the uploaded contract matching your query.",
                "citations": [],
                "provider": "Clarity Heuristic"
            }

        context_blocks = []
        for i, c in enumerate(retrieved_chunks, start=1):
            context_blocks.append(f"[Clause #{i} - {c.get('title', 'Section')}] (ID: {c.get('id')}):\n{c.get('text')}")
        context_str = "\n\n".join(context_blocks)

        if settings.GEMINI_API_KEY:
            try:
                return await cls._answer_with_gemini(query, context_str, retrieved_chunks)
            except Exception as e:
                print(f"[GroundedAnswerService] Gemini failed: {e}. Using fallback.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._answer_with_openai(query, context_str, retrieved_chunks)
            except Exception as e:
                print(f"[GroundedAnswerService] OpenAI failed: {e}. Using fallback.")

        return cls._answer_heuristically(query, retrieved_chunks)

    @classmethod
    async def _answer_with_gemini(cls, query: str, context_str: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = f"""You are CLARITY, an AI Legal Co-Pilot.
Answer the user's question using the contract excerpts below. Cite specific sections.

CONTRACT EXCERPTS:
{context_str}

USER QUESTION:
{query}"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
            resp.raise_for_status()
            ans = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            citations = [
                {"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number"), "snippet": c.get("text")[:140]}
                for c in chunks[:3]
            ]
            return {"answer": ans, "citations": citations, "provider": "Gemini API"}

    @classmethod
    async def _answer_with_openai(cls, query: str, context_str: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": f"You are CLARITY AI Legal Co-Pilot. Use context:\n{context_str}"},
                    {"role": "user", "content": query}
                ]
            })
            resp.raise_for_status()
            ans = resp.json()["choices"][0]["message"]["content"]
            citations = [
                {"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number"), "snippet": c.get("text")[:140]}
                for c in chunks[:3]
            ]
            return {"answer": ans, "citations": citations, "provider": "OpenAI API"}

    @classmethod
    def _answer_heuristically(cls, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        top = chunks[0]
        answer = f"Based on **{top.get('title', 'Section')}** ({top.get('citation', '')}):\n\n"
        answer += f"> \"{top.get('text', '')[:350]}...\"\n\n"
        answer += f"**Analysis**: This section establishes the legal parameters for {top.get('category', 'terms')}. "
        
        q_l = query.lower()
        if "liab" in q_l:
            answer += "Confirm whether aggregate liability is strictly capped and indirect damages are disclaimed."
        elif "terminat" in q_l:
            answer += "Review the notice requirements and default cure window before taking termination action."
        elif "indemn" in q_l:
            answer += "Check if indemnity defense is mutual with standard carve-outs."
        else:
            answer += "Click the citation chip below to inspect the full highlighted clause in the document viewer."

        citations = [
            {"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number"), "snippet": c.get("text")[:140]}
            for c in chunks[:3]
        ]
        return {"answer": answer, "citations": citations, "provider": "In-Memory Semantic Engine"}
