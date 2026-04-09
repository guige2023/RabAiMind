# -*- coding: utf-8 -*-
"""
Lark (Feishu) Document Import Service
Supports: Import content from Lark/Feishu documents via Open API
"""

import logging
import os
import re
from typing import Dict, Any, Optional, List

import httpx

logger = logging.getLogger(__name__)


class LarkImportService:
    """Import content from Lark (Feishu) documents and convert to PPT outline"""

    LARK_API_BASE = "https://open.feishu.cn/open-apis"

    async def fetch_document_content(self, doc_id: str, access_token: str) -> Dict[str, Any]:
        """
        Fetch Lark document content via API.

        Args:
            doc_id: Lark document ID (from URL like f.feishu.cn/docx/xxx)
            access_token: Lark access token

        Returns:
            Document content and metadata
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                # Get document metadata
                doc_resp = await client.get(
                    f"{self.LARK_API_BASE}/docx/v1/documents/{doc_id}",
                    headers=headers
                )

                if doc_resp.status_code == 404:
                    return {"success": False, "error": "文档不存在或无权访问"}
                if doc_resp.status_code == 401:
                    return {"success": False, "error": "Lark access token 无效或已过期"}
                if doc_resp.status_code == 403:
                    return {"success": False, "error": "没有权限访问此文档，请确保已在文档中添加应用"}

                doc_resp.raise_for_status()
                doc_data = doc_resp.json()
                doc_info = doc_data.get("data", {})
                title = doc_info.get("title", "飞书文档")

                # Get document blocks
                blocks_resp = await client.get(
                    f"{self.LARK_API_BASE}/docx/v1/documents/{doc_id}/blocks",
                    headers=headers,
                    params={"page_size": 500}
                )
                
                if blocks_resp.status_code != 200:
                    logger.warning(f"Failed to fetch blocks: status={blocks_resp.status_code}")
                    # Return partial result with document info but empty blocks
                    return {
                        "success": True,
                        "title": title,
                        "blocks": [],
                        "block_count": 0,
                        "blocks_error": f"获取文档块失败: HTTP {blocks_resp.status_code}"
                    }
                
                blocks_data = blocks_resp.json()
                blocks = blocks_data.get("data", {}).get("items", [])

                return {
                    "success": True,
                    "title": title,
                    "blocks": blocks,
                    "block_count": len(blocks)
                }

        except httpx.HTTPError as e:
            logger.error(f"Lark API error: {e}")
            return {"success": False, "error": f"飞书 API 请求失败: {str(e)}"}
        except Exception:
            logger.exception("Lark document fetch error")
            return {"success": False, "error": "获取飞书文档内容失败"}

    def convert_blocks_to_outline(self, blocks: List[Dict], title: str = "飞书文档") -> Dict[str, Any]:
        """
        Convert Lark document blocks to PPT outline format.

        Supported block types:
        - paragraph: 普通段落
        - heading1/heading2/heading3: 标题
        - bullet: 无序列表
        - ordered: 有序列表
        - code: 代码块
        - image: 图片（提取链接）
        - table: 表格
        - quote: 引用
        - callout: 标注
        """
        content_blocks = []
        table_rows = []

        def extract_text_from_text_runs(text_runs: List[Dict]) -> str:
            """Extract plain text from text runs"""
            return "".join(run.get("text", "") for run in text_runs)

        def process_block(block: Dict, depth: int = 0) -> Optional[Dict]:
            """Recursively process a block and its children"""
            block_type = block.get("block_type", 0)
            block_id = block.get("block_id", "")

            # Mapping of block_type to names
            BLOCK_TYPE_NAMES = {
                0: "unsupported",
                1: "text",
                2: "heading1",
                3: "heading2",
                4: "heading3",
                5: "heading4",
                6: "heading5",
                7: "heading6",
                8: "bullet",
                9: "ordered",
                10: "code",
                11: "quote",
                12: "todo",
                13: "divider",
                14: "image",
                15: "table",
                16: "table_row",
                17: "embed",
                18: "cell",
                19: "column",
                20: "callout",
                21: "column_set",
                22: "outline",
            }

            type_name = BLOCK_TYPE_NAMES.get(block_type, "unknown")

            # Get block content
            block_data = block.get("block_data", {})
            if isinstance(block_data, str):
                import json
                try:
                    block_data = json.loads(block_data)
                except:
                    block_data = {}

            # Extract text based on block type
            text = ""
            if type_name == "text":
                text = extract_text_from_text_runs(block_data.get("text_runs", []))
            elif type_name in ("heading1", "heading2", "heading3", "heading4", "heading5", "heading6"):
                text = extract_text_from_text_runs(block_data.get("text_runs", []))
                type_name = "heading"
            elif type_name in ("bullet", "ordered"):
                text = extract_text_from_text_runs(block_data.get("text_runs", []))
                type_name = "list_item"
            elif type_name == "code":
                text = block_data.get("text", "")
                type_name = "code_block"
            elif type_name == "quote":
                text = extract_text_from_text_runs(block_data.get("text_runs", []))
            elif type_name == "callout":
                text = extract_text_from_text_runs(block_data.get("text_runs", []))
            elif type_name == "image":
                # Extract image token
                image_key = block_data.get("image_key", "")
                if image_key:
                    text = f"[图片: {image_key}]"
            elif type_name == "table_row":
                # Handle table rows later
                cells = block_data.get("cells", [])
                row_text = " | ".join(extract_text_from_text_runs(cell.get("text_runs", [])) for cell in cells)
                table_rows.append(row_text)
                return None

            if text and len(text.strip()) > 0:
                return {"type": type_name, "text": text.strip(), "block_id": block_id}

            # Process children
            children = block.get("children", [])
            for child in children:
                child_result = process_block(child, depth + 1)
                if child_result:
                    content_blocks.append(child_result)

            return None

        # Process all blocks
        for block in blocks:
            result = process_block(block)
            if result:
                content_blocks.append(result)

        # Build PPT outline
        slides = []
        slides.append({
            "title": title,
            "content": "",
            "layout": "title",
            "slide_type": "title"
        })

        # Group content into sections
        sections = []
        current_section = {"title": "", "content": []}

        for block in content_blocks:
            block_type = block.get("type", "")
            text = block.get("text", "")

            if block_type == "heading" and text:
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": text, "content": []}
            elif text:
                current_section["content"].append(text)

        if current_section["content"]:
            sections.append(current_section)

        # Create TOC if many sections
        if len(sections) > 3:
            toc_content = "\n".join([s["title"] for s in sections[:10] if s["title"]])
            slides.append({
                "title": "目录",
                "content": toc_content,
                "layout": "center",
                "slide_type": "toc"
            })

        # Create content slides
        for section in sections[:20]:
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
                "content": "\n".join([b.get("text", "") for b in content_blocks[:10]]) if content_blocks else "暂无详细内容",
                "layout": "content",
                "slide_type": "content"
            })

        return {
            "title": title,
            "slides": slides,
            "scene": "general",
            "style": "professional"
        }

    async def import_from_lark(
        self,
        doc_url: str,
        access_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Import content from Lark document URL.

        Args:
            doc_url: Lark document URL (e.g., https://f.feishu.cn/docx/xxx) or doc ID
            access_token: Lark access token (optional, will try env var LARK_ACCESS_TOKEN)

        Returns:
            PPT outline and metadata
        """
        import re

        # Extract document ID from URL
        doc_id = None

        # Pattern: f.feishu.cn/docx/xxx or feishu.cn/docx/xxx
        match = re.search(r"(?:f\.)?feishu\.cn/docx/([a-zA-Z0-9]+)", doc_url)
        if match:
            doc_id = match.group(1)
        # Direct doc ID (32 char hex)
        elif re.match(r"^[a-zA-Z0-9]{32}$", doc_url.strip()):
            doc_id = doc_url.strip()

        if not doc_id:
            return {
                "success": False,
                "error": "无法解析飞书文档链接，请确保是 f.feishu.cn/docx/xxx 格式",
                "guide": {
                    "step1": "打开要导入的飞书文档",
                    "step2": "点击右上角 '分享' → '复制链接'",
                    "step3": "确保文档的分享权限允许飞书应用访问",
                }
            }

        if not access_token:
            access_token = os.environ.get("LARK_ACCESS_TOKEN")

        if not access_token:
            return {
                "success": False,
                "error": "飞书文档导入需要 access token",
                "guide": {
                    "step1": "前往飞书开放平台创建应用",
                    "step2": "获取应用的 App ID 和 App Secret",
                    "step3": "调用 /auth/v3/tenant_access_token/internal 获取 access_token",
                    "step4": "或者在环境变量中设置 LARK_ACCESS_TOKEN"
                },
                "requires_auth": True,
                "doc_id": doc_id
            }

        # Fetch document content
        result = await self.fetch_document_content(doc_id, access_token)

        if not result.get("success"):
            return result

        # Convert to outline
        outline = self.convert_blocks_to_outline(
            result.get("blocks", []),
            result.get("title", "飞书文档")
        )

        return {
            "success": True,
            "source": "lark",
            "doc_id": doc_id,
            "title": result.get("title", "飞书文档"),
            "outline": outline,
            "block_count": result.get("block_count", 0)
        }


def get_lark_import_service() -> LarkImportService:
    return LarkImportService()
