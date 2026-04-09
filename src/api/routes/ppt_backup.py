"""
PPT Backup & Notes Routes - 备份管理和幻灯片备注路由

作者: Claude
日期: 2026-03-17
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Body, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from ...services.task_manager import get_task_manager
from ...utils import get_timestamp

router = APIRouter()


# ==================== R152: Advanced Slide Notes & Annotations ====================

class SlideNotesUpdate(BaseModel):
    """更新幻灯片备注请求"""
    slide_index: int
    notes: str | None = None
    rich_notes: str | None = None
    speaker_notes: str | None = None


class SlideAnnotationsUpdate(BaseModel):
    """更新幻灯片标注请求"""
    slide_index: int
    annotations: list[dict[str, Any]] = []


class StickyNoteItem(BaseModel):
    """便签数据"""
    id: str
    slide_index: int
    content: str
    author: str
    color: str = "#FFE066"
    position_x: float = 0
    position_y: float = 0
    created_at: str | None = None


class StickyNoteCreate(BaseModel):
    """创建便签请求"""
    slide_index: int
    content: str
    author: str
    color: str = "#FFE066"
    position_x: float = 0
    position_y: float = 0


class NotesTemplateItem(BaseModel):
    """备注模板"""
    id: str
    name: str
    description: str
    template_type: str
    content: str
    created_at: str | None = None


class NotesTemplateCreate(BaseModel):
    """创建备注模板"""
    name: str
    description: str = ""
    template_type: str = "通用"
    content: str


@router.patch("/slides/{task_id}/notes")
async def update_slide_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片备注（支持富文本和演讲者私有备注）"""
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        slide = slides[update.slide_index]
        if update.notes is not None:
            slide["notes"] = update.notes
        if update.rich_notes is not None:
            slide["rich_notes"] = update.rich_notes
        if update.speaker_notes is not None:
            slide["speaker_notes"] = update.speaker_notes

        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.patch("/slides/{task_id}/sticky-notes")
async def update_slide_sticky_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片便签数据"""
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        if update.sticky_notes is not None:
            slides[update.slide_index]["sticky_notes"] = update.sticky_notes

        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/annotations/{task_id}/{slide_index}")
async def save_slide_annotations(task_id: str, slide_index: int, annotations: list[dict[str, Any]]):
    """R152: 保存幻灯片标注（演示模式涂鸦）"""
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if slide_index < 0 or slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        slides[slide_index]["annotations"] = annotations
        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": slide_index, "count": len(annotations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/sticky-notes/{task_id}")
async def get_sticky_notes(task_id: str):
    """R152: 获取任务的所有便签"""
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        all_sticky = []
        for idx, slide in enumerate(slides):
            sticky = slide.get("sticky_notes", [])
            for s in sticky:
                all_sticky.append({**s, "slide_index": idx})

        return {"success": True, "sticky_notes": all_sticky}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/sticky-notes/{task_id}")
async def add_sticky_note(task_id: str, note: StickyNoteCreate):
    """R152: 添加便签"""
    import uuid
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if note.slide_index < 0 or note.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        new_note = {
            "id": str(uuid.uuid4())[:8],
            "slide_index": note.slide_index,
            "content": note.content,
            "author": note.author,
            "color": note.color,
            "position_x": note.position_x,
            "position_y": note.position_y,
            "created_at": datetime.now().isoformat(),
        }

        if "sticky_notes" not in slides[note.slide_index]:
            slides[note.slide_index]["sticky_notes"] = []
        slides[note.slide_index]["sticky_notes"].append(new_note)

        tm.save_outline(task_id, outline)
        return {"success": True, "note": new_note}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.delete("/sticky-notes/{task_id}/{note_id}")
async def delete_sticky_note(task_id: str, note_id: str):
    """R152: 删除便签"""
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        found = False
        for slide in slides:
            sticky = slide.get("sticky_notes", [])
            slide["sticky_notes"] = [s for s in sticky if s.get("id") != note_id]
            if len(slide["sticky_notes"]) < len(sticky):
                found = True

        if not found:
            raise HTTPException(status_code=404, detail="Note not found")

        tm.save_outline(task_id, outline)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Notes Templates ====================

# In-memory store for notes templates (in production, use database)
NOTES_TEMPLATES_STORE = [
    {
        "id": "tpl-business-1",
        "name": "商业汇报模板",
        "description": "适用于季度汇报、项目汇报",
        "template_type": "business",
        "content": "【背景】<br>本次汇报聚焦于...<br><br>【核心成果】<br>• 成果1：...<br>• 成果2：...<br><br>【关键数据】<br>- 指标1：...<br>- 指标2：...<br><br>【下一步计划】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-education-1",
        "name": "教学演示模板",
        "description": "适用于课堂教学、学术报告",
        "template_type": "education",
        "content": "【教学目标】<br>本节课我们将学习...<br><br>【重点难点】<br>• 重点：...<br>• 难点：...<br><br>【案例分析】<br>...<br><br>【思考题】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-tech-1",
        "name": "技术分享模板",
        "description": "适用于技术分享会、架构讲解",
        "template_type": "tech",
        "content": "【背景介绍】<br>今天分享的主题是...<br><br>【技术方案】<br>我们采用了以下方案：<br>• 方案A：...<br>• 方案B：...<br><br>【代码示例】<br>```<br>...<br>```<br><br>【Q&A】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-marketing-1",
        "name": "营销提案模板",
        "description": "适用于营销方案、客户提案",
        "template_type": "marketing",
        "content": "【市场洞察】<br>当前市场趋势显示...<br><br>【目标受众】<br>我们的目标用户是...<br><br>【核心策略】<br>• 策略1：...<br>• 策略2：...<br><br>【预期效果】<br>- 品牌提升：...<br>- 转化提升：...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-general-1",
        "name": "通用备注模板",
        "description": "适用于各类演示的通用备注",
        "template_type": "通用",
        "content": "【开场】<br>各位好，今天我将分享...<br><br>【要点1】<br>首先，...<br><br>【要点2】<br>其次，...<br><br>【总结】<br>综上所述，...<br><br>【问答】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
]


@router.get("/notes-templates")
async def get_notes_templates(template_type: str | None = None):
    """R152: 获取备注模板列表"""
    if template_type:
        filtered = [t for t in NOTES_TEMPLATES_STORE if t["template_type"] == template_type]
        return {"success": True, "templates": filtered}
    return {"success": True, "templates": NOTES_TEMPLATES_STORE}


@router.post("/notes-templates")
async def create_notes_template(tpl: NotesTemplateCreate):
    """R152: 创建自定义备注模板"""
    import uuid
    new_tpl = {
        "id": f"tpl-custom-{uuid.uuid4().hex[:8]}",
        "name": tpl.name,
        "description": tpl.description,
        "template_type": tpl.template_type,
        "content": tpl.content,
        "created_at": datetime.now().isoformat(),
    }
    NOTES_TEMPLATES_STORE.append(new_tpl)
    return {"success": True, "template": new_tpl}


@router.delete("/notes-templates/{template_id}")
async def delete_notes_template(template_id: str):
    """R152: 删除自定义备注模板"""
    global NOTES_TEMPLATES_STORE
    if template_id.startswith("tpl-custom-"):
        before = len(NOTES_TEMPLATES_STORE)
        NOTES_TEMPLATES_STORE = [t for t in NOTES_TEMPLATES_STORE if t["id"] != template_id]
        if len(NOTES_TEMPLATES_STORE) == before:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"success": True}
    raise HTTPException(status_code=403, detail="Cannot delete built-in templates")


# ==================== Backup Management R125 ====================

@router.get("/backups")
async def list_backups(task_id: str = Query(None)):
    """
    R125: 列出备份历史
    - task_id: 如果指定，只返回该任务的备份；否则返回所有任务最新备份
    """
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    backups = bs.list_backups(task_id)
    return {"success": True, "backups": backups, "count": len(backups)}


@router.post("/backups/{task_id}")
async def create_backup(
    task_id: str,
    name: str = Body(None),
    backup_type: str = Body("manual"),
):
    """
    R125: 创建备份
    - 备份当前任务的完整数据（配置+结果+PPTX）
    """
    from ...services.backup_service import get_backup_service

    tm = get_task_manager()
    task_data = tm.get_task(task_id)
    if not task_data:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    bs = get_backup_service()
    result = bs.create_backup(
        task_id=task_id,
        task_data=task_data,
        backup_name=name,
        include_pptx=True,
        include_svg=True,
        backup_type=backup_type,
    )
    return result


@router.get("/backups/{task_id}/{backup_id}")
async def get_backup_detail(task_id: str, backup_id: str):
    """R125: 获取备份详情"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    backup = bs.get_backup(backup_id, task_id)
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"success": True, "backup": backup}


@router.get("/backups/{task_id}/{backup_id}/slides")
async def get_backup_slides(task_id: str, backup_id: str):
    """R125: 获取备份中的幻灯片列表（用于选择性恢复）"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    slides = bs.get_backup_slides(backup_id, task_id)
    if slides is None:
        raise HTTPException(status_code=404, detail="Backup not found")
    return {"success": True, "slides": slides}


@router.post("/backups/{task_id}/{backup_id}/restore")
async def restore_from_backup(
    task_id: str,
    backup_id: str,
    restore_type: str = Body("full"),
    selected_slide_nums: list[int] = Body(None),
):
    """
    R125: 从备份恢复
    - restore_type=full: 全量恢复（覆盖当前）
    - restore_type=slides: 选择性恢复（只恢复指定页）
    - restore_type=config: 只恢复配置（场景/风格/模板等）
    """
    from ...services.backup_service import get_backup_service

    bs = get_backup_service()

    if restore_type == "full":
        result = bs.restore_backup(backup_id, task_id, "full")
        if result.get("data"):
            tm = get_task_manager()
            task_data = result["data"]
            if task_id in tm.tasks:
                tm.tasks[task_id].update(task_data)
                tm.tasks[task_id]["updated_at"] = get_timestamp()
        return result

    elif restore_type == "slides":
        if not selected_slide_nums:
            raise HTTPException(status_code=400, detail="selected_slide_nums required for slides restore")
        return bs.restore_backup(backup_id, task_id, "slides", selected_slide_nums)

    elif restore_type == "config":
        result = bs.restore_backup(backup_id, task_id, "config")
        if result.get("config"):
            tm = get_task_manager()
            if task_id in tm.tasks:
                cfg = result["config"]
                if task_id in tm.tasks:
                    tm.tasks[task_id]["scene"] = cfg.get("scene", tm.tasks[task_id].get("scene"))
                    tm.tasks[task_id]["style"] = cfg.get("style", tm.tasks[task_id].get("style"))
                    tm.tasks[task_id]["template"] = cfg.get("template", tm.tasks[task_id].get("template"))
                    tm.tasks[task_id]["theme_color"] = cfg.get("theme_color", tm.tasks[task_id].get("theme_color"))
                    tm.tasks[task_id]["layout_mode"] = cfg.get("layout_mode", tm.tasks[task_id].get("layout_mode"))
                tm.tasks[task_id]["updated_at"] = get_timestamp()
        return result

    else:
        raise HTTPException(status_code=400, detail=f"Invalid restore_type: {restore_type}")


@router.delete("/backups/{task_id}/{backup_id}")
async def delete_backup(task_id: str, backup_id: str):
    """R125: 删除备份"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    result = bs.delete_backup(backup_id, task_id)
    return result


@router.get("/backups/{task_id}/{backup_id}/download")
async def download_backup(task_id: str, backup_id: str):
    """R125: 下载备份文件（.rabak）"""
    from ...services.backup_service import get_backup_service
    bs = get_backup_service()
    try:
        export_path = bs.export_backup_file(backup_id, task_id)
        return FileResponse(
            export_path,
            media_type="application/octet-stream",
            filename=f"backup_{backup_id}.rabak",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/backups/import")
async def import_backup(file: UploadFile = File(...)):
    """R125: 导入备份文件（.rabak）"""
    import os
    import tempfile

    from ...services.backup_service import get_backup_service

    bs = get_backup_service()

    with tempfile.NamedTemporaryFile(suffix=".rabak", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = bs.import_backup_file(tmp_path)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
