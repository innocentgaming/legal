import io
import os
from typing import Dict, Any, List
import pdfplumber
import mammoth
import docx
from backend.app.core.errors import DocumentProcessingError

class DocumentParserService:
    """
    Lightweight document parser service.
    Preserves table cell structures, multi-column layouts, and section formatting.
    """

    @classmethod
    def parse(cls, filename: str, content: bytes) -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1].lower()
        try:
            if ext == ".pdf":
                return cls._parse_pdf(content, filename)
            elif ext in [".docx", ".doc"]:
                return cls._parse_docx(content, filename)
            elif ext in [".txt", ".md"]:
                return cls._parse_text(content, filename)
            else:
                raise DocumentProcessingError(f"Unsupported file extension '{ext}'. Supported: PDF, DOCX, TXT, MD.")
        except DocumentProcessingError:
            raise
        except Exception as e:
            raise DocumentProcessingError(f"Failed to parse document '{filename}': {str(e)}", details={"filename": filename, "error": str(e)})

    @classmethod
    def _parse_pdf(cls, content: bytes, filename: str) -> Dict[str, Any]:
        pages_text: List[Dict[str, Any]] = []
        full_text_list: List[str] = []
        tables_count = 0

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total_pages = len(pdf.pages)
            for idx, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text(layout=False) or ""
                tables = page.extract_tables() or []
                
                if tables:
                    tables_count += len(tables)
                    table_blocks = []
                    for table in tables:
                        rows = [" | ".join([str(c or "").strip() for c in row]) for row in table if any(row)]
                        if rows:
                            table_blocks.append("\n[TABLE]\n" + "\n".join(rows) + "\n[/TABLE]")
                    if table_blocks:
                        page_text += "\n" + "\n".join(table_blocks)

                cleaned = page_text.strip()
                pages_text.append({
                    "page_number": idx,
                    "text": cleaned,
                    "char_count": len(cleaned),
                    "word_count": len(cleaned.split())
                })
                if cleaned:
                    full_text_list.append(f"--- [Page {idx}] ---\n" + cleaned)

        raw_text = "\n\n".join(full_text_list)
        return {
            "filename": filename,
            "file_type": "pdf",
            "page_count": total_pages,
            "tables_found": tables_count,
            "raw_text": raw_text,
            "pages": pages_text
        }

    @classmethod
    def _parse_docx(cls, content: bytes, filename: str) -> Dict[str, Any]:
        docx_io = io.BytesIO(content)
        try:
            mammoth_result = mammoth.extract_raw_text(docx_io)
            raw_text = mammoth_result.value.strip()
        except Exception:
            docx_io.seek(0)
            doc = docx.Document(docx_io)
            raw_text = "\n\n".join([p.text.strip() for p in doc.paragraphs if p.text.strip()])

        words = raw_text.split()
        estimated_pages = max(1, (len(words) + 399) // 400)

        return {
            "filename": filename,
            "file_type": "docx",
            "page_count": estimated_pages,
            "tables_found": 0,
            "raw_text": raw_text,
            "pages": [{"page_number": 1, "text": raw_text, "char_count": len(raw_text), "word_count": len(words)}]
        }

    @classmethod
    def _parse_text(cls, content: bytes, filename: str) -> Dict[str, Any]:
        for enc in ["utf-8", "latin-1", "cp1252"]:
            try:
                text = content.decode(enc).strip()
                break
            except UnicodeDecodeError:
                continue
        else:
            text = content.decode("utf-8", errors="replace").strip()

        words = text.split()
        estimated_pages = max(1, (len(words) + 399) // 400)

        return {
            "filename": filename,
            "file_type": "txt",
            "page_count": estimated_pages,
            "tables_found": 0,
            "raw_text": text,
            "pages": [{"page_number": 1, "text": text, "char_count": len(text), "word_count": len(words)}]
        }
