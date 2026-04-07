# -*- coding: utf-8 -*-
"""
Chart-related API routes.

Handles chart upload, generation, preview, smart-fill, and suggestions.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import json

from ._base_routes import (
    _check_rate_limit_middleware,
    create_router,
)

logger = logging.getLogger(__name__)

router = create_router(prefix="/api/v1/ppt", tags=["ppt-chart"])

# Chart service import
from ...services.chart_generator import ChartGenerator


# ==================== Chart Upload & Generation ====================

@router.post("/chart/upload/{task_id}")
async def upload_chart_file(
    task_id: str,
    file: UploadFile = File(...),
    chart_type: str = Form("bar"),
    label_col: str = Form(""),
    value_col: str = Form(""),
    theme_id: str = Form("default"),
    show_trend_line: bool = Form(False),
    annotations_json: str = Form("[]"),
    show_animation: bool = Form(False),
    animation_type: str = Form("fade_in"),
):
    """
    上传 CSV/Excel 文件，生成图表 SVG

    支持多种图表类型（柱状图、折线图、饼图等），可自定义主题、趋势线、标注和动画效果。

    Args:
        task_id: 任务ID
        file: CSV/Excel 文件
        chart_type: 图表类型（bar/line/pie等）
        label_col: 标签列名
        value_col: 数值列名
        theme_id: 主题ID
        show_trend_line: 是否显示趋势线
        annotations_json: 标注数据JSON
        show_animation: 是否显示动画
        animation_type: 动画类型

    Returns:
        生成结果（SVG路径、图表数据等）
    """
    try:
        annotations = json.loads(annotations_json) if annotations_json and annotations_json != "[]" else None
    except Exception:
        annotations = None
    try:
        content = await file.read()
        cg = ChartGenerator()
        result = cg.process_upload(
            content, file.filename, chart_type,
            label_col, value_col, task_id,
            theme_id=theme_id,
            annotations=annotations,
            show_trend_line=show_trend_line,
            show_animation=show_animation,
            animation_type=animation_type,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "BAD_REQUEST", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"图表生成失败: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "CHART_ERROR", "detail": f"图表生成失败: {str(e)}"}
        )


@router.post("/chart/preview/{task_id}")
async def preview_chart_columns(
    task_id: str,
    file: UploadFile = File(...),
):
    """
    上传 CSV/Excel，预览列信息

    在生成图表之前，先上传文件并预览可用的列信息（列名、数据类型、样本值）。

    Args:
        task_id: 任务ID
        file: CSV/Excel 文件

    Returns:
        列信息预览（列名、类型、样本值）
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        cols = cg.extract_columns(df)
        return {
            "success": True,
            "columns": cols
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "BAD_REQUEST", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"文件解析失败: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "ENDPOINT_ERROR", "detail": f"文件解析失败: {str(e)}"}
        )


# R62: Smart Fill 智能填充缺失数据

@router.post("/chart/smart-fill")
async def smart_fill_chart_data(
    file: UploadFile = File(...),
    target_col: str = Form(...),
    method: str = Form("auto"),
):
    """
    R62: AI 智能填充缺失值
    - file: CSV/Excel 文件
    - target_col: 需要填充的目标列
    - method: auto/linear/forward/mean
    返回填充后的完整数据预览
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        cols_info = cg.extract_columns(df)

        # 执行智能填充
        df_filled = cg.smart_fill_data(df, target_col, method)

        return {
            "success": True,
            "original_columns": cols_info,
            "filled_preview": df_filled.to_dict("records"),
            "row_count": len(df_filled),
            "filled_col": target_col,
            "fill_method": method,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": str(e)})
    except Exception as e:
        logger.error(f"Smart Fill 失败: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "SMART_FILL_ERROR", "detail": f"Smart Fill 失败: {str(e)}"}
        )


# R62: 图表模板列表

@router.get("/chart/templates")
async def get_chart_templates():
    """R62: 获取可用图表模板列表"""
    from ...services.chart_generator import CHART_TEMPLATES, CHART_STYLE_PRESETS
    return {
        "success": True,
        "templates": CHART_STYLE_PRESETS,
        "details": CHART_TEMPLATES,
    }


# R89: 智能图表建议

@router.post("/chart/suggest")
async def suggest_chart_type(
    file: UploadFile = File(...),
):
    """
    R89: 根据上传的数据文件，智能推荐最佳图表类型
    - 分析数据特征（维度数量、数据范围、时间序列等）
    - 返回推荐图表类型及理由
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        suggestion = cg.suggest_chart_type(df)
        return {
            "success": True,
            "suggestion": suggestion,
            "columns": cg.extract_columns(df)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": str(e)})
    except Exception as e:
        logger.error(f"智能图表建议失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": f"分析失败: {str(e)}"})


# R89: 图表下钻数据

@router.post("/chart/drilldown")
async def get_chart_drilldown(
    file: UploadFile = File(...),
    label_col: str = Form(...),
    value_col: str = Form(...),
    label_value: str = Form(...),
    group_by: Optional[str] = Form(None),
):
    """
    R89: 获取图表数据点的下钻详情
    - label_value: 要下钻的具体行标签值
    - group_by: 可选的分组列
    返回该数据点的详细信息、与均值对比、分组数据
    """
    try:
        content = await file.read()
        cg = ChartGenerator()
        df = cg.parse_file(content, file.filename)
        drilldown = cg.get_drilldown_data(df, label_col, value_col, label_value, group_by)
        return drilldown
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": str(e)})
    except Exception as e:
        logger.error(f"下钻数据获取失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": f"下钻失败: {str(e)}"})
