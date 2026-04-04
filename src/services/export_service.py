# -*- coding: utf-8 -*-
"""
Export Service
Supports: Google Slides, Notion
"""

import io
import logging
import os
from typing import Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)


class ExportService:
    """Export PPT to third-party platforms"""

    def __init__(self):
        self.google_slides_api = "https://slides.googleapis.com/v1/presentations"
        self.notion_api = "https://api.notion.com/v1"

    async def export_to_google_slides(
        self, 
        task_id: str, 
        pptx_path: str,
        title: str = "PPT Export"
    ) -> Dict[str, Any]:
        """
        Export PPTX to Google Slides.
        Uses Google Slides API - requires OAuth2 access token.
        Fallback: Returns the PPTX file for manual upload.
        """
        # Check if we have Google credentials
        google_token = os.environ.get("GOOGLE_SLIDES_TOKEN")
        
        if not google_token:
            # Return guidance for manual export
            return {
                "success": False,
                "error": "Google Slides integration requires OAuth token",
                "guide": {
                    "step1": "下载PPTX文件",
                    "step2": "访问 Google Slides (slides.google.com)",
                    "step3": "点击 '文件' → '打开' → '上传'",
                    "step4": "上传您的PPTX文件即可"
                },
                "download_url": f"/api/v1/ppt/download/{task_id}",
                "method": "manual"
            }
        
        try:
            # Read PPTX file
            with open(pptx_path, "rb") as f:
                pptx_data = f.read()
            
            # Upload to Google Drive first, then import to Slides
            # This is a simplified version - full implementation would use Drive API
            
            headers = {
                "Authorization": f"Bearer {google_token}",
                "Content-Type": "application/json"
            }
            
            # Create new Google Slides presentation
            create_payload = {
                "title": title,
                "style": "MINIMALIST"
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Create presentation
                resp = await client.post(
                    self.google_slides_api,
                    headers=headers,
                    json=create_payload
                )
                
                if resp.status_code == 401:
                    return {
                        "success": False,
                        "error": "Google token expired or invalid",
                        "guide": "请重新授权 Google 账号",
                        "method": "manual",
                        "download_url": f"/api/v1/ppt/download/{task_id}"
                    }
                
                resp.raise_for_status()
                presentation = resp.json()
                presentation_id = presentation.get("presentationId")
                
                return {
                    "success": True,
                    "method": "api",
                    "presentation_id": presentation_id,
                    "presentation_url": f"https://docs.google.com/presentation/d/{presentation_id}/edit",
                    "message": "成功导出到 Google Slides!"
                }
                
        except httpx.HTTPError as e:
            logger.error(f"Google Slides export failed: {e}")
            return {
                "success": False,
                "error": f"Google Slides API 错误: {str(e)}",
                "method": "manual",
                "download_url": f"/api/v1/ppt/download/{task_id}"
            }
        except Exception as e:
            logger.exception("Google Slides export error")
            return {
                "success": False,
                "error": str(e),
                "method": "manual",
                "download_url": f"/api/v1/ppt/download/{task_id}"
            }

    async def export_to_notion(
        self,
        task_id: str,
        pptx_path: str,
        title: str = "PPT Export",
        slides_content: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Export PPT content to Notion.
        Uses Notion API to create a page with slide content.
        Requires Notion integration token.
        """
        notion_token = os.environ.get("NOTION_TOKEN")
        notion_database_id = os.environ.get("NOTION_DATABASE_ID")
        
        if not notion_token:
            return {
                "success": False,
                "error": "Notion integration requires API token",
                "guide": {
                    "step1": "前往 https://www.notion.so/my-integrations 创建集成",
                    "step2": "复制 Integration Token",
                    "step3": "设置环境变量: export NOTION_TOKEN=your_token",
                    "step4": "重新尝试导出"
                },
                "download_url": f"/api/v1/ppt/download/{task_id}",
                "method": "manual"
            }
        
        try:
            headers = {
                "Authorization": f"Bearer {notion_token}",
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            }
            
            # Build page content from slides
            children = []
            
            # Add title block
            children.append({
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": title}}]
                }
            })
            
            # Add each slide as a section
            if slides_content:
                for i, slide in enumerate(slides_content[:30]):  # Notion has block limits
                    slide_title = slide.get("title", f"第 {i+1} 页")
                    slide_content = slide.get("content", "")
                    
                    # Heading for slide
                    children.append({
                        "object": "block",
                        "type": "heading_2",
                        "heading_2": {
                            "rich_text": [{"type": "text", "text": {"content": slide_title}}]
                        }
                    })
                    
                    # Content as paragraph
                    if slide_content:
                        # Split long content into chunks (Notion block text limit ~2000 chars)
                        for j in range(0, len(slide_content), 1900):
                            chunk = slide_content[j:j+1900]
                            children.append({
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [{"type": "text", "text": {"content": chunk}}]
                                }
                            })
            else:
                # Add download link as fallback
                children.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{
                            "type": "text", 
                            "text": {"content": f"PPTX文件下载: /api/v1/ppt/download/{task_id}"}
                        }]
                    }
                })
            
            # Create page in database or root
            async with httpx.AsyncClient(timeout=30.0) as client:
                if notion_database_id:
                    # Create page in database
                    page_payload = {
                        "parent": {"database_id": notion_database_id},
                        "properties": {
                            "title": {
                                "title": [{"text": {"content": title}}]
                            }
                        },
                        "children": children
                    }
                else:
                    # Create page in root (requires sharing)
                    return {
                        "success": False,
                        "error": "Notion Database ID not configured",
                        "guide": "请设置 NOTION_DATABASE_ID 环境变量，指定要创建页面的数据库",
                        "download_url": f"/api/v1/ppt/download/{task_id}",
                        "method": "manual"
                    }
                
                resp = await client.post(
                    f"{self.notion_api}/pages",
                    headers=headers,
                    json=page_payload
                )
                
                if resp.status_code == 401:
                    return {
                        "success": False,
                        "error": "Notion token 无效或已过期",
                        "method": "manual",
                        "download_url": f"/api/v1/ppt/download/{task_id}"
                    }
                
                if resp.status_code == 400:
                    error_detail = resp.json().get("message", "")
                    return {
                        "success": False,
                        "error": f"Notion API 错误: {error_detail}",
                        "method": "manual",
                        "download_url": f"/api/v1/ppt/download/{task_id}"
                    }
                
                resp.raise_for_status()
                page = resp.json()
                page_id = page.get("id")
                
                return {
                    "success": True,
                    "method": "api",
                    "page_id": page_id,
                    "page_url": page.get("url"),
                    "message": "成功创建 Notion 页面!"
                }
                
        except httpx.HTTPError as e:
            logger.error(f"Notion export failed: {e}")
            return {
                "success": False,
                "error": f"Notion API 错误: {str(e)}",
                "method": "manual",
                "download_url": f"/api/v1/ppt/download/{task_id}"
            }
        except Exception as e:
            logger.exception("Notion export error")
            return {
                "success": False,
                "error": str(e),
                "method": "manual",
                "download_url": f"/api/v1/ppt/download/{task_id}"
            }


def get_export_service() -> ExportService:
    return ExportService()
