"""
CSV/Excel 数据解析 + 图表生成服务
R62: 新增 Smart Fill / 图表标注 / 趋势线 / 图表模板
"""
import pandas as pd
import io
import base64
import numpy as np
from pathlib import Path
from typing import Optional, List, Union, Dict, Any

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
    import matplotlib.pyplot as plt
    import matplotlib.font_manager as fm
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
    
    CHART_TYPES = ["pie", "bar", "line", "horizontal_bar", "stacked_bar"]
    
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
    def compute_trend_line(self, values: List[float]) -> tuple:
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
    def _add_annotations(self, ax, annotations: List[Dict[str, Any]], chart_type: str, labels: List[str]):
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
        except Exception as e:
            # 标注出错不影响主图绘制
            pass
    
    def generate_chart_svg(self, df: pd.DataFrame, chart_type: str,
                           label_col: str, value_col: Union[str, List[str]],
                           task_id: str, chart_index: int,
                           # R62 新参数
                           theme_id: str = "default",
                           annotations: Optional[List[Dict[str, Any]]] = None,
                           show_trend_line: bool = False,
                           show_grid: Optional[bool] = None,
                           custom_colors: Optional[List[str]] = None,
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
        
        plt.tight_layout()
        
        # 保存 SVG
        svg_path = self.output_dir / f"{task_id}_chart_{chart_index}.svg"
        fig.savefig(svg_path, format="svg", bbox_inches='tight')
        plt.close(fig)
        
        return str(svg_path)
    
    def process_upload(self, file_content: bytes, filename: str,
                       chart_type: str, label_col: str, value_col: str,
                       task_id: str,
                       # R62 新参数
                       theme_id: str = "default",
                       annotations: Optional[List[Dict[str, Any]]] = None,
                       show_trend_line: bool = False,
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
        chart_paths.append({
            "index": chart_index,
            "svg_path": svg_path,
            "label_col": label_col,
            "value_col": value_col,
            "chart_type": chart_type,
            "theme_id": theme_id,
        })
        
        # 如果有多列数值数据且用户选了堆叠图，生成综合图
        if chart_type == "stacked_bar" and len(cols["numeric_columns"]) > 1:
            svg_path = self.generate_chart_svg(
                df, "stacked_bar", label_col, 
                cols["numeric_columns"], task_id, chart_index + 1,
                theme_id=theme_id,
            )
            chart_paths.append({
                "index": chart_index + 1,
                "svg_path": svg_path,
                "label_col": label_col,
                "value_col": cols["numeric_columns"],
                "chart_type": "stacked_bar",
                "theme_id": theme_id,
            })
        
        return {
            "success": True,
            "columns": cols,
            "charts": chart_paths,
            "svg_urls": [f"/static/charts/{Path(p['svg_path']).name}" for p in chart_paths]
        }
