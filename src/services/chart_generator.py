"""
CSV/Excel 数据解析 + 图表生成服务
"""
import pandas as pd
import io
import base64
from pathlib import Path
from typing import Optional, List, Union

# R24优化: matplotlib 在模块级只导入一次，避免每次调用都重新初始化
_matplotlib_initialized = False
_mpl_pyplot = None
_chinese_font = None

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
    
    def generate_chart_svg(self, df: pd.DataFrame, chart_type: str,
                           label_col: str, value_col: Union[str, List[str]],
                           task_id: str, chart_index: int) -> str:
        """使用 matplotlib 生成图表 SVG（已优化: matplotlib 在模块级只初始化一次）"""
        _init_matplotlib()  # R24优化: 延迟初始化，只在首次调用时导入
        plt = _mpl_pyplot
        chinese_font = _chinese_font

        fig, ax = plt.subplots(figsize=(8, 5), dpi=150)
        
        labels = df[label_col].astype(str).tolist()
        
        if chart_type == "pie":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90)
            ax.set_title(label_col, fontproperties=chinese_font)
        elif chart_type == "bar":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.bar(labels, values, color="#165DFF")
            ax.set_title(f"{label_col} - {value_col}", fontproperties=chinese_font)
            plt.xticks(rotation=45, ha='right')
        elif chart_type == "line":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.plot(labels, values, marker='o', color="#165DFF", linewidth=2)
            ax.set_title(f"{label_col} - {value_col}", fontproperties=chinese_font)
            plt.xticks(rotation=45, ha='right')
        elif chart_type == "horizontal_bar":
            if isinstance(value_col, list):
                values = pd.to_numeric(df[value_col[0]], errors="coerce").fillna(0).tolist()
            else:
                values = pd.to_numeric(df[value_col], errors="coerce").fillna(0).tolist()
            ax.barh(labels, values, color="#34C759")
            ax.set_title(f"{label_col} - {value_col}", fontproperties=chinese_font)
        elif chart_type == "stacked_bar":
            # 多列堆叠柱图
            if isinstance(value_col, str):
                num_cols = df[[value_col]]
            else:
                num_cols = df[value_col]
            bottom = [0] * len(df)
            colors = ["#165DFF", "#34C759", "#FF9500", "#FF2D55"]
            for i, col in enumerate(num_cols.columns):
                ax.bar(labels, num_cols[col].fillna(0), bottom=bottom, 
                       label=col, color=colors[i % len(colors)])
                bottom = [b + v for b, v in zip(bottom, num_cols[col].fillna(0))]
            ax.legend()
            plt.xticks(rotation=45, ha='right')
        
        plt.tight_layout()
        
        # 保存 SVG
        svg_path = self.output_dir / f"{task_id}_chart_{chart_index}.svg"
        fig.savefig(svg_path, format="svg", bbox_inches='tight')
        plt.close(fig)
        
        return str(svg_path)
    
    def process_upload(self, file_content: bytes, filename: str,
                       chart_type: str, label_col: str, value_col: str,
                       task_id: str) -> dict:
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
        
        # 生成图表
        svg_path = self.generate_chart_svg(
            df, chart_type, label_col, value_col, task_id, chart_index
        )
        chart_paths.append({
            "index": chart_index,
            "svg_path": svg_path,
            "label_col": label_col,
            "value_col": value_col,
            "chart_type": chart_type
        })
        
        # 如果有多列数值数据且用户选了堆叠图，生成综合图
        if chart_type == "stacked_bar" and len(cols["numeric_columns"]) > 1:
            svg_path = self.generate_chart_svg(
                df, "stacked_bar", label_col, 
                cols["numeric_columns"], task_id, chart_index + 1
            )
            chart_paths.append({
                "index": chart_index + 1,
                "svg_path": svg_path,
                "label_col": label_col,
                "value_col": cols["numeric_columns"],
                "chart_type": "stacked_bar"
            })
        
        return {
            "success": True,
            "columns": cols,
            "charts": chart_paths,
            "svg_urls": [f"/static/charts/{Path(p['svg_path']).name}" for p in chart_paths]
        }
