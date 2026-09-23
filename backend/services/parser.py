import io
import os
from typing import Dict, Any, List
import pdfplumber
import mammoth
import docx

class DocumentParser:
    """
    High-fidelity lightweight document parser supporting PDF, DOCX, and TXT.
    Preserves structural headers, paragraph numbering, page counts, and tables.
    """

    @classmethod
    def parse_file(cls, filename: str, content: bytes) -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return cls.parse_pdf(content, filename)
        elif ext in [".docx", ".doc"]:
            return cls.parse_docx(content, filename)
        elif ext in [".txt", ".md"]:
            return cls.parse_text(content, filename)
        else:
            raise ValueError(f"Unsupported file format: {ext}. Allowed: PDF, DOCX, TXT")

    @classmethod
    def parse_pdf(cls, content: bytes, filename: str) -> Dict[str, Any]:
        pages_text: List[Dict[str, Any]] = []
        full_text_list: List[str] = []
        tables_extracted: int = 0

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total_pages = len(pdf.pages)
            for page_idx, page in enumerate(pdf.pages, start=1):
                # Extract text layout
                text = page.extract_text(layout=False) or ""
                # Extract any structured tables
                tables = page.extract_tables() or []
                if tables:
                    tables_extracted += len(tables)
                    table_strings = []
                    for table in tables:
                        # Clean and format table
                        formatted_rows = [" | ".join([str(cell or "").strip() for cell in row]) for row in table if any(row)]
                        if formatted_rows:
                            table_strings.append("\n[TABLE]\n" + "\n".join(formatted_rows) + "\n[/TABLE]")
                    if table_strings:
                        text += "\n" + "\n".join(table_strings)

                cleaned_text = text.strip()
                pages_text.append({
                    "page_number": page_idx,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text),
                    "word_count": len(cleaned_text.split())
                })
                if cleaned_text:
                    full_text_list.append(f"--- [Page {page_idx}] ---\n" + cleaned_text)

        raw_text = "\n\n".join(full_text_list)
        return {
            "filename": filename,
            "file_type": "pdf",
            "page_count": total_pages,
            "tables_found": tables_extracted,
            "raw_text": raw_text,
            "pages": pages_text,
            "total_chars": len(raw_text),
            "total_words": len(raw_text.split())
        }

    @classmethod
    def parse_docx(cls, content: bytes, filename: str) -> Dict[str, Any]:
        # Primary: Mammoth (extracts clean text preserving style tags)
        docx_file = io.BytesIO(content)
        raw_text = ""
        html_content = ""

        try:
            mammoth_result = mammoth.extract_raw_text(docx_file)
            raw_text = mammoth_result.value.strip()
            docx_file.seek(0)
            html_result = mammoth.convert_to_html(docx_file)
            html_content = html_result.value
        except Exception:
            # Fallback to python-docx
            docx_file.seek(0)
            doc = docx.Document(docx_file)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            raw_text = "\n\n".join(paragraphs)

        # Estimate page count (~400 words per page for standard legal formatting)
        words = raw_text.split()
        estimated_pages = max(1, (len(words) + 399) // 400)

        return {
            "filename": filename,
            "file_type": "docx",
            "page_count": estimated_pages,
            "tables_found": 0,
            "raw_text": raw_text,
            "html_preview": html_content,
            "pages": [{
                "page_number": 1,
                "text": raw_text,
                "char_count": len(raw_text),
                "word_count": len(words)
            }],
            "total_chars": len(raw_text),
            "total_words": len(words)
        }

    @classmethod
    def parse_text(cls, content: bytes, filename: str) -> Dict[str, Any]:
        for encoding in ["utf-8", "latin-1", "cp1252"]:
            try:
                text = content.decode(encoding).strip()
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
            "pages": [{
                "page_number": 1,
                "text": text,
                "char_count": len(text),
                "word_count": len(words)
            }],
            "total_chars": len(text),
            "total_words": len(words)
        }
