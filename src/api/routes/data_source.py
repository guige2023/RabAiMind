# -*- coding: utf-8 -*-
"""
Data Source API Routes (R75)
提供数据源的 CRUD、同步、管理接口
"""

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Query, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

from ...services.data_source_manager import get_data_source_manager

router = APIRouter(prefix="/api/v1/data-sources", tags=["data-sources"])


def _get_user_id(request: Request) -> Optional[str]:
    """从请求中获取用户ID（如果有认证）"""
    # 简化实现：没有认证时返回 None（匿名用户）
    try:
        from ...api.middleware.rate_limit import get_user_id_from_request
        return get_user_id_from_request(request)
    except Exception:
        return None


# ==================== 数据源管理 ====================

@router.get("")
async def list_data_sources(request: Request):
    """列出所有数据源"""
    user_id = _get_user_id(request)
    mgr = get_data_source_manager()
    sources = mgr.list_data_sources(user_id=user_id)

    # 脱敏：移除敏感字段
    safe_sources = []
    for s in sources:
        safe = {
            "id": s["id"],
            "name": s["name"],
            "source_type": s["source_type"],
            "status": s["status"],
            "auto_update": s.get("auto_update", False),
            "last_synced_at": s.get("last_synced_at"),
            "sync_interval_minutes": s.get("sync_interval_minutes", 60),
            "created_at": s["created_at"],
            "updated_at": s["updated_at"],
        }
        # 添加数据预览
        if s.get("extracted_data"):
            ed = s["extracted_data"]
            safe["total_rows"] = ed.get("total_rows", 0)
            safe["total_columns"] = ed.get("total_columns", 0)
            safe["headers"] = ed.get("headers", [])[:5]
            safe["table_type"] = ed.get("table_type", "general")
        else:
            safe["total_rows"] = 0
            safe["total_columns"] = 0
            safe["headers"] = []
            safe["table_type"] = "general"
        safe_sources.append(safe)

    return {"success": True, "data_sources": safe_sources}


@router.get("/{source_id}")
async def get_data_source(source_id: str):
    """获取单个数据源详情"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)

    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    # 脱敏
    safe = {
        "id": source["id"],
        "name": source["name"],
        "source_type": source["source_type"],
        "status": source["status"],
        "auto_update": source.get("auto_update", False),
        "last_synced_at": source.get("last_synced_at"),
        "sync_interval_minutes": source.get("sync_interval_minutes", 60),
        "created_at": source["created_at"],
        "updated_at": source["updated_at"],
        "extracted_data": source.get("extracted_data"),
    }

    if source["source_type"] in ("excel", "csv"):
        safe["file_name"] = source.get("file_name")
    elif source["source_type"] == "google_sheets":
        safe["spreadsheet_url"] = source.get("spreadsheet_url")
        safe["sheet_name"] = source.get("sheet_name")

    return {"success": True, "data_source": safe}


@router.put("/{source_id}")
async def update_data_source(source_id: str, body: Dict[str, Any]):
    """更新数据源（名称、自动更新、同步间隔）"""
    mgr = get_data_source_manager()
    source = mgr.update_data_source(
        source_id,
        name=body.get("name"),
        auto_update=body.get("auto_update"),
        sync_interval_minutes=body.get("sync_interval_minutes"),
        status=body.get("status"),
    )

    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    return {"success": True, "data_source": source}


@router.delete("/{source_id}")
async def delete_data_source(source_id: str):
    """删除数据源"""
    mgr = get_data_source_manager()
    deleted = mgr.delete_data_source(source_id)

    if not deleted:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    return {"success": True, "message": "数据源已删除"}


# ==================== Excel/CSV 导入 ====================

@router.post("/import/excel")
async def import_excel(
    request: Request,
    file: UploadFile = File(...),
    sheet_index: int = Form(0),
    has_header: bool = Form(True),
    max_rows: int = Form(1000),
):
    """导入 Excel 文件 (.xlsx, .xls)"""
    user_id = _get_user_id(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("xlsx", "xls"):
        raise HTTPException(status_code=400, detail="仅支持 .xlsx 和 .xls 文件")

    try:
        content = await file.read()
        mgr = get_data_source_manager()
        result = mgr.import_excel_file(
            file_content=content,
            filename=file.filename,
            sheet_index=sheet_index,
            has_header=has_header,
            max_rows=max_rows,
            user_id=user_id,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Excel import error: {e}")
        raise HTTPException(status_code=500, detail="Excel 文件导入失败")


@router.post("/import/csv")
async def import_csv(
    request: Request,
    file: UploadFile = File(...),
    has_header: bool = Form(True),
    max_rows: int = Form(1000),
    delimiter: str = Form("auto"),
):
    """导入 CSV 文件"""
    user_id = _get_user_id(request)

    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("csv", "tsv"):
        raise HTTPException(status_code=400, detail="仅支持 .csv 和 .tsv 文件")

    try:
        content = await file.read()
        mgr = get_data_source_manager()
        result = mgr.import_csv_file(
            file_content=content,
            filename=file.filename,
            has_header=has_header,
            max_rows=max_rows,
            delimiter=delimiter,
            user_id=user_id,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail="CSV 文件导入失败")


# ==================== Google Sheets 导入 ====================

class GoogleSheetsImportRequest(BaseModel):
    spreadsheet_url: str
    sheet_name: Optional[str] = None
    access_token: str
    has_header: bool = True
    max_rows: int = 1000


@router.post("/import/google-sheets")
async def import_google_sheets(request_body: GoogleSheetsImportRequest, request: Request):
    """从 Google Sheets 导入数据"""
    user_id = _get_user_id(request)

    try:
        mgr = get_data_source_manager()
        result = await mgr.import_google_sheets(
            spreadsheet_url=request_body.spreadsheet_url,
            sheet_name=request_body.sheet_name,
            access_token=request_body.access_token,
            user_id=user_id,
            has_header=request_body.has_header,
            max_rows=request_body.max_rows,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Google Sheets import error: {e}")
        raise HTTPException(status_code=500, detail="Google Sheets 导入失败")


# ==================== 同步 ====================

class SyncRequest(BaseModel):
    access_token: str


@router.post("/{source_id}/sync")
async def sync_data_source(source_id: str, request_body: SyncRequest):
    """同步 Google Sheets 数据源"""
    try:
        mgr = get_data_source_manager()
        result = await mgr.sync_google_sheet(
            source_id=source_id,
            access_token=request_body.access_token,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Sync error: {e}")
        raise HTTPException(status_code=500, detail="数据源同步失败")


# ==================== 数据预览 ====================

@router.get("/{source_id}/preview")
async def get_data_source_preview(source_id: str):
    """获取数据源表格预览"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)

    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    ed = source.get("extracted_data", {})
    if not ed:
        raise HTTPException(status_code=404, detail="数据源无提取数据")

    preview = [ed.get("headers", [])] + ed.get("data_rows", [])[:20]

    return {
        "success": True,
        "source_id": source_id,
        "headers": ed.get("headers", []),
        "column_info": ed.get("column_info", []),
        "total_rows": ed.get("total_rows", 0),
        "total_columns": ed.get("total_columns", 0),
        "table_preview": preview,
        "table_type": ed.get("table_type", "general"),
    }


# ==================== 阈值告警 (R113) ====================

class ThresholdAlertItem(BaseModel):
    column: str
    condition: str  # "gt", "lt", "gte", "lte", "eq"
    value: float
    label: str
    enabled: bool = True


class ThresholdAlertsRequest(BaseModel):
    alerts: List[ThresholdAlertItem]


@router.post("/{source_id}/threshold-alerts")
async def set_threshold_alerts(source_id: str, body: ThresholdAlertsRequest):
    """设置阈值告警规则"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    alerts_data = [a.model_dump() for a in body.alerts]
    # 检测触发的告警
    triggered = mgr.check_threshold_alerts(source_id, alerts_data)

    mgr.update_data_source(source_id, threshold_alerts=alerts_data)

    return {
        "success": True,
        "source_id": source_id,
        "alerts": alerts_data,
        "triggered": triggered,
    }


@router.get("/{source_id}/threshold-alerts")
async def get_threshold_alerts(source_id: str):
    """获取阈值告警规则"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    alerts = source.get("threshold_alerts", [])
    # 检测触发的告警
    triggered = mgr.check_threshold_alerts(source_id, alerts)

    return {
        "success": True,
        "source_id": source_id,
        "alerts": alerts,
        "triggered": triggered,
    }


# ==================== 数据分析与对比 (R113) ====================

class CompareRequest(BaseModel):
    compare_column: str
    group_by_column: Optional[str] = None
    periods: Optional[List[str]] = None  # 时间周期列表


@router.post("/{source_id}/analyze")
async def analyze_data(source_id: str, body: CompareRequest):
    """分析数据：对比、趋势、聚合"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    try:
        result = mgr.analyze_data(
            source_id=source_id,
            compare_column=body.compare_column,
            group_by_column=body.group_by_column,
            periods=body.periods,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Analyze error: {e}")
        raise HTTPException(status_code=500, detail="数据分析失败")


# ==================== 预测图表 (R113) ====================

class ForecastRequest(BaseModel):
    value_column: str
    label_column: Optional[str] = None
    forecast_periods: int = 3
    chart_type: str = "line"  # "line" | "bar"


@router.post("/{source_id}/forecast")
async def get_forecast(source_id: str, body: ForecastRequest):
    """生成预测图表数据（趋势线 + 未来预测）"""
    mgr = get_data_source_manager()
    source = mgr.get_data_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_id} 不存在")

    try:
        result = mgr.generate_forecast(
            source_id=source_id,
            value_column=body.value_column,
            label_column=body.label_column,
            forecast_periods=body.forecast_periods,
            chart_type=body.chart_type,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail="预测生成失败")


# ==================== 使用数据源生成 PPT (R113) ====================

class GenerateFromDataSourceRequest(BaseModel):
    source_id: str
    title: Optional[str] = None
    include_charts: bool = True
    include_threshold_alerts: bool = True
    include_forecast: bool = False
    forecast_periods: int = 3
    slide_count: int = 10


@router.post("/generate-ppt")
async def generate_ppt_from_data_source(request_body: GenerateFromDataSourceRequest, request: Request):
    """使用已连接的数据源生成 PPT"""
    user_id = _get_user_id(request)
    mgr = get_data_source_manager()
    source = mgr.get_data_source(request_body.source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {request_body.source_id} 不存在")

    try:
        result = mgr.generate_ppt_from_data_source(
            source_id=request_body.source_id,
            title=request_body.title,
            include_charts=request_body.include_charts,
            include_threshold_alerts=request_body.include_threshold_alerts,
            include_forecast=request_body.include_forecast,
            forecast_periods=request_body.forecast_periods,
            slide_count=request_body.slide_count,
            user_id=user_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
    except Exception as e:
        logger.error(f"Generate from data source error: {e}")
        raise HTTPException(status_code=500, detail="从数据源生成 PPT 失败")
