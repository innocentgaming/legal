import re
from typing import List, Dict, Any, Tuple
from backend.app.models.document import SectionModel, ClauseModel

class ClauseSegmentationService:
    """
    Intelligent structural legal clause segmenter.
    Preserves legal headings, section numbering, and paragraph boundaries.
    Generates stable formatted IDs: SEC-001, CLAUSE-001, CLAUSE-002.
    """

    # Section / Article header patterns
    SECTION_HEADER_PATTERNS = [
        # SECTION / ARTICLE / CLAUSE 1.2: Title
        r"^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:\.\-\s]*(.*)$",
        # 1. Title or 1.1 Title
        r"^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z0-9\s,\-\/\(\)\&\:\'\"]{2,90})$",
        # All-caps legal title (e.g., "INDEMNIFICATION", "LIMITATION OF LIABILITY")
        r"^([A-Z\s\-\/\&]{4,55})$",
        # Standard legal lead markers
        r"^(WHEREAS|NOW, THEREFORE|IN WITNESS WHEREOF|EXHIBIT\s+[A-Z0-9]+|SCHEDULE\s+[A-Z0-9]+)(.*)$"
    ]

    # Subsection numbering patterns within a section (e.g. "4.1", "(a)", "(i)", "12.3.1")
    SUBSECTION_PATTERNS = [
        r"^([0-9]+\.[0-9]+(?:\.[0-9]+)*)\.?\s*(.*)$",
        r"^(\([a-z0-9ivx]+\))\s*(.*)$",
        r"^([a-z]\))\s*(.*)$"
    ]

    @classmethod
    def segment(cls, text_or_doc: Any) -> List[Dict[str, Any]]:
        """
        Convenience segmenter returning flattened clause dictionaries.
        """
        if isinstance(text_or_doc, dict):
            parsed = text_or_doc
        elif isinstance(text_or_doc, str):
            parsed = {"raw_text": text_or_doc, "pages": []}
        else:
            parsed = {"raw_text": str(text_or_doc), "pages": []}

        sections = cls.segment_document(parsed)
        flat_clauses = []
        for s in sections:
            for c in s.clauses:
                flat_clauses.append({
                    "clause_id": c.clause_id,
                    "clause_number": c.clause_number,
                    "title": c.title,
                    "original_text": c.original_text,
                    "text": c.original_text,
                    "page": c.page,
                    "section_id": c.section_id,
                    "category": c.category
                })
        return flat_clauses

    @classmethod
    def segment_document(cls, parsed_doc: Dict[str, Any]) -> List[SectionModel]:
        raw_text = parsed_doc.get("raw_text", "")
        pages = parsed_doc.get("pages", [])
        
        if not raw_text.strip():
            return []

        # Preprocess lines to preserve paragraph and clause boundaries
        normalized_paragraphs = cls._preprocess_into_paragraphs(raw_text)
        
        sections: List[SectionModel] = []
        clause_global_index = 1
        section_global_index = 1

        # Default initial section
        cur_section_num = "0"
        cur_section_title = "Preamble & General Recitals"
        cur_section_paragraphs: List[Tuple[str, int]] = []

        for p in normalized_paragraphs:
            p_clean, page_hint = cls._extract_page_marker(p)
            if not p_clean:
                continue

            detected_header = cls._detect_section_header(p_clean)

            if detected_header:
                # Flush existing section if it had content
                if cur_section_paragraphs:
                    sec = cls._build_section(
                        section_idx=section_global_index,
                        section_num=cur_section_num,
                        title=cur_section_title,
                        paragraphs=cur_section_paragraphs,
                        start_clause_idx=clause_global_index,
                        pages_data=pages
                    )
                    if sec.clauses:
                        sections.append(sec)
                        clause_global_index += len(sec.clauses)
                        section_global_index += 1

                # Start new section
                cur_section_num = detected_header.get("number", str(section_global_index))
                cur_section_title = detected_header.get("title", f"Section {cur_section_num}")
                
                # If the header line had inline text (e.g., "1. SERVICES: Provider will..."),
                # preserve the remainder as a paragraph
                remainder = detected_header.get("remainder", "").strip()
                if remainder:
                    cur_section_paragraphs = [(remainder, page_hint)]
                else:
                    # If paragraph had more lines after header line
                    lines = [ln.strip() for ln in p_clean.split("\n") if ln.strip()]
                    if len(lines) > 1:
                        cur_section_paragraphs = [("\n".join(lines[1:]), page_hint)]
                    else:
                        cur_section_paragraphs = []
            else:
                cur_section_paragraphs.append((p_clean, page_hint))

        # Flush final section
        if cur_section_paragraphs:
            sec = cls._build_section(
                section_idx=section_global_index,
                section_num=cur_section_num,
                title=cur_section_title,
                paragraphs=cur_section_paragraphs,
                start_clause_idx=clause_global_index,
                pages_data=pages
            )
            if sec.clauses:
                sections.append(sec)

        # Fallback if document has no clear section markers
        if not sections and normalized_paragraphs:
            sections = cls._fallback_segmentation(normalized_paragraphs, pages)

        return sections

    @classmethod
    def _preprocess_into_paragraphs(cls, raw_text: str) -> List[str]:
        """
        Intelligently breaks raw text into legal clause / paragraph blocks
        preserving page markers and section/clause boundaries.
        """
        raw_blocks = [b.strip() for b in raw_text.split("\n\n") if b.strip()]
        result_paragraphs: List[str] = []

        for block in raw_blocks:
            lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
            if not lines:
                continue

            cur_buf: List[str] = []
            for i, line in enumerate(lines):
                if line.startswith("--- [Page"):
                    if cur_buf:
                        result_paragraphs.append("\n".join(cur_buf))
                        cur_buf = []
                    result_paragraphs.append(line)
                    continue

                # Check if this line is a section or numbered clause start
                is_boundary = cls._is_structural_line_start(line)
                if is_boundary and cur_buf:
                    result_paragraphs.append("\n".join(cur_buf))
                    cur_buf = [line]
                else:
                    cur_buf.append(line)

            if cur_buf:
                result_paragraphs.append("\n".join(cur_buf))

        return result_paragraphs

    @classmethod
    def _is_structural_line_start(cls, line: str) -> bool:
        if re.match(r"^(?:SECTION|ARTICLE|CLAUSE)\s+[0-9IVXLCDM]+", line, re.IGNORECASE):
            return True
        if re.match(r"^[0-9]+(?:\.[0-9]+)*\.?\s+[A-Z]", line):
            return True
        if re.match(r"^[0-9]+\.[0-9]+(?:\.[0-9]+)*", line):
            return True
        if re.match(r"^\([a-z0-9ivx]+\)\s+", line, re.IGNORECASE):
            return True
        if re.match(r"^[A-Z\s\-\/\&]{4,55}$", line) and len(line.split()) <= 8:
            return True
        return False

    @classmethod
    def _detect_section_header(cls, text: str) -> Dict[str, str] | None:
        first_line = text.split("\n")[0].strip()
        if len(first_line) > 120 or len(first_line) < 3:
            return None

        # 1. SECTION / ARTICLE / CLAUSE 1.2: Title [Remainder]
        m1 = re.match(r"^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:\.\-\s]*(.*?)(?::\s*(.*))?$", first_line, re.IGNORECASE)
        if m1:
            num = m1.group(1).strip()
            title = m1.group(2).strip() or f"Section {num}"
            remainder = m1.group(3) or ""
            return {"number": num, "title": title, "remainder": remainder}

        # 2. 1. Title: Remainder (e.g. 1. SERVICES: Provider will...)
        m_inline = re.match(r"^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z0-9\s,\-\/\(\)\&]{2,45}):\s+(.*)$", first_line)
        if m_inline:
            num = m_inline.group(1).strip()
            title = m_inline.group(2).strip()
            remainder = m_inline.group(3).strip()
            return {"number": num, "title": title, "remainder": remainder}

        # 3. 1. Title or 1.1 Title
        m2 = re.match(r"^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z0-9\s,\-\/\(\)\&\:\'\"]{2,90})$", first_line)
        if m2:
            num = m2.group(1).strip()
            title = m2.group(2).strip()
            return {"number": num, "title": title, "remainder": ""}

        # 4. All-caps legal title (e.g. INDEMNIFICATION)
        m3 = re.match(r"^([A-Z\s\-\/\&]{4,55})$", first_line)
        if m3 and len(first_line.split()) <= 7:
            title = m3.group(1).strip()
            return {"number": "", "title": title, "remainder": ""}

        # 5. Standard legal lead markers
        for marker in ["WHEREAS", "NOW, THEREFORE", "IN WITNESS WHEREOF", "EXHIBIT", "SCHEDULE"]:
            if first_line.upper().startswith(marker):
                return {"number": "", "title": first_line[:50], "remainder": ""}

        return None

    @classmethod
    def _build_section(
        cls,
        section_idx: int,
        section_num: str,
        title: str,
        paragraphs: List[Tuple[str, int]],
        start_clause_idx: int,
        pages_data: List[Dict[str, Any]]
    ) -> SectionModel:
        sec_id = f"SEC-{section_idx:03d}"
        clean_title = title.title() if title.isupper() and len(title) > 4 else title
        sec = SectionModel(section_id=sec_id, title=clean_title, section_number=section_num)

        clause_counter = start_clause_idx
        cur_clause_paragraphs: List[str] = []
        cur_clause_num = section_num
        cur_page = paragraphs[0][1] if (paragraphs and paragraphs[0][1] > 0) else 1

        for p_text, p_page in paragraphs:
            if p_page > 0:
                cur_page = p_page

            # Check if paragraph has subsection marker (e.g. "4.1", "(a)")
            subsec_match = cls._detect_subsection(p_text)
            
            if subsec_match:
                if cur_clause_paragraphs:
                    # Save previous clause
                    c_text = "\n\n".join(cur_clause_paragraphs).strip()
                    if c_text:
                        clause_id = f"CLAUSE-{clause_counter:03d}"
                        cat = cls._classify_category(clean_title, c_text)
                        sec.clauses.append(ClauseModel(
                            clause_id=clause_id,
                            clause_number=cur_clause_num,
                            original_text=c_text,
                            page=max(1, cur_page),
                            title=clean_title,
                            section_id=sec_id,
                            category=cat
                        ))
                        clause_counter += 1

                cur_clause_num = subsec_match.get("number", f"{section_num}.{len(sec.clauses)+1}")
                cur_clause_paragraphs = [p_text]
            else:
                cur_clause_paragraphs.append(p_text)

        # Flush final clause
        if cur_clause_paragraphs:
            c_text = "\n\n".join(cur_clause_paragraphs).strip()
            if c_text:
                clause_id = f"CLAUSE-{clause_counter:03d}"
                cat = cls._classify_category(clean_title, c_text)
                sec.clauses.append(ClauseModel(
                    clause_id=clause_id,
                    clause_number=cur_clause_num,
                    original_text=c_text,
                    page=max(1, cur_page),
                    title=clean_title,
                    section_id=sec_id,
                    category=cat
                ))

        return sec

    @classmethod
    def _detect_subsection(cls, text: str) -> Dict[str, str] | None:
        first_line = text.split("\n")[0].strip()
        m1 = re.match(r"^([0-9]+\.[0-9]+(?:\.[0-9]+)*)\.?\s*(.*)$", first_line)
        if m1:
            return {"number": m1.group(1).strip(), "title": m1.group(2).strip()[:50]}

        m2 = re.match(r"^(\([a-z0-9ivx]+\))\s*(.*)$", first_line, re.IGNORECASE)
        if m2:
            return {"number": m2.group(1).strip(), "title": m2.group(2).strip()[:50]}

        return None

    @classmethod
    def _extract_page_marker(cls, text: str) -> Tuple[str, int]:
        m = re.search(r"---\s*\[Page\s*(\d+)\]\s*---", text)
        page_num = 1
        if m:
            page_num = int(m.group(1))
            cleaned = re.sub(r"---\s*\[Page\s*\d+\]\s*---", "", text).strip()
            return cleaned, page_num
        return text.strip(), 1

    @classmethod
    def _classify_category(cls, title: str, text: str) -> str:
        combined = (title + " " + text).lower()
        if any(w in combined for w in ["indemnif", "hold harmless", "defend"]):
            return "Indemnification"
        if any(w in combined for w in ["liability", "consequential", "aggregate liability", "cap"]):
            return "Limitation of Liability"
        if any(w in combined for w in ["confidential", "non-disclosure", "proprietary information", "trade secret"]):
            return "Confidentiality"
        if any(w in combined for w in ["terminat", "cure period", "expiration", "for cause", "convenience"]):
            return "Termination & Remedies"
        if any(w in combined for w in ["intellectual property", "ip right", "ownership", "inventions", "work product"]):
            return "Intellectual Property"
        if any(w in combined for w in ["warrant", "disclaimer", "as is", "merchantability", "fitness"]):
            return "Warranties & Disclaimers"
        if any(w in combined for w in ["governing law", "jurisdiction", "venue", "arbitration", "dispute"]):
            return "Governing Law & Disputes"
        if any(w in combined for w in ["payment", "fee", "invoice", "taxes", "billing", "late payment"]):
            return "Payment & Commercial"
        if any(w in combined for w in ["non-compete", "non-solicit", "restrictive covenant"]):
            return "Restrictive Covenants"
        return "General Legal Terms"

    @classmethod
    def _fallback_segmentation(cls, paragraphs: List[str], pages_data: List[Dict[str, Any]]) -> List[SectionModel]:
        sec = SectionModel(section_id="SEC-001", title="General Contract Terms", section_number="1")
        for i, p in enumerate(paragraphs, start=1):
            clause_id = f"CLAUSE-{i:03d}"
            cat = cls._classify_category("General", p)
            sec.clauses.append(ClauseModel(
                clause_id=clause_id,
                clause_number=str(i),
                original_text=p,
                page=1,
                title=f"Clause {i}",
                section_id="SEC-001",
                category=cat
            ))
        return [sec]
