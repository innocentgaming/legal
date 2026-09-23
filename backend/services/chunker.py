import re
from typing import List, Dict, Any

class LegalChunker:
    """
    Intelligent legal clause segmenter.
    Splits legal documents into discrete, semantically indexed clauses
    with section detection, numbering preservation, and citation metadata.
    """

    # Common legal section patterns
    SECTION_PATTERNS = [
        # Article / Section Roman or Numeric: "ARTICLE IV", "Section 12.3", "Clause 5"
        r"(?:^|\n)(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:\.\-\s]+([^\n\r]+)",
        # Numbered Headings: "1. Term", "1.1 Confidentiality", "12.3.1 Indemnification"
        r"(?:^|\n)([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Z][A-Za-z0-9\s,\-\/]{2,50})(?:\.|\n|:)",
        # All-caps headers: "INDEMNIFICATION", "LIMITATION OF LIABILITY"
        r"(?:^|\n)([A-Z\s]{4,40})(?:\:|\n|$)",
        # Standard Legal Transitional markers
        r"(?:^|\n)(WHEREAS|NOW, THEREFORE|IN WITNESS WHEREOF|MISCELLANEOUS|GOVERNING LAW|SEVERABILITY|ENTIRE AGREEMENT)"
    ]

    @classmethod
    def segment_document(cls, parsed_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw_text = parsed_doc.get("raw_text", "")
        if not raw_text.strip():
            return []

        # Split by potential section markers while retaining headers
        # We perform a structured line and paragraph scan
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", raw_text) if p.strip()]
        
        chunks: List[Dict[str, Any]] = []
        current_title = "Preamble / General Provisions"
        current_section_num = "0"
        current_text_lines: List[str] = []
        clause_id = 1

        for para in paragraphs:
            # Check if this paragraph starts a new section
            detected_header = cls._detect_header(para)
            
            if detected_header:
                if current_text_lines:
                    # Save previous chunk
                    chunk_text = "\n\n".join(current_text_lines).strip()
                    if chunk_text:
                        chunks.append(cls._create_chunk(
                            clause_id=clause_id,
                            title=current_title,
                            section_num=current_section_num,
                            text=chunk_text,
                            parsed_doc=parsed_doc
                        ))
                        clause_id += 1
                
                # Start new section
                current_section_num = detected_header.get("number", str(clause_id))
                current_title = detected_header.get("title", f"Section {current_section_num}")
                current_text_lines = [para]
            else:
                current_text_lines.append(para)

        # Flush remaining text
        if current_text_lines:
            chunk_text = "\n\n".join(current_text_lines).strip()
            if chunk_text:
                chunks.append(cls._create_chunk(
                    clause_id=clause_id,
                    title=current_title,
                    section_num=current_section_num,
                    text=chunk_text,
                    parsed_doc=parsed_doc
                ))

        # If document had no distinct sections, fall back to sliding window or paragraph splitting
        if len(chunks) <= 1 and len(raw_text) > 800:
            chunks = cls._fallback_sliding_window(raw_text, parsed_doc)

        return chunks

    @classmethod
    def _detect_header(cls, text: str) -> Dict[str, str] | None:
        first_line = text.split("\n")[0].strip()
        if len(first_line) > 120:
            return None

        # Check section regexes
        m1 = re.match(r"^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:\.\-\s]*(.*)$", first_line, re.IGNORECASE)
        if m1:
            num = m1.group(1).strip()
            title = m1.group(2).strip() or f"Section {num}"
            return {"number": num, "title": title}

        m2 = re.match(r"^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z0-9\s,\-\/]{2,80})$", first_line)
        if m2:
            num = m2.group(1).strip()
            title = m2.group(2).strip()
            return {"number": num, "title": title}

        m3 = re.match(r"^([A-Z\s]{4,50})$", first_line)
        if m3:
            title = m3.group(1).strip()
            return {"number": "", "title": title}

        for marker in ["WHEREAS", "NOW, THEREFORE", "IN WITNESS WHEREOF", "EXHIBIT A", "SCHEDULE 1"]:
            if first_line.upper().startswith(marker):
                return {"number": "", "title": marker}

        return None

    @classmethod
    def _create_chunk(cls, clause_id: int, title: str, section_num: str, text: str, parsed_doc: Dict[str, Any]) -> Dict[str, Any]:
        # Estimate page and line reference
        category = cls._classify_legal_topic(title, text)
        return {
            "id": f"clause-{clause_id}",
            "clause_index": clause_id,
            "section_number": section_num,
            "title": title.title() if title.isupper() else title,
            "category": category,
            "text": text,
            "word_count": len(text.split()),
            "char_count": len(text),
            "citation": f"{title} (Clause {clause_id})" if title else f"Clause {clause_id}"
        }

    @classmethod
    def _classify_legal_topic(cls, title: str, text: str) -> str:
        content = (title + " " + text).lower()
        if any(w in content for w in ["indemnif", "hold harmless", "defend"]):
            return "Indemnification"
        if any(w in content for w in ["liability", "consequential", "aggregate liability", "cap"]):
            return "Limitation of Liability"
        if any(w in content for w in ["confidential", "non-disclosure", "proprietary information"]):
            return "Confidentiality"
        if any(w in content for w in ["terminat", "cure period", "expiration", "convenience"]):
            return "Termination & Remedies"
        if any(w in content for w in ["intellectual property", "ip right", "ownership", "work product"]):
            return "Intellectual Property"
        if any(w in content for w in ["warrant", "as is", "merchantability"]):
            return "Warranties & Disclaimers"
        if any(w in content for w in ["governing law", "jurisdiction", "venue", "arbitration"]):
            return "Governing Law & Disputes"
        if any(w in content for w in ["payment", "fee", "invoice", "taxes", "billing"]):
            return "Payment & Commercial Terms"
        if any(w in content for w in ["non-compete", "non-solicit", "restrictive covenant"]):
            return "Restrictive Covenants"
        return "General Legal Terms"

    @classmethod
    def _fallback_sliding_window(cls, text: str, parsed_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = []
        current_len = 0
        cid = 1

        for p in paras:
            p_len = len(p.split())
            if current_len + p_len > 250 and current_chunk:
                c_text = "\n\n".join(current_chunk)
                chunks.append(cls._create_chunk(cid, f"Section {cid}", str(cid), c_text, parsed_doc))
                cid += 1
                current_chunk = [p]
                current_len = p_len
            else:
                current_chunk.append(p)
                current_len += p_len

        if current_chunk:
            c_text = "\n\n".join(current_chunk)
            chunks.append(cls._create_chunk(cid, f"Section {cid}", str(cid), c_text, parsed_doc))

        return chunks
