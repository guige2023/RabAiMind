# -*- coding: utf-8 -*-
"""
Content Import Service
Supports: PDF, DOCX, URL extraction → convert to PPT outline
"""

import io
import logging
from typing import Dict, Any, List, Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ImportService:
    """Extract content from various sources and convert to PPT outline format"""

    async def import_pdf(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extract text from PDF and convert to outline"""
        try:
            from pypdf import PdfReader
        except ImportError:
            # fallback - try PyPDF2
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                text_parts = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                full_text = "\n".join(text_parts)
            except ImportError:
                return {"success": False, "error": "请安装 pypdf: pip install pypdf"}
        else:
            reader = PdfReader(io.BytesIO(file_content))
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            full_text = "\n".join(text_parts)

        outline = self._text_to_outline(full_text, source=filename)
        return {
            "success": True,
            "source": "pdf",
            "filename": filename,
            "outline": outline,
            "page_count": len(reader.pages) if 'reader' in dir() else 0
        }

    async def import_docx(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Extract text from DOCX and convert to outline"""
        try:
            from docx import Document
        except ImportError:
            return {"success": False, "error": "请安装 python-docx: pip install python-docx"}

        doc = Document(io.BytesIO(file_content))
        paragraphs = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                paragraphs.append(text)

        # Also extract table content
        tables_text = []
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text = cell.text.strip()
                    if text:
                        tables_text.append(text)

        full_text = "\n".join(paragraphs + tables_text)
        outline = self._text_to_outline(full_text, source=filename)
        
        return {
            "success": True,
            "source": "docx",
            "filename": filename,
            "outline": outline,
            "paragraph_count": len(paragraphs),
            "table_count": len(doc.tables)
        }

    async def import_url(self, url: str) -> Dict[str, Any]:
        """Extract content from URL and convert to outline"""
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                
            content_type = response.headers.get("content-type", "")
            if "html" not in content_type and "text" not in content_type:
                return {"success": False, "error": f"URL 内容不是 HTML: {content_type}"}

            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            # Remove script and style elements
            for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
                tag.decompose()

            # Try to get the main content
            article = soup.find("article") or soup.find("main") or soup.find("div", class_="content") or soup

            # Extract title
            title = soup.title.string if soup.title else ""
            if not title:
                h1 = soup.find("h1")
                title = h1.string if h1 else "网页内容"

            # Extract headings and paragraphs
            content_blocks = []
            
            # Get all headings and their following content
            for tag in article.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
                text = tag.get_text(strip=True)
                if text and len(text) > 10:
                    tag_name = tag.name
                    if tag_name.startswith("h"):
                        content_blocks.append({"type": "heading", "level": int(tag_name[1]), "text": text})
                    elif tag_name == "p":
                        content_blocks.append({"type": "paragraph", "text": text})
                    elif tag_name == "li":
                        content_blocks.append({"type": "list_item", "text": text})

            full_text = "\n".join([b.get("text", "") for b in content_blocks])
            outline = self._text_to_outline(full_text, source=url)
            
            # Override title with actual page title
            if title:
                outline["title"] = title
            
            return {
                "success": True,
                "source": "url",
                "url": url,
                "title": title,
                "outline": outline,
                "block_count": len(content_blocks)
            }

        except httpx.TimeoutException:
            return {"success": False, "error": "URL 请求超时，请检查链接是否有效"}
        except httpx.HTTPError as e:
            return {"success": False, "error": f"URL 请求失败: {str(e)}"}
        except Exception as e:
            logger.exception("URL import failed")
            return {"success": False, "error": f"解析失败: {str(e)}"}

    def _text_to_outline(self, text: str, source: str = "") -> Dict[str, Any]:
        """Convert extracted text to PPT outline format"""
        import re
        
        # Clean up text
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Split into sections by double newlines or major headings
        sections = []
        current_section = {"title": "", "content": []}
        
        for line in lines:
            # Detect heading-like lines (short, no period ending, or all caps)
            is_heading = (
                len(line) < 80 and 
                not line.endswith(".") and
                (line.isupper() or line[0].isupper() and len(line) < 60)
            )
            
            if is_heading and current_section["content"]:
                # Save current section
                if current_section["title"] or current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": line, "content": []}
            else:
                if current_section["title"] or current_section["content"]:
                    current_section["content"].append(line)
                elif line:
                    # First content without heading - use as intro
                    current_section["title"] = line[:60] if len(line) > 60 else line
        
        if current_section["title"] or current_section["content"]:
            sections.append(current_section)
        
        # Build slides
        slides = []
        
        # Title slide
        title_text = source or "导入内容"
        slides.append({
            "title": title_text,
            "content": "",
            "layout": "title",
            "slide_type": "title"
        })
        
        # Table of contents if many sections
        if len(sections) > 3:
            toc_content = "\n".join([s["title"] for s in sections[:10] if s["title"]])
            slides.append({
                "title": "目录",
                "content": toc_content,
                "layout": "center",
                "slide_type": "toc"
            })
        
        # Content slides
        for section in sections[:20]:  # Max 20 content sections
            if not section["title"] and not section["content"]:
                continue
            
            title = section["title"] or "内容"
            content = "\n".join(section["content"]) if section["content"] else ""
            
            # Truncate very long content
            if len(content) > 800:
                content = content[:800] + "..."
            
            slides.append({
                "title": title,
                "content": content,
                "layout": "content",
                "slide_type": "content"
            })
        
        # Ensure at least one content slide
        if len(slides) == 1:
            slides.append({
                "title": "主要内容",
                "content": "\n".join(lines[:10]) if lines else "暂无详细内容",
                "layout": "content",
                "slide_type": "content"
            })
        
        return {
            "title": title_text,
            "slides": slides,
            "scene": "general",
            "style": "professional"
        }


def get_import_service() -> ImportService:
    return ImportService()
