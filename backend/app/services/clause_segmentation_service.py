import re
from typing import List, Dict, Any

class ClauseSegmentationService:
    """
    Splits legal documents into structured, semantically indexed clauses
    with title detection, numbering hierarchy, and legal topic classification.
    """

    @classmethod
    def segment(cls, raw_text: str, document_id: str = "") -> List[Dict[str, Any]]:
        if not raw_text.strip():
            return []

        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", raw_text) if p.strip()]
        chunks: List[Dict[str, Any]] = []
        
        current_title = "Preamble / General Provisions"
        current_section_num = "0"
        current_text_lines: List[str] = []
        clause_id = 1

        for para in paragraphs:
            header_info = cls._detect_header(para)
            if header_info:
                if current_text_lines:
                    chunk_text = "\n\n".join(current_text_lines).strip()
                    if chunk_text:
                        chunks.append(cls._format_clause(clause_id, current_title, current_section_num, chunk_text))
                        clause_id += 1
                current_section_num = header_info.get("number", str(clause_id))
                current_title = header_info.get("title", f"Section {current_section_num}")
                current_text_lines = [para]
            else:
                current_text_lines.append(para)

        if current_text_lines:
            chunk_text = "\n\n".join(current_text_lines).strip()
            if chunk_text:
                chunks.append(cls._format_clause(clause_id, current_title, current_section_num, chunk_text))

        if len(chunks) <= 1 and len(raw_text) > 800:
            chunks = cls._fallback_sliding_window(raw_text)

        return chunks

    @classmethod
    def _detect_header(cls, text: str) -> Dict[str, str] | None:
        first_line = text.split("\n")[0].strip()
        if len(first_line) > 120:
            return None

        # Pattern: SECTION / ARTICLE / CLAUSE 1.2
        m1 = re.match(r"^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:\.\-\s]*(.*)$", first_line, re.IGNORECASE)
        if m1:
            num = m1.group(1).strip()
            title = m1.group(2).strip() or f"Section {num}"
            return {"number": num, "title": title}

        # Pattern: 1.1 Heading
        m2 = re.match(r"^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z0-9\s,\-\/]{2,80})$", first_line)
        if m2:
            num = m2.group(1).strip()
            title = m2.group(2).strip()
            return {"number": num, "title": title}

        # All-caps headers
        m3 = re.match(r"^([A-Z\s]{4,50})$", first_line)
        if m3:
            return {"number": "", "title": m3.group(1).strip()}

        for marker in ["WHEREAS", "NOW, THEREFORE", "IN WITNESS WHEREOF", "EXHIBIT A", "SCHEDULE 1"]:
            if first_line.upper().startswith(marker):
                return {"number": "", "title": marker}

        return None

    @classmethod
    def _format_clause(cls, idx: int, title: str, section_num: str, text: str) -> Dict[str, Any]:
        category = cls._classify_category(title, text)
        clean_title = title.title() if title.isupper() else title
        return {
            "id": f"clause-{idx}",
            "clause_index": idx,
            "section_number": section_num,
            "title": clean_title,
            "category": category,
            "text": text,
            "word_count": len(text.split()),
            "char_count": len(text),
            "citation": f"{clean_title} (Section {section_num})" if section_num and section_num != "0" else f"{clean_title} (Clause {idx})"
        }

    @classmethod
    def _classify_category(cls, title: str, text: str) -> str:
        combined = (title + " " + text).lower()
        if any(w in combined for w in ["indemnif", "hold harmless", "defend"]):
            return "Indemnification"
        if any(w in combined for w in ["liability", "consequential", "aggregate liability", "cap"]):
            return "Limitation of Liability"
        if any(w in combined for w in ["confidential", "non-disclosure", "proprietary information"]):
            return "Confidentiality"
        if any(w in combined for w in ["terminat", "cure period", "expiration", "for cause"]):
            return "Termination & Remedies"
        if any(w in combined for w in ["intellectual property", "ip right", "ownership", "inventions"]):
            return "Intellectual Property"
        if any(w in combined for w in ["warrant", "disclaimer", "as is", "merchantability"]):
            return "Warranties & Disclaimers"
        if any(w in combined for w in ["governing law", "jurisdiction", "venue", "arbitration"]):
            return "Governing Law & Disputes"
        if any(w in combined for w in ["payment", "fee", "invoice", "taxes", "billing"]):
            return "Payment & Commercial"
        if any(w in combined for w in ["non-compete", "non-solicit", "restrictive covenant"]):
            return "Restrictive Covenants"
        return "General Legal Terms"

    @classmethod
    def _fallback_sliding_window(cls, text: str) -> List[Dict[str, Any]]:
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        cur = []
        cur_len = 0
        cid = 1
        for p in paras:
            p_len = len(p.split())
            if cur_len + p_len > 250 and cur:
                c_text = "\n\n".join(cur)
                chunks.append(cls._format_clause(cid, f"Section {cid}", str(cid), c_text))
                cid += 1
                cur = [p]
                cur_len = p_len
            else:
                cur.append(p)
                cur_len += p_len
        if cur:
            chunks.append(cls._format_clause(cid, f"Section {cid}", str(cid), "\n\n".join(cur)))
        return chunks
