"""
Markdown Import Service
Supports: Parse Markdown content and convert to PPT outline
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


class MarkdownImportService:
    """Parse Markdown content and convert to PPT outline format"""

    def parse_markdown(self, content: str) -> dict[str, Any]:
        """
        Parse Markdown content and extract structured data.

        Supports:
        - Headings (h1-h6)
        - Paragraphs
        - Bullet lists
        - Numbered lists
        - Code blocks (with language)
        - Images (extract URLs)
        - Tables
        - Blockquotes
        - Horizontal rules
        - Task lists

        Args:
            content: Markdown text content

        Returns:
            Structured content blocks
        """
        lines = content.split("\n")
        blocks = []
        i = 0

        while i < len(lines):
            line = lines[i]

            # Skip empty lines but track them
            if not line.strip():
                i += 1
                continue

            # Headings (# heading)
            heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
            if heading_match:
                level = len(heading_match.group(1))
                text = heading_match.group(2).strip()
                blocks.append({
                    "type": "heading",
                    "level": level,
                    "text": text
                })
                i += 1
                continue

            # Code blocks (```language)
            if line.startswith("```"):
                lang = line[3:].strip() if len(line) > 3 else ""
                code_lines = []
                i += 1
                while i < len(lines) and not lines[i].startswith("```"):
                    code_lines.append(lines[i])
                    i += 1
                blocks.append({
                    "type": "code_block",
                    "language": lang,
                    "text": "\n".join(code_lines)
                })
                i += 1  # Skip closing ```
                continue

            # Blockquotes (> quote)
            if line.startswith(">"):
                quote_lines = [line[1:].strip()]
                i += 1
                while i < len(lines) and lines[i].startswith(">"):
                    quote_lines.append(lines[i][1:].strip())
                    i += 1
                blocks.append({
                    "type": "quote",
                    "text": " ".join(quote_lines)
                })
                continue  # Explicit: continue to next line

            # Horizontal rule
            if re.match(r"^[-*_]{3,}$", line.strip()):
                blocks.append({"type": "divider", "text": ""})
                i += 1
                continue

            # Task list (- [ ] or - [x])
            task_match = re.match(r"^[-*]\s+\[([ xX])\]\s+(.+)$", line)
            if task_match:
                checked = task_match.group(1).lower() == "x"
                text = task_match.group(2).strip()
                blocks.append({
                    "type": "task",
                    "checked": checked,
                    "text": text
                })
                i += 1
                continue

            # Bullet list (- item or * item)
            if re.match(r"^[-*+]\s+(.+)$", line):
                items = []
                while i < len(lines) and re.match(r"^[-*+]\s+(.+)$", lines[i]):
                    items.append(re.match(r"^[-*+]\s+(.+)$", lines[i]).group(1))
                    i += 1
                blocks.append({
                    "type": "bullet_list",
                    "items": items
                })
                continue

            # Numbered list (1. item)
            if re.match(r"^\d+\.\s+(.+)$", line):
                items = []
                while i < len(lines) and re.match(r"^\d+\.\s+(.+)$", lines[i]):
                    items.append(re.match(r"^\d+\.\s+(.+)$", lines[i]).group(1))
                    i += 1
                blocks.append({
                    "type": "ordered_list",
                    "items": items
                })
                continue

            # Table row
            if line.startswith("|"):
                table_rows = []
                while i < len(lines) and lines[i].startswith("|"):
                    # Skip separator row (|---|)
                    if not re.match(r"^\|[-:\s|]+\|$", lines[i]):
                        # Extract cells
                        cells = [c.strip() for c in lines[i].strip("|").split("|")]
                        table_rows.append(cells)
                    i += 1

                if table_rows:
                    blocks.append({
                        "type": "table",
                        "rows": table_rows
                    })
                continue

            # Image ![alt](url)
            image_match = re.search(r"!\[([^\]]*)\]\(([^\)]+)\)", line)
            if image_match:
                alt = image_match.group(1)
                url = image_match.group(2)
                blocks.append({
                    "type": "image",
                    "alt": alt,
                    "url": url
                })
                # Rest of line after image might be text
                rest = line[image_match.end():].strip()
                if rest:
                    blocks.append({
                        "type": "paragraph",
                        "text": rest
                    })
                i += 1
                continue

            # Regular paragraph - accumulate until blank line
            para_lines = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,6}|[`>\-*\d]|!\[)", lines[i].strip()):
                para_lines.append(lines[i])
                i += 1

            text = " ".join(para_lines).strip()
            if text:
                blocks.append({
                    "type": "paragraph",
                    "text": text
                })

        return {
            "success": True,
            "blocks": blocks,
            "block_count": len(blocks)
        }

    def convert_to_outline(
        self,
        parsed_content: dict[str, Any],
        title: str = "Markdown 文档"
    ) -> dict[str, Any]:
        """
        Convert parsed Markdown blocks to PPT outline format.

        Args:
            parsed_content: Result from parse_markdown()
            title: Document title (usually from first H1)

        Returns:
            PPT outline structure
        """
        blocks = parsed_content.get("blocks", [])

        slides = []
        slides.append({
            "title": title,
            "content": "",
            "layout": "title",
            "slide_type": "title"
        })

        # Group into sections based on headings
        sections = []
        current_section = {"title": "", "content": []}
        first_h1_title = None  # Track the first H1 for document title

        code_blocks = []
        tables = []
        images = []

        for block in blocks:
            block_type = block.get("type", "")
            text = block.get("text", "")

            if block_type == "heading":
                level = block.get("level", 1)

                # Save current section if has content
                if current_section["content"]:
                    sections.append(current_section)

                if level == 1:
                    # First H1 is the document title, don't create a section for it
                    if first_h1_title is None:
                        first_h1_title = text
                        current_section = {"title": "", "content": []}
                    else:
                        # Subsequent H1s start new sections
                        current_section = {"title": text, "content": []}
                else:
                    # H2-H6 become subsection titles within content
                    if not current_section["title"]:
                        current_section["title"] = text
                    else:
                        # Already have a title, add as subheading in content
                        current_section["content"].append(f"[{text}]")
                    current_section["content"].append("")

            elif block_type == "paragraph" and text:
                current_section["content"].append(text)

            elif block_type == "bullet_list":
                items = block.get("items", [])
                for item in items:
                    current_section["content"].append(f"• {item}")
                current_section["content"].append("")

            elif block_type == "ordered_list":
                items = block.get("items", [])
                for idx, item in enumerate(items, 1):
                    current_section["content"].append(f"{idx}. {item}")
                current_section["content"].append("")

            elif block_type == "code_block":
                lang = block.get("language", "")
                code = block.get("text", "")
                # Truncate long code
                if len(code) > 200:
                    code = code[:200] + "..."
                code_str = f"```{lang}\n{code}\n```" if lang else f"```\n{code}\n```"
                code_blocks.append(code_str)
                # Add reference in content
                current_section["content"].append(f"[代码块: {lang or 'text'}]")
                current_section["content"].append("")

            elif block_type == "quote":
                current_section["content"].append(f"> {text}")
                current_section["content"].append("")

            elif block_type == "table":
                rows = block.get("rows", [])
                table_text = ""
                for row in rows:
                    table_text += " | ".join(row) + "\n"
                tables.append(table_text.strip())
                current_section["content"].append("[表格]")
                current_section["content"].append("")

            elif block_type == "image":
                alt = block.get("alt", "")
                url = block.get("url", "")
                images.append({"alt": alt, "url": url})
                current_section["content"].append(f"[图片: {alt or 'image'}]")
                current_section["content"].append("")

            elif block_type == "task":
                checked = block.get("checked", False)
                status = "✓" if checked else "☐"
                current_section["content"].append(f"{status} {text}")

            elif block_type == "divider":
                current_section["content"].append("---")

        # Add last section
        if current_section["content"]:
            sections.append(current_section)

        # Create TOC if many sections
        if len(sections) > 3:
            toc_items = []
            for s in sections[:10]:
                if s["title"]:
                    toc_items.append(s["title"])
            toc_content = "\n".join(toc_items)
            slides.append({
                "title": "目录",
                "content": toc_content,
                "layout": "center",
                "slide_type": "toc"
            })

        # Create content slides
        slide_count = 0
        for section in sections[:20]:
            if not section["title"] and not section["content"]:
                continue

            # Use first H1 as section title if section has no title
            title_text = section["title"] or (first_h1_title if first_h1_title else f"内容 {slide_count + 1}")
            content_text = "\n".join(section["content"]) if section["content"] else ""

            # Truncate very long content
            if len(content_text) > 800:
                content_text = content_text[:800] + "..."

            slides.append({
                "title": title_text,
                "content": content_text,
                "layout": "content",
                "slide_type": "content"
            })
            slide_count += 1

        # Add code blocks as separate slides if many
        if len(code_blocks) > 0 and len(code_blocks) <= 5:
            for i, code in enumerate(code_blocks, 1):
                slides.append({
                    "title": f"代码块 {i}",
                    "content": code,
                    "layout": "content",
                    "slide_type": "content"
                })

        # Add tables as separate slides
        for i, table_text in enumerate(tables[:3], 1):
            slides.append({
                "title": f"表格 {i}",
                "content": table_text,
                "layout": "content",
                "slide_type": "content"
            })

        # Ensure at least one content slide
        if len(slides) == 1:
            slides.append({
                "title": "主要内容",
                "content": "\n".join([b.get("text", "") or str(b) for b in blocks[:10] if b.get("text")]),
                "layout": "content",
                "slide_type": "content"
            })

        return {
            "title": title,
            "slides": slides,
            "scene": "general",
            "style": "professional"
        }

    async def import_markdown(
        self,
        markdown_content: str,
        title: str | None = None
    ) -> dict[str, Any]:
        """
        Import Markdown content and convert to PPT outline.

        Args:
            markdown_content: Raw Markdown text
            title: Optional title (if not provided, extracted from first H1)

        Returns:
            PPT outline and metadata
        """
        if not markdown_content or not markdown_content.strip():
            return {
                "success": False,
                "error": "Markdown 内容不能为空"
            }

        # Parse the Markdown
        parsed = self.parse_markdown(markdown_content)

        if not parsed.get("success"):
            return parsed

        # Extract title from first H1 if not provided
        if not title:
            for block in parsed.get("blocks", []):
                if block.get("type") == "heading" and block.get("level") == 1:
                    title = block.get("text", "Markdown 文档")
                    break

        if not title:
            title = "Markdown 文档"

        # Convert to outline
        outline = self.convert_to_outline(parsed, title)

        return {
            "success": True,
            "source": "markdown",
            "title": title,
            "outline": outline,
            "block_count": parsed.get("block_count", 0)
        }


def get_markdown_import_service() -> MarkdownImportService:
    return MarkdownImportService()
