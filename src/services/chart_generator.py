"""
CSV/Excel 数据解析 + 图表生成服务
R89: 新增雷达图/仪表图/瀑布图 + 图表动画 + 下钻探索 + 智能图表建议
"""
import io
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

# R24优化: matplotlib 在模块级只导入一次，避免每次调用都重新初始化
_matplotlib_initialized = False
_mpl_pyplot = None
_chinese_font = None

# R62: 图表模板配置
CHART_TEMPLATES = {
    "business": {
        "name": "商务风格",
        "bar_color": "#1F4E79",
        "line_color": "#2E75B6",
        "pie_colors": ["#1F4E79", "#2E75B6", "#5B9BD5", "#9DC3E6", "#DEEBF7"],
        "grid": True,
        "alpha": 0.9,
        "title_fontsize": 14,
        "label_fontsize": 11,
        "font": "sans-serif",
    },
    "academic": {
        "name": "学术风格",
        "bar_color": "#333333",
        "line_color": "#666666",
        "pie_colors": ["#333333", "#666666", "#999999", "#CCCCCC", "#E6E6E6"],
        "grid": True,
        "alpha": 0.85,
        "title_fontsize": 13,
        "label_fontsize": 10,
        "font": "serif",
    },
    "infographic": {
        "name": "信息图风格",
        "bar_color": "#FF6B35",
        "line_color": "#F7C948",
        "pie_colors": ["#FF6B35", "#F7C948", "#06D6A0", "#118AB2", "#EF476F"],
        "grid": False,
        "alpha": 1.0,
        "title_fontsize": 15,
        "label_fontsize": 12,
        "font": "sans-serif",
    },
}

# R62: 图表模板选择
CHART_STYLE_PRESETS = [
    {"id": "default", "name": "默认风格"},
    {"id": "business", "name": "商务风格"},
    {"id": "academic", "name": "学术风格"},
    {"id": "infographic", "name": "信息图风格"},
]

# R62: 标注样式
ANNOTATION_TYPES = ["label", "arrow", "callout", "box", "circle"]


def _init_matplotlib():
    """延迟初始化 matplotlib（只在首次调用时）"""
    global _matplotlib_initialized, _mpl_pyplot, _chinese_font
    if _matplotlib_initialized:
        return
    import matplotlib
    matplotlib.use('Agg')  # 无头模式，不弹出窗口
    import matplotlib.font_manager as fm
    import matplotlib.pyplot as plt
    _mpl_pyplot = plt
    _matplotlib_initialized = True

    # 设置中文字体（只查一次）
    font_paths = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeati Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for fp in font_paths:
        if Path(fp).exists():
            _chinese_font = fm.FontProperties(fname=fp)
            break


class ChartGenerator:
    """解析 CSV/Excel 并生成图表 SVG"""

    # R89: 新增 radar/gauge/waterfall
    CHART_TYPES = ["pie", "bar", "line", "horizontal_bar", "stacked_bar", "radar", "gauge", "waterfall"]

    def __init__(self):
        self.output_dir = Path("static/charts")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def parse_file(self, file_content: bytes, filename: str) -> pd.DataFrame:
        """解析 CSV/Excel 文件"""
        suffix = Path(filename).suffix.lower()

        if suffix == ".csv":
            return pd.read_csv(io.BytesIO(file_content), encoding="utf-8-sig")
        elif suffix in [".xlsx", ".xls"]:
            return pd.read_excel(io.BytesIO(file_content))
        else:
            raise ValueError(f"不支持的文件格式: {suffix}，仅支持 CSV/Excel")

    def extract_columns(self, df: pd.DataFrame) -> dict:
        """提取列信息：哪些是标签列，哪些是数值列"""
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        label_cols = [c for c in df.columns if c not in numeric_cols]

        return {
            "all_columns": df.columns.tolist(),
            "label_columns": label_cols,
            "numeric_columns": numeric_cols,
            "row_count": len(df),
            "preview": df.head(5).to_dict("records")
        }

    # R89: 智能图表建议 - 根据数据特征推荐最佳图表类型
    def suggest_chart_type(self, df: pd.DataFrame) -> dict:
        """
        R89: 分析数据特征，推荐最佳图表类型
        返回: {"suggested_type": str, "reason": str, "confidence": float, "alternatives": list}
        """
        suggestions = []
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        label_cols = [c for c in df.columns if c not in numeric_cols]
        n_rows = len(df)
        n_numeric = len(numeric_cols)

        # 分析每个数值列的特征
        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) < 2:
                continue

            # 计算数据特征
            mean_val = series.mean()
            std_val = series.std()
            min_val = series.min()
            max_val = series.max()

            # 变异系数（衡量波动程度）
            cv = std_val / mean_val if mean_val != 0 else 0

            # 值范围（是否在0-100%或固定范围内）
            in_percent_range = min_val >= 0 and max_val <= 100

            # 时间序列检测（如果标签列包含时间关键字）
            is_time_series = False
            if label_cols:
                sample_labels = df[label_cols[0]].astype(str).head(5).tolist()
                time_keywords = ["月", "年", "日", "周", "季度", "Q", "time", "date", "month", "year", "day", "week", "quarter"]
                is_time_series = any(any(kw in str(lbl).lower() for kw in time_keywords) for lbl in sample_labels)

            # 多列相关性（是否有多个数值列）
            has_multi_cols = n_numeric >= 3

            # 数据量判断
            is_small_data = n_rows <= 6
            is_large_data = n_rows > 20

        # 整体推荐逻辑
        reason = ""
        best_type = "bar"
        confidence = 0.5

        # 雷达图推荐：多维度对比（≥4个数值列）
        if n_numeric >= 4:
            best_type = "radar"
            reason = f"数据有{n_numeric}个维度，适合用雷达图进行多指标对比分析"
            confidence = 0.85
            suggestions.append({"type": "radar", "reason": reason, "confidence": confidence})

        # 仪表图推荐：单一KPI指标，范围在固定区间
        if n_numeric == 1 and in_percent_range and n_rows <= 3:
            best_type = "gauge"
            reason = "单一指标且值在0-100范围，适合用仪表图展示KPI完成度"
            confidence = 0.9
            suggestions.append({"type": "gauge", "reason": reason, "confidence": confidence})

        # 瀑布图推荐：展示数据变化过程（正负值混合）
        if n_numeric == 1:
            series = df[numeric_cols[0]].dropna()
            has_negative = (series < 0).any()
            has_positive = (series > 0).any()
            if has_negative or has_positive:
                best_type = "waterfall"
                reason = "数据包含增减变化，适合用瀑布图展示变化过程"
                confidence = 0.8
                suggestions.append({"type": "waterfall", "reason": reason, "confidence": confidence})

        # 饼图推荐：少量类别，各类别占比明显（≤7个分类）
        if n_rows <= 7 and n_numeric == 1:
            best_type = "pie"
            reason = "数据有少量分类，适合用饼图展示各部分占比"
            confidence = 0.75
            suggestions.append({"type": "pie", "reason": reason, "confidence": confidence})

        # 折线图推荐：时间序列或连续变化
        if is_time_series and n_numeric >= 1:
            best_type = "line"
            reason = "检测到时间序列数据，适合用折线图展示趋势变化"
            confidence = 0.85
            suggestions.append({"type": "line", "reason": reason, "confidence": confidence})

        # 堆叠图推荐：多列数据对比
        if n_numeric >= 2 and n_numeric <= 4 and n_rows <= 10:
            best_type = "stacked_bar"
            reason = f"有{n_numeric}个指标，适合用堆叠图展示组成结构"
            confidence = 0.7
            suggestions.append({"type": "stacked_bar", "reason": reason, "confidence": confidence})

        # 默认柱状图
        if not suggestions:
            best_type = "bar"
            reason = "适合用柱状图进行数据对比展示"
            confidence = 0.6
            suggestions.append({"type": "bar", "reason": reason, "confidence": confidence})

        # 按置信度排序
        suggestions.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "suggested_type": best_type,
            "reason": reason,
            "confidence": confidence,
            "alternatives": suggestions[:3]  # 最多返回3个备选
        }

    # R89: 下钻数据提取 - 获取指定数据点的详细数据
    def get_drilldown_data(self, df: pd.DataFrame, label_col: str, value_col: str,
                           label_value: str, group_by: str | None = None) -> dict:
        """
        R89: 获取指定数据点的下钻详情
        label_value: 选中要下钻的行标签值
        group_by: 可选的分组列
        """
        if label_col not in df.columns:
            return {"success": False, "error": f"列 {label_col} 不存在"}

        # 找到对应行
        row_mask = df[label_col].astype(str) == str(label_value)
        if not row_mask.any():
            return {"success": False, "error": f"未找到标签为 {label_value} 的数据"}

        row_data = df[row_mask].iloc[0].to_dict()

        # 计算该行在整体中的占比
        total_by_col = {}
        if value_col in df.columns:
            col_sum = df[value_col].sum()
            row_val = float(row_data.get(value_col, 0))
            pct = (row_val / col_sum * 100) if col_sum != 0 else 0
            total_by_col[value_col] = {"sum": float(col_sum), "row_value": row_val, "percentage": round(pct, 2)}

        # 与平均值对比
        comparisons = {}
        for col in df.select_dtypes(include=["number"]).columns:
            mean_val = df[col].mean()
            row_val = float(row_data.get(col, 0))
            diff = row_val - mean_val
            diff_pct = (diff / mean_val * 100) if mean_val != 0 else 0
            comparisons[col] = {
                "mean": round(float(mean_val), 2),
                "value": round(row_val, 2),
                "diff": round(float(diff), 2),
                "diff_pct": round(float(diff_pct), 1),
                "above_average": diff > 0
            }

        # 分组数据（如果有）
        group_data = None
        if group_by and group_by in df.columns:
            group_data = df.groupby(group_by)[value_col].sum().to_dict() if value_col in df.columns else {}

        return {
            "success": True,
            "label_value": str(label_value),
            "row_data": row_data,
            "totals": total_by_col,
            "comparisons": comparisons,
            "group_data": group_data,
            "row_index": int(df.index[row_mask].tolist()[0]) if row_mask.any() else 0
        }

    # R62: Smart Fill - 使用线性插值 + 趋势预测填充缺失值
    def smart_fill_data(self, df: pd.DataFrame, target_col: str, method: str = "auto") -> pd.DataFrame:
        """
        R62: AI 智能填充缺失值
        method: auto(自动选择), linear(线性插值), forward(前向填充), mean(均值填充)
        """
        df = df.copy()

        if target_col not in df.columns:
            raise ValueError(f"列 '{target_col}' 不存在于数据中")

        # 判断是否为数值列
        is_numeric = pd.api.types.is_numeric_dtype(df[target_col])

        if method == "auto":
            method = "linear" if is_numeric else "forward"

        missing_mask = df[target_col].isna()
        missing_count = missing_mask.sum()

        if missing_count == 0:
            return df  # 没有缺失值，直接返回

        if is_numeric:
            if method == "linear":
                # 线性插值
                df[target_col] = df[target_col].interpolate(method="linear")
                # 首尾缺失用前向/后向填充
                df[target_col] = df[target_col].fillna(method="ffill").fillna(method="bfill")
            elif method == "mean":
                # 均值填充
                mean_val = df[target_col].mean()
                df[target_col] = df[target_col].fillna(mean_val)
            else:
                # 前向填充
                df[target_col] = df[target_col].fillna(method="ffill").fillna(method="bfill")
        else:
            # 非数值列：前向填充
            df[target_col] = df[target_col].fillna(method="ffill")

        return df

    # R62: 计算趋势线数据（线性回归）
    def compute_trend_line(self, values: list[float]) -> tuple:
        """
        R62: 计算线性趋势线
        返回 (x_indices, trend_values, slope, intercept)
        """
        n = len(values)
        x = np.arange(n)
        y = np.array(values, dtype=float)

        # 线性回归
        valid_mask = ~np.isnan(y)
        if valid_mask.sum() < 2:
            return x.tolist(), y.tolist(), 0.0, 0.0

        x_valid = x[valid_mask]
        y_valid = y[valid_mask]

        coeffs = np.polyfit(x_valid, y_valid, 1)
        slope, intercept = coeffs[0], coeffs[1]
        trend = slope * x + intercept

        return x.tolist(), trend.tolist(), float(slope), float(intercept)

    # R62: 添加图表标注
    def _add_annotations(self, ax, annotations: list[dict[str, Any]], chart_type: str, labels: list[str]):
        """
        R62: 向图表添加标注
        annotations: [{"type": "arrow"|"label"|"callout"|"box"|"circle", "x": int, "y": value, "text": str, "color": str}]
        """
        try:
            for ann in annotations:
                ann_type = ann.get("type", "label")
                x = ann.get("x", 0)
                y = ann.get("y", 0)
                text = ann.get("text", "")
                color = ann.get("color", "#FF2D55")

                if ann_type == "arrow":
                    # 箭头标注
                    ax.annotate(
                        text,
                        xy=(x, y),
                        xytext=(x + 0.5, y * 1.1),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.5),
                        color=color,
                        fontsize=9,
                    )
                elif ann_type == "label":
                    # 文本标签
                    ax.annotate(
                        text,
                        xy=(x, y),
                        xytext=(x, y * 1.05),
                        color=color,
                        fontsize=9,
                        ha='center',
                    )
                elif ann_type == "callout":
                    # 带气泡的标注
                    ax.annotate(
                        text,
                        xy=(x, y),
                        xytext=(x + 0.8, y * 1.15),
                        arrowprops=dict(arrowstyle="->", color=color),
                        bbox=dict(boxstyle="round,pad=0.3", facecolor="yellow", alpha=0.7),
                        color=color,
                        fontsize=9,
                    )
                elif ann_type == "box":
                    # 文本框
                    ax.text(
                        x, y, text,
                        transform=ax.transData,
                        bbox=dict(boxstyle="round,pad=0.3", facecolor=color, alpha=0.3),
                        color=color,
                        fontsize=9,
                        ha='center',
                    )
                elif ann_type == "circle":
                    # 圆圈标记
                    circle = plt.Circle((x, y), 0.3, color=color, fill=False, lw=2)
                    ax.add_patch(circle)
                    ax.text(x, y, text, color=color, fontsize=8, ha='center', va='center')
        except Exception:
            # 标注出错不影响主图绘制
            pass

    def generate_chart_svg(self, df: pd.DataFrame, chart_type: str,
                           label_col: str, value_col: str | list[str],
                           task_id: str, chart_index: int,
                           # R62 新参数
                           theme_id: str = "default",
                           annotations: list[dict[str, Any]] | None = None,
                           show_trend_line: bool = False,
                           show_grid: bool | None = None,
                           custom_colors: list[str] | None = None,
                           ) -> str:
        """
        使用 matplotlib 生成图表 SVG
        R62 新增:
          - theme_id: 图表模板风格 (default/business/academic/infographic)
          - annotations: 标注列表
          - show_trend_line: 是否显示趋势线
          - show_grid: 是否显示网格
          - custom_colors: 自定义颜色列表
        """
        _init_matplotlib()  # R24优化: 延迟初始化，只在首次调用时导入
        plt = _mpl_pyplot
        chinese_font = _chinese_font

        # R62: 获取模板配置
        template = CHART_TEMPLATES.get(theme_id, CHART_TEMPLATES["business"]).copy()
        if show_grid is not None:
            template["grid"] = show_grid

        fig, ax = plt.subplots(figsize=(8, 5), dpi=150)

        labels = df[label_col].astype(str).tolist()

        # R62: 颜色配置
        if custom_colors:
            bar_color = custom_colors[0]
            line_color = custom_colors[0]
            pie_colors = custom_colors
        else:
            bar_color = template["bar_color"]
            line_color = template["line_color"]
            pie_colors = template["pie_colors"]

        if chart_type == "pie":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            wedges, texts, autotexts = ax.pie(
                values, labels=labels, autopct='%1.1f%%',
                colors=pie_colors, startangle=90,
                textprops={"fontsize": template["label_fontsize"]}
            )
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontweight('bold')
            ax.set_title(label_col, fontproperties=chinese_font, fontsize=template["title_fontsize"])

        elif chart_type == "bar":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            bars = ax.bar(labels, values, color=bar_color, alpha=template["alpha"])
            ax.set_title(f"{label_col} - {value_col if isinstance(value_col, str) else value_col[0]}",
                        fontproperties=chinese_font, fontsize=template["title_fontsize"])
            ax.set_xlabel(label_col, fontsize=template["label_fontsize"])
            ax.set_ylabel(value_col if isinstance(value_col, str) else value_col[0],
                         fontsize=template["label_fontsize"])
            plt.xticks(rotation=45, ha='right')
            if template["grid"]:
                ax.grid(axis='y', alpha=0.3)
            plt.tight_layout()

        elif chart_type == "line":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.plot(labels, values, marker='o', color=line_color, linewidth=2,
                   markersize=6, alpha=template["alpha"])
            ax.set_title(f"{label_col} - {value_col if isinstance(value_col, str) else value_col[0]}",
                        fontproperties=chinese_font, fontsize=template["title_fontsize"])
            ax.set_xlabel(label_col, fontsize=template["label_fontsize"])
            ax.set_ylabel(value_col if isinstance(value_col, str) else value_col[0],
                         fontsize=template["label_fontsize"])
            plt.xticks(rotation=45, ha='right')
            if template["grid"]:
                ax.grid(alpha=0.3)

            # R62: 趋势线
            if show_trend_line:
                x_indices, trend_values, slope, intercept = self.compute_trend_line(values)
                trend_label = f"趋势线 (斜率={slope:.2f})"
                ax.plot(labels, trend_values, color="#FF2D55", linewidth=2,
                       linestyle='--', label=trend_label, alpha=0.8)
                ax.legend(fontsize=9)

            # R62: 标注
            if annotations:
                self._add_annotations(ax, annotations, chart_type, labels)

            plt.tight_layout()

        elif chart_type == "horizontal_bar":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.barh(labels, values, color=bar_color, alpha=template["alpha"])
            ax.set_title(f"{label_col} - {value_col if isinstance(value_col, str) else value_col[0]}",
                        fontproperties=chinese_font, fontsize=template["title_fontsize"])
            if template["grid"]:
                ax.grid(axis='x', alpha=0.3)

        elif chart_type == "stacked_bar":
            # 多列堆叠柱图
            if isinstance(value_col, str):
                num_cols = df[[value_col]]
            else:
                num_cols = df[value_col]
            bottom = [0] * len(df)
            colors = custom_colors or pie_colors
            for i, col in enumerate(num_cols.columns):
                ax.bar(labels, num_cols[col].fillna(0), bottom=bottom,
                       label=col, color=colors[i % len(colors)], alpha=template["alpha"])
                bottom = [b + v for b, v in zip(bottom, num_cols[col].fillna(0))]
            ax.legend()
            plt.xticks(rotation=45, ha='right')
            if template["grid"]:
                ax.grid(axis='y', alpha=0.3)

        # R89: 雷达图
        elif chart_type == "radar":
            if isinstance(value_col, str):
                num_cols = df[[value_col]]
            else:
                num_cols = df[value_col] if isinstance(value_col, list) else df[[value_col]]

            # 归一化数据到0-1范围
            normalized = num_cols.apply(pd.to_numeric, errors="coerce").fillna(0)
            for col in normalized.columns:
                col_max = normalized[col].max()
                if col_max != 0:
                    normalized[col] = normalized[col] / col_max

            n_vars = len(labels)
            angles = np.linspace(0, 2 * np.pi, n_vars, endpoint=False).tolist()
            angles += angles[:1]  # 闭合

            ax = fig.add_subplot(111, polar=True)
            colors_radar = custom_colors or pie_colors

            for i, col in enumerate(normalized.columns):
                values_radar = normalized[col].tolist()
                values_radar += values_radar[:1]
                ax.plot(angles, values_radar, 'o-', linewidth=2,
                        label=col, color=colors_radar[i % len(colors_radar)], alpha=0.8)
                ax.fill(angles, values_radar, alpha=0.15, color=colors_radar[i % len(colors_radar)])

            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(labels, fontsize=template["label_fontsize"])
            ax.set_title(f"{label_col}", fontproperties=chinese_font,
                        fontsize=template["title_fontsize"], pad=20)
            ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0), fontsize=9)
            plt.tight_layout()

        # R89: 仪表图 (Gauge)
        elif chart_type == "gauge":
            from matplotlib.patches import Arc, Wedge
            ax.set_axis_off()  # 隐藏坐标轴

            if isinstance(value_col, str):
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist() if isinstance(value_col, list) else [0]

            # 取第一个值作为仪表读数
            value = float(values[0]) if values else 0
            max_val = float(df[value_col if isinstance(value_col, str) else value_col[0]].max()) if isinstance(value_col, str) or (isinstance(value_col, list) and value_col) else 100
            if max_val == 0:
                max_val = 100

            # 归一化到0-100
            pct = min(value / max_val * 100, 100)

            # 绘制半圆弧背景
            gauge_color = pie_colors[0]
            # 外弧
            arc = Arc((0.5, 0), 0.8, 0.8, angle=0, theta1=0, theta2=180,
                      color="#E5E5E5", linewidth=20, zorder=0)
            ax.add_patch(arc)
            # 填充弧
            fill_pct = min(pct, 100)
            if fill_pct > 0:
                wedge = Wedge((0.5, 0), 0.4, 0, fill_pct * 1.8,
                              facecolor=gauge_color, alpha=0.8, zorder=1)
                ax.add_patch(wedge)

            # 显示数值
            ax.text(0.5, 0.25, f"{value:.1f}", fontsize=36, fontweight="bold",
                   ha="center", va="center", color=gauge_color)
            ax.text(0.5, 0.08, f"/ {max_val:.0f}", fontsize=14,
                   ha="center", va="center", color="#999")
            # 标签
            ax.text(0.5, 0.45, label_col if label_col else value_col if isinstance(value_col, str) else str(value_col[0]),
                   fontsize=12, ha="center", va="center", color="#333",
                   fontproperties=chinese_font)
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 0.6)
            plt.tight_layout()

        # R89: 瀑布图 (Waterfall)
        elif chart_type == "waterfall":
            if isinstance(value_col, str):
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()

            # 计算累计值
            running = [0]
            for v in values[:-1]:
                running.append(running[-1] + v)

            colors_waterfall = []
            for i, v in enumerate(values):
                if i == 0 or i == len(values) - 1:
                    colors_waterfall.append(bar_color)  # 首尾用主色
                elif v >= 0:
                    colors_waterfall.append("#34C759")  # 正值绿色
                else:
                    colors_waterfall.append("#FF3B30")  # 负值红色

            bars = ax.bar(labels, values, color=colors_waterfall, alpha=template["alpha"])

            # 添加连接线
            for i in range(len(values) - 1):
                x_pos = i + 0.5
                y_start = running[i + 1]
                y_end = running[i + 1]
                ax.plot([i + 0.5, i + 1.5], [y_start, y_end],
                       color="#999", linewidth=1, linestyle="--", alpha=0.6)

            ax.set_title(f"{label_col} - {value_col if isinstance(value_col, str) else value_col[0]}",
                        fontproperties=chinese_font, fontsize=template["title_fontsize"])
            ax.axhline(0, color="#333", linewidth=0.5)
            if template["grid"]:
                ax.grid(axis='y', alpha=0.3)
            plt.xticks(rotation=45, ha='right')
            plt.tight_layout()

        plt.tight_layout()

        # 保存 SVG
        svg_path = self.output_dir / f"{task_id}_chart_{chart_index}.svg"
        fig.savefig(svg_path, format="svg", bbox_inches='tight')
        plt.close(fig)

        return str(svg_path)

    # R89: SVG图表动画包装 - 为SVG添加CSS动画
    def wrap_svg_with_animation(self, svg_path: str, animation_type: str = "fade_in") -> str:
        """
        R89: 为SVG图表添加CSS动画效果
        animation_type: fade_in | grow_up | slide_in | bounce
        返回包装后的SVG字符串
        """
        if not Path(svg_path).exists():
            return svg_path

        svg_content = Path(svg_path).read_text(encoding="utf-8")

        # 动画CSS
        animations = {
            "fade_in": """
            @keyframes chartFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .chart-animated { animation: chartFadeIn 0.8s ease-out forwards; }
            .chart-animated > * { animation: chartFadeIn 0.6s ease-out forwards; }
            """,
            "grow_up": """
            @keyframes chartGrowUp {
                0% { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
                60% { transform: scaleY(1.05); }
                100% { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
            }
            .chart-animated { animation: chartGrowUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            """,
            "slide_in": """
            @keyframes chartSlideIn {
                from { opacity: 0; transform: translateX(-30px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .chart-animated { animation: chartSlideIn 0.6s ease-out forwards; }
            """,
            "bounce": """
            @keyframes chartBounce {
                0% { opacity: 0; transform: scale(0.3); }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            .chart-animated { animation: chartBounce 0.8s ease-out forwards; }
            """
        }

        css = animations.get(animation_type, animations["fade_in"])

        # 如果已有<style>标签，追加动画
        if "<style" in svg_content:
            svg_content = re.sub(
                r"(</style>)",
                css + r"\1",
                svg_content,
                count=1
            )
        else:
            # 在<svg>后插入style
            svg_content = svg_content.replace(
                "<svg",
                "<svg><style>" + css + "</style>",
                1
            )

        # 给顶层<g>或根<svg>添加class
        if 'class="chart-animated"' not in svg_content:
            svg_content = re.sub(
                r'(<svg[^>]*>)',
                r'\1<g class="chart-animated">',
                svg_content,
                count=1
            )
            svg_content = svg_content.replace("</svg>", "</g></svg>")

        # 写回文件
        Path(svg_path).write_text(svg_content, encoding="utf-8")
        return svg_path

    def process_upload(self, file_content: bytes, filename: str,
                       chart_type: str, label_col: str, value_col: str,
                       task_id: str,
                       # R62 新参数
                       theme_id: str = "default",
                       annotations: list[dict[str, Any]] | None = None,
                       show_trend_line: bool = False,
                       # R89 新参数
                       show_animation: bool = False,
                       animation_type: str = "fade_in",
                       ) -> dict:
        """处理上传文件并生成图表"""
        df = self.parse_file(file_content, filename)
        cols = self.extract_columns(df)

        # 如果没指定列，自动选择
        if not label_col and cols["label_columns"]:
            label_col = cols["label_columns"][0]
        if not value_col and cols["numeric_columns"]:
            value_col = cols["numeric_columns"][0]

        chart_index = 0
        chart_paths = []

        # 生成图表（传入 R62 新参数）
        svg_path = self.generate_chart_svg(
            df, chart_type, label_col, value_col, task_id, chart_index,
            theme_id=theme_id,
            annotations=annotations,
            show_trend_line=show_trend_line,
        )

        # R89: 如果启用动画，包装SVG
        if show_animation:
            svg_path = self.wrap_svg_with_animation(svg_path, animation_type)

        chart_paths.append({
            "index": chart_index,
            "svg_path": svg_path,
            "label_col": label_col,
            "value_col": value_col,
            "chart_type": chart_type,
            "theme_id": theme_id,
            "animated": show_animation,
        })

        # 如果有多列数值数据且用户选了堆叠图，生成综合图
        if chart_type == "stacked_bar" and len(cols["numeric_columns"]) > 1:
            svg_path = self.generate_chart_svg(
                df, "stacked_bar", label_col,
                cols["numeric_columns"], task_id, chart_index + 1,
                theme_id=theme_id,
            )
            if show_animation:
                svg_path = self.wrap_svg_with_animation(svg_path, animation_type)
            chart_paths.append({
                "index": chart_index + 1,
                "svg_path": svg_path,
                "label_col": label_col,
                "value_col": cols["numeric_columns"],
                "chart_type": "stacked_bar",
                "theme_id": theme_id,
                "animated": show_animation,
            })

        return {
            "success": True,
            "columns": cols,
            "charts": chart_paths,
            "svg_urls": [f"/static/charts/{Path(p['svg_path']).name}" for p in chart_paths]
        }
