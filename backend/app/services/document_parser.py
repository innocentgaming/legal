import io
import os
import re
from typing import Dict, Any, List
import pdfplumber
import mammoth
import docx
from backend.app.core.errors import DocumentProcessingError

class DocumentParserService:
    """
    High-fidelity lightweight document parser for PDF, DOCX, and TXT.
    Preserves page boundaries, tables, and structural layout.
    """

    @classmethod
    def parse(cls, filename: str, content: bytes) -> Dict[str, Any]:
        if not content or len(content.strip()) == 0:
            raise DocumentProcessingError(
                f"Document '{filename}' is empty.", 
                details={"filename": filename, "reason": "empty_file"}
            )

        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".pdf", ".docx", ".doc", ".txt", ".md"]:
            raise DocumentProcessingError(
                f"Unsupported file format '{ext}'. Allowed: PDF, DOCX, TXT.",
                details={"filename": filename, "extension": ext}
            )

        try:
            if ext == ".pdf":
                result = cls._parse_pdf(content, filename)
            elif ext in [".docx", ".doc"]:
                result = cls._parse_docx(content, filename)
            else:
                result = cls._parse_text(content, filename)

            # Check if extracted text is empty
            if not result.get("raw_text", "").strip():
                raise DocumentProcessingError(
                    f"No extractable text found in '{filename}'.",
                    details={"filename": filename, "reason": "no_text_extracted"}
                )

            return result
        except DocumentProcessingError:
            raise
        except Exception as e:
            raise DocumentProcessingError(
                f"Failed to parse document '{filename}': {str(e)}", 
                details={"filename": filename, "error": str(e)}
            )

    @classmethod
    def _parse_pdf(cls, content: bytes, filename: str) -> Dict[str, Any]:
        pages_data: List[Dict[str, Any]] = []
        tables_count = 0

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total_pages = len(pdf.pages)
            if total_pages == 0:
                raise DocumentProcessingError(f"PDF '{filename}' contains 0 pages.")

            for idx, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text(layout=False) or ""
                tables = page.extract_tables() or []
                
                if tables:
                    tables_count += len(tables)
                    table_blocks = []
                    for table in tables:
                        rows = [" | ".join([cls._clean_cell(c) for c in row]) for row in table if any(row)]
                        if rows:
                            table_blocks.append("\n[TABLE]\n" + "\n".join(rows) + "\n[/TABLE]")
                    if table_blocks:
                        page_text += "\n" + "\n".join(table_blocks)

                cleaned = cls._normalize_whitespace(page_text)
                pages_data.append({
                    "page_number": idx,
                    "text": cleaned,
                    "char_count": len(cleaned),
                    "word_count": len(cleaned.split())
                })

        # Combine page text preserving page markers
        full_text_list = []
        for p in pages_data:
            if p["text"]:
                full_text_list.append(f"--- [Page {p['page_number']}] ---\n" + p["text"])

        raw_text = "\n\n".join(full_text_list)
        return {
            "filename": filename,
            "document_type": "pdf",
            "page_count": total_pages,
            "tables_found": tables_count,
            "raw_text": raw_text,
            "pages": pages_data
        }

    @classmethod
    def _parse_docx(cls, content: bytes, filename: str) -> Dict[str, Any]:
        docx_io = io.BytesIO(content)
        raw_text = ""
        
        try:
            mammoth_result = mammoth.extract_raw_text(docx_io)
            raw_text = mammoth_result.value
        except Exception:
            docx_io.seek(0)
            doc = docx.Document(docx_io)
            raw_text = "\n\n".join([p.text for p in doc.paragraphs if p.text])

        raw_text = cls._normalize_whitespace(raw_text)
        words = raw_text.split()
        
        # Estimate page count and segment pages
        words_per_page = 350
        estimated_pages = max(1, (len(words) + words_per_page - 1) // words_per_page)
        
        pages_data = []
        paras = [p for p in raw_text.split("\n\n") if p.strip()]
        cur_page = 1
        cur_page_words = 0
        cur_page_paras = []

        for p in paras:
            p_words = len(p.split())
            if cur_page_words + p_words > words_per_page and cur_page_paras:
                pages_data.append({
                    "page_number": cur_page,
                    "text": "\n\n".join(cur_page_paras),
                    "char_count": sum(len(x) for x in cur_page_paras),
                    "word_count": cur_page_words
                })
                cur_page += 1
                cur_page_paras = [p]
                cur_page_words = p_words
            else:
                cur_page_paras.append(p)
                cur_page_words += p_words

        if cur_page_paras:
            pages_data.append({
                "page_number": cur_page,
                "text": "\n\n".join(cur_page_paras),
                "char_count": sum(len(x) for x in cur_page_paras),
                "word_count": cur_page_words
            })

        return {
            "filename": filename,
            "document_type": "docx",
            "page_count": max(1, len(pages_data)),
            "tables_found": 0,
            "raw_text": raw_text,
            "pages": pages_data or [{"page_number": 1, "text": raw_text, "char_count": len(raw_text), "word_count": len(words)}]
        }

    @classmethod
    def _parse_text(cls, content: bytes, filename: str) -> Dict[str, Any]:
        text = ""
        for enc in ["utf-8", "latin-1", "cp1252"]:
            try:
                text = content.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else:
            text = content.decode("utf-8", errors="replace")

        raw_text = cls._normalize_whitespace(text)
        words = raw_text.split()
        words_per_page = 350
        estimated_pages = max(1, (len(words) + words_per_page - 1) // words_per_page)

        pages_data = []
        paras = [p for p in raw_text.split("\n\n") if p.strip()]
        cur_page = 1
        cur_page_words = 0
        cur_page_paras = []

        for p in paras:
            p_words = len(p.split())
            if cur_page_words + p_words > words_per_page and cur_page_paras:
                pages_data.append({
                    "page_number": cur_page,
                    "text": "\n\n".join(cur_page_paras),
                    "char_count": sum(len(x) for x in cur_page_paras),
                    "word_count": cur_page_words
                })
                cur_page += 1
                cur_page_paras = [p]
                cur_page_words = p_words
            else:
                cur_page_paras.append(p)
                cur_page_words += p_words

        if cur_page_paras:
            pages_data.append({
                "page_number": cur_page,
                "text": "\n\n".join(cur_page_paras),
                "char_count": sum(len(x) for x in cur_page_paras),
                "word_count": cur_page_words
            })

        return {
            "filename": filename,
            "document_type": "txt",
            "page_count": max(1, len(pages_data)),
            "tables_found": 0,
            "raw_text": raw_text,
            "pages": pages_data or [{"page_number": 1, "text": raw_text, "char_count": len(raw_text), "word_count": len(words)}]
        }

    @classmethod
    def _normalize_whitespace(cls, text: str) -> str:
        if not text:
            return ""
        # Normalize CRLF to LF
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Replace non-breaking spaces
        text = text.replace("\xa0", " ")
        # Replace tab with 4 spaces
        text = text.replace("\t", "    ")
        # Normalize spaces per line
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        # Group lines preserving paragraph breaks (multiple blank lines become double newline)
        normalized = "\n".join(lines)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized.strip()

    @staticmethod
    def _clean_cell(cell: Any) -> str:
        if cell is None:
            return ""
        return str(cell).replace("\n", " ").strip()
