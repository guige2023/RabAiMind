"""
PPT 优化 Agent (PPTX Optimizer Agent)

负责优化 PPTX 格式，支持多格式导出，验证 WPS/Office 兼容性
"""

import os
import shutil
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import tempfile


class OptimizationLevel(Enum):
    """优化级别"""
    NONE = "none"           # 不优化
    LIGHT = "light"         # 轻度优化
    MEDIUM = "medium"       # 中度优化
    AGGRESSIVE = "aggressive"  # 深度优化


class ExportFormat(Enum):
    """导出格式"""
    PPTX = "pptx"
    PDF = "pdf"
    PNG = "png"
    JPG = "jpg"


@dataclass
class OptimizationResult:
    """优化结果"""
    success: bool
    output_path: Optional[str] = None
    original_size: int = 0
    optimized_size: int = 0
    compression_ratio: float = 0.0
    error: Optional[str] = None


@dataclass
class CompatibilityReport:
    """兼容性报告"""
    wps_compatible: bool
    office_compatible: bool
    mobile_compatible: bool
    issues: List[str]


class PPTXOptimizerAgent:
    """
    PPT 优化 Agent

    负责:
    - 优化 PPTX 格式（压缩、清理）
    - 支持多格式导出（PDF, PNG, JPG）
    - 验证 WPS/Office 兼容性
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.output_dir = self.config.get("output_dir", "./output")
        self.temp_dir = self.config.get("temp_dir", "./temp")

    def optimize(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        level: OptimizationLevel = OptimizationLevel.MEDIUM
    ) -> OptimizationResult:
        """
        优化 PPTX 文件

        Args:
            input_path: 输入 PPTX 文件路径
            output_path: 输出文件路径
            level: 优化级别

        Returns:
            优化结果
        """
        if not os.path.exists(input_path):
            return OptimizationResult(
                success=False,
                error="输入文件不存在"
            )

        original_size = os.path.getsize(input_path)

        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)

        if not output_path:
            base_name = os.path.splitext(os.path.basename(input_path))[0]
            output_path = os.path.join(self.output_dir, f"{base_name}_optimized.pptx")

        try:
            if level == OptimizationLevel.NONE:
                # 仅复制
                shutil.copy2(input_path, output_path)
            else:
                # 执行优化
                output_path = self._do_optimize(input_path, output_path, level)

            optimized_size = os.path.getsize(output_path)
            compression_ratio = (1 - optimized_size / original_size) * 100 if original_size > 0 else 0

            return OptimizationResult(
                success=True,
                output_path=output_path,
                original_size=original_size,
                optimized_size=optimized_size,
                compression_ratio=compression_ratio
            )

        except Exception as e:
            return OptimizationResult(
                success=False,
                error=str(e)
            )

    def _do_optimize(
        self,
        input_path: str,
        output_path: str,
        level: OptimizationLevel
    ) -> str:
        """执行实际优化"""
        # 创建临时目录
        os.makedirs(self.temp_dir, exist_ok=True)
        temp_dir = tempfile.mkdtemp(dir=self.temp_dir)

        try:
            # 解压 PPTX
            import zipfile
            with zipfile.ZipFile(input_path, "r") as zf:
                zf.extractall(temp_dir)

            # 优化 XML 文件
            self._optimize_xml_files(temp_dir, level)

            # 移除不必要的文件
            self._remove_unnecessary_files(temp_dir)

            # 重新打包
            self._repack_pptx(temp_dir, output_path)

            return output_path

        finally:
            # 清理临时目录
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _optimize_xml_files(self, temp_dir: str, level: OptimizationLevel):
        """优化 XML 文件"""
        import re

        # 需要优化的 XML 文件
        xml_files = []
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith((".xml", ".rels")):
                    xml_files.append(os.path.join(root, file))

        # 优化每个 XML 文件
        for xml_file in xml_files:
            try:
                with open(xml_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                original_len = len(content)

                if level in (OptimizationLevel.MEDIUM, OptimizationLevel.AGGRESSIVE):
                    # 移除多余的空白
                    content = re.sub(r'>\s+<', '><', content)
                    content = re.sub(r'\s+', ' ', content)

                if level == OptimizationLevel.AGGRESSIVE:
                    # 移除注释
                    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

                # 仅在有实际变化时写入
                if len(content) < original_len:
                    with open(xml_file, "w", encoding="utf-8") as f:
                        f.write(content)

            except Exception:
                pass

    def _remove_unnecessary_files(self, temp_dir: str):
        """移除不必要的文件"""
        # 这些文件不是必需的
        unnecessary = [
            "docProps/thumbnail.jpeg",
            "ppt/media/image1.jpeg",  # 示例
        ]

        for item in unnecessary:
            path = os.path.join(temp_dir, item)
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

    def _repack_pptx(self, temp_dir: str, output_path: str):
        """重新打包 PPTX"""
        import zipfile

        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zf.write(file_path, arcname)

    def export(
        self,
        input_path: str,
        output_path: str,
        format: ExportFormat = ExportFormat.PPTX,
        quality: int = 80
    ) -> bool:
        """
        导出为其他格式

        Args:
            input_path: 输入 PPTX 文件路径
            output_path: 输出文件路径
            format: 目标格式
            quality: 质量（1-100）

        Returns:
            是否成功
        """
        if not os.path.exists(input_path):
            return False

        try:
            if format == ExportFormat.PPTX:
                # 复制文件
                shutil.copy2(input_path, output_path)
                return True

            elif format == ExportFormat.PDF:
                # 转换为 PDF
                return self._convert_to_pdf(input_path, output_path)

            elif format in (ExportFormat.PNG, ExportFormat.JPG):
                # 导出为图片
                return self._convert_to_images(input_path, output_path, format, quality)

            return False

        except Exception as e:
            print(f"导出失败: {e}")
            return False

    def _convert_to_pdf(self, input_path: str, output_path: str) -> bool:
        """转换为 PDF"""
        try:
            # 尝试使用 LibreOffice
            import subprocess

            result = subprocess.run(
                ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir",
                 os.path.dirname(output_path), input_path],
                capture_output=True,
                timeout=120
            )

            # LibreOffice 会自动命名输出文件
            expected = os.path.splitext(os.path.basename(input_path))[0] + ".pdf"
            expected_path = os.path.join(os.path.dirname(output_path), expected)

            if os.path.exists(expected_path):
                if expected_path != output_path:
                    shutil.move(expected_path, output_path)
                return True

            return result.returncode == 0

        except Exception as e:
            print(f"PDF 转换失败: {e}")
            return False

    def _convert_to_images(
        self,
        input_path: str,
        output_path: str,
        format: ExportFormat,
        quality: int
    ) -> bool:
        """转换为图片"""
        try:
            # 使用 python-pptx
            from pptx import Presentation
            from pptx.util import Inches

            prs = Presentation(input_path)

            # 输出目录
            output_dir = os.path.dirname(output_path)
            base_name = os.path.splitext(os.path.basename(output_path))[0]

            if not output_dir:
                output_dir = "."

            # 注意：python-pptx 本身不支持直接导出图片
            # 这里需要一个外部工具，如 LibreOffice
            # 这是一个简化实现

            print(f"提示: 导出 {len(prs.slides)} 张幻灯片为图片")

            # 尝试使用 LibreOffice
            import subprocess

            temp_dir = tempfile.mkdtemp()
            try:
                result = subprocess.run(
                    ["libreoffice", "--headless", "--convert-to",
                     "png", "--outdir", temp_dir, input_path],
                    capture_output=True,
                    timeout=120
                )

                if result.returncode == 0:
                    # 移动文件
                    for file in os.listdir(temp_dir):
                        if file.endswith(".png"):
                            src = os.path.join(temp_dir, file)
                            dst = os.path.join(output_dir, f"{base_name}_{file}")
                            shutil.move(src, dst)
                    return True

                return False
            finally:
                shutil.rmtree(temp_dir, ignore_errors=True)

        except Exception as e:
            print(f"图片转换失败: {e}")
            return False

    def check_compatibility(self, pptx_path: str) -> CompatibilityReport:
        """
        检查 PPTX 兼容性

        Args:
            pptx_path: PPTX 文件路径

        Returns:
            兼容性报告
        """
        issues = []

        if not os.path.exists(pptx_path):
            return CompatibilityReport(
                wps_compatible=False,
                office_compatible=False,
                mobile_compatible=False,
                issues=["文件不存在"]
            )

        # 基本结构检查
        try:
            import zipfile
            with zipfile.ZipFile(pptx_path, "r") as zf:
                names = zf.namelist()

                # 检查必需文件
                required_files = [
                    "ppt/presentation.xml",
                    "ppt/slides/slide1.xml"
                ]

                for req in required_files:
                    if req not in names:
                        issues.append(f"缺少必需文件: {req}")

                # 检查文件大小
                file_size = os.path.getsize(pptx_path)
                if file_size > 50 * 1024 * 1024:
                    issues.append("文件过大，可能影响移动端兼容性")

                # 检查幻灯片数量
                slide_count = sum(1 for n in names if n.startswith("ppt/slides/slide"))
                if slide_count > 50:
                    issues.append("幻灯片数量过多，可能影响移动端性能")

        except Exception as e:
            issues.append(f"文件结构检查失败: {e}")

        # 判定兼容性
        wps_compatible = len([i for i in issues if "缺少" in i]) == 0
        office_compatible = wps_compatible  # Office 兼容性更好
        mobile_compatible = len(issues) == 0

        return CompatibilityReport(
            wps_compatible=wps_compatible,
            office_compatible=office_compatible,
            mobile_compatible=mobile_compatible,
            issues=issues
        )


def create_optimizer_agent(config: Optional[Dict] = None) -> PPTXOptimizerAgent:
    """创建 PPTX 优化 Agent"""
    return PPTXOptimizerAgent(config)
