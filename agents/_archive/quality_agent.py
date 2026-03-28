"""
质量管控 Agent (Quality Agent)

负责检查火山云内容质量、验证 SVG 规范、检查 PPTX 兼容性
"""

import os
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class QualityLevel(Enum):
    """质量等级"""
    EXCELLENT = "excellent"
    GOOD = "good"
    PASS = "pass"
    FAIL = "fail"


@dataclass
class QualityIssue:
    """质量问题"""
    severity: str  # critical, major, minor
    category: str
    message: str
    location: Optional[str] = None
    suggestion: Optional[str] = None


@dataclass
class QualityReport:
    """质量报告"""
    level: QualityLevel
    score: float  # 0-100
    issues: List[QualityIssue]
    summary: str


class QualityValidator:
    """质量验证器基类"""

    def validate(self, content: Any) -> QualityReport:
        raise NotImplementedError


class SVGValidator(QualityValidator):
    """SVG 验证器"""

    # 验证规则
    REQUIRED_ATTRS = ["viewBox", "xmlns"]
    VALID_VIEWBOX_PATTERN = re.compile(r"^\s*0\s+0\s+(\d+)\s+(\d+)\s*$")
    MAX_FILE_SIZE = 1024 * 1024  # 1MB
    MAX_ELEMENTS = 1000

    # 推荐的尺寸
    RECOMMENDED_SIZES = {
        "16:9": (1600, 900),
        "4:3": (1024, 768),
        "21:9": (1920, 817)
    }

    def validate(self, content: str) -> QualityReport:
        """验证 SVG 内容"""
        issues = []

        # 检查是否为有效的 SVG
        if not content.strip().startswith("<svg"):
            issues.append(QualityIssue(
                severity="critical",
                category="format",
                message="内容不是有效的 SVG 格式",
                suggestion="确保输出是完整的 SVG 代码"
            ))
            return QualityReport(
                level=QualityLevel.FAIL,
                score=0,
                issues=issues,
                summary="SVG 格式无效"
            )

        # 检查必需的命名空间
        if 'xmlns="http://www.w3.org/2000/svg"' not in content:
            issues.append(QualityIssue(
                severity="major",
                category="format",
                message="缺少 SVG 命名空间声明",
                suggestion='添加 xmlns="http://www.w3.org/2000/svg"'
            ))

        # 检查 viewBox
        viewbox_match = re.search(r'viewBox="([^"]+)"', content)
        if not viewbox_match:
            issues.append(QualityIssue(
                severity="critical",
                category="layout",
                message="缺少 viewBox 属性",
                suggestion='添加 viewBox="0 0 1600 900"'
            ))
        else:
            viewbox_value = viewbox_match.group(1)
            dimension_match = self.VALID_VIEWBOX_PATTERN.match(viewbox_value)
            if dimension_match:
                width = int(dimension_match.group(1))
                height = int(dimension_match.group(2))
                aspect_ratio = width / height

                # 检查是否为推荐的尺寸
                is_recommended = False
                for ratio, (rec_w, rec_h) in self.RECOMMENDED_SIZES.items():
                    if abs(width - rec_w) < 10 and abs(height - rec_h) < 10:
                        is_recommended = True
                        break

                if not is_recommended:
                    issues.append(QualityIssue(
                        severity="minor",
                        category="layout",
                        message=f"尺寸 {width}x{height} 不是标准推荐尺寸",
                        suggestion=f"推荐使用 1600x900 (16:9) 或其他标准比例"
                    ))

        # 检查宽度和高度
        width_match = re.search(r'\swidth="(\d+)"', content)
        height_match = re.search(r'\sheight="(\d+)"', content)

        if width_match and height_match:
            w, h = int(width_match.group(1)), int(height_match.group(1))
            if w > 2000 or h > 2000:
                issues.append(QualityIssue(
                    severity="minor",
                    category="performance",
                    message=f"尺寸 {w}x{h} 较大，可能影响渲染性能",
                    suggestion="考虑减小尺寸或使用 viewBox 缩放"
                ))

        # 检查元素数量
        element_count = content.count("<")
        if element_count > self.MAX_ELEMENTS:
            issues.append(QualityIssue(
                severity="major",
                category="performance",
                message=f"元素数量 {element_count} 过多",
                suggestion="简化 SVG 结构，减少元素数量"
            ))

        # 检查是否有文本内容
        if "<text" not in content and "<tspan" not in content:
            issues.append(QualityIssue(
                severity="minor",
                category="content",
                message="SVG 中没有文本元素",
                suggestion="添加文本以提供实际内容"
            ))

        # 计算分数
        score = self._calculate_score(issues)
        level = self._determine_level(score)

        return QualityReport(
            level=level,
            score=score,
            issues=issues,
            summary=self._generate_summary(issues, score)
        )

    def _calculate_score(self, issues: List[QualityIssue]) -> float:
        """计算质量分数"""
        base_score = 100
        for issue in issues:
            if issue.severity == "critical":
                base_score -= 25
            elif issue.severity == "major":
                base_score -= 10
            elif issue.severity == "minor":
                base_score -= 3
        return max(0, base_score)

    def _determine_level(self, score: float) -> QualityLevel:
        """确定质量等级"""
        if score >= 90:
            return QualityLevel.EXCELLENT
        elif score >= 70:
            return QualityLevel.GOOD
        elif score >= 50:
            return QualityLevel.PASS
        else:
            return QualityLevel.FAIL

    def _generate_summary(self, issues: List[QualityIssue], score: float) -> str:
        """生成摘要"""
        critical = sum(1 for i in issues if i.severity == "critical")
        major = sum(1 for i in issues if i.severity == "major")
        minor = sum(1 for i in issues if i.severity == "minor")

        return f"发现 {critical} 个严重问题, {major} 个主要问题, {minor} 个轻微问题。质量分数: {score:.1f}"


class ContentValidator(QualityValidator):
    """内容质量验证器"""

    MIN_TITLE_LENGTH = 2
    MAX_TITLE_LENGTH = 100
    MIN_CONTENT_LENGTH = 10
    MAX_CONTENT_LENGTH = 5000

    def validate(self, content: Dict) -> QualityReport:
        """验证内容质量"""
        issues = []

        # 验证标题
        title = content.get("title", "")
        if not title:
            issues.append(QualityIssue(
                severity="critical",
                category="content",
                message="缺少标题",
                suggestion="为每一页添加标题"
            ))
        elif len(title) < self.MIN_TITLE_LENGTH:
            issues.append(QualityIssue(
                severity="major",
                category="content",
                message=f"标题太短 ({len(title)} 字符)",
                suggestion=f"标题至少需要 {self.MIN_TITLE_LENGTH} 个字符"
            ))
        elif len(title) > self.MAX_TITLE_LENGTH:
            issues.append(QualityIssue(
                severity="minor",
                category="content",
                message=f"标题太长 ({len(title)} 字符)",
                suggestion=f"标题应控制在 {self.MAX_TITLE_LENGTH} 个字符以内"
            ))

        # 验证内容
        content_text = content.get("content", "")
        if isinstance(content_text, list):
            content_text = " ".join(content_text)

        if not content_text:
            issues.append(QualityIssue(
                severity="critical",
                category="content",
                message="缺少内容",
                suggestion="为每一页添加内容"
            ))
        elif len(content_text) < self.MIN_CONTENT_LENGTH:
            issues.append(QualityIssue(
                severity="major",
                category="content",
                message=f"内容太少 ({len(content_text)} 字符)",
                suggestion="增加更多内容"
            ))
        elif len(content_text) > self.MAX_CONTENT_LENGTH:
            issues.append(QualityIssue(
                severity="minor",
                category="content",
                message=f"内容过多 ({len(content_text)} 字符)",
                suggestion=f"精简内容，控制在 {self.MAX_CONTENT_LENGTH} 个字符以内"
            ))

        # 验证类型
        slide_type = content.get("type", "")
        valid_types = ["title_slide", "outline", "content", "chart", "image", "quote", "summary", "thank_you"]
        if slide_type not in valid_types:
            issues.append(QualityIssue(
                severity="major",
                category="format",
                message=f"未知的幻灯片类型: {slide_type}",
                suggestion=f"使用有效的类型: {', '.join(valid_types)}"
            ))

        score = self._calculate_score(issues)
        level = self._determine_level(score)

        return QualityReport(
            level=level,
            score=score,
            issues=issues,
            summary=self._generate_summary(issues, score)
        )

    def _calculate_score(self, issues: List[QualityIssue]) -> float:
        base_score = 100
        for issue in issues:
            if issue.severity == "critical":
                base_score -= 30
            elif issue.severity == "major":
                base_score -= 15
            elif issue.severity == "minor":
                base_score -= 5
        return max(0, base_score)

    def _determine_level(self, score: float) -> QualityLevel:
        if score >= 90:
            return QualityLevel.EXCELLENT
        elif score >= 70:
            return QualityLevel.GOOD
        elif score >= 50:
            return QualityLevel.PASS
        else:
            return QualityLevel.FAIL

    def _generate_summary(self, issues: List[QualityIssue], score: float) -> str:
        critical = sum(1 for i in issues if i.severity == "critical")
        major = sum(1 for i in issues if i.severity == "major")
        return f"内容质量分数: {score:.1f} (严重: {critical}, 主要: {major})"


class PPTXValidator(QualityValidator):
    """PPTX 文件验证器"""

    MIN_FILE_SIZE = 1024  # 1KB
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

    def validate(self, file_path: str) -> QualityReport:
        """验证 PPTX 文件"""
        issues = []

        # 检查文件是否存在
        if not os.path.exists(file_path):
            issues.append(QualityIssue(
                severity="critical",
                category="file",
                message="文件不存在",
                suggestion=f"检查文件路径: {file_path}"
            ))
            return QualityReport(
                level=QualityLevel.FAIL,
                score=0,
                issues=issues,
                summary="文件不存在"
            )

        # 检查文件大小
        file_size = os.path.getsize(file_path)
        if file_size < self.MIN_FILE_SIZE:
            issues.append(QualityIssue(
                severity="major",
                category="file",
                message=f"文件太小 ({file_size} bytes)",
                suggestion="文件可能损坏或为空"
            ))
        elif file_size > self.MAX_FILE_SIZE:
            issues.append(QualityIssue(
                severity="minor",
                category="performance",
                message=f"文件较大 ({file_size / 1024 / 1024:.1f} MB)",
                suggestion="考虑优化文件大小"
            ))

        # 检查文件扩展名
        if not file_path.lower().endswith(".pptx"):
            issues.append(QualityIssue(
                severity="major",
                category="format",
                message="文件扩展名不是 .pptx",
                suggestion="使用正确的文件扩展名"
            ))

        # 检查 ZIP 格式有效性
        if not self._is_valid_zip(file_path):
            issues.append(QualityIssue(
                severity="critical",
                category="format",
                message="PPTX 文件格式无效",
                suggestion="文件可能损坏"
            ))

        # 检查必需的 PPT 文件
        if not self._has_required_ppt_files(file_path):
            issues.append(QualityIssue(
                severity="critical",
                category="format",
                message="缺少必需的 PPT 文件",
                suggestion="PPT 文件结构不完整"
            ))

        score = self._calculate_score(issues)
        level = self._determine_level(score)

        return QualityReport(
            level=level,
            score=score,
            issues=issues,
            summary=self._generate_summary(issues, score, file_size)
        )

    def _is_valid_zip(self, file_path: str) -> bool:
        """检查是否为有效的 ZIP 文件"""
        try:
            import zipfile
            return zipfile.is_zipfile(file_path)
        except Exception:
            return False

    def _has_required_ppt_files(self, file_path: str) -> bool:
        """检查必需的 PPT 文件"""
        try:
            import zipfile
            with zipfile.ZipFile(file_path, "r") as zf:
                names = zf.namelist()
                # PPTX 必须包含这些文件
                required = ["ppt/presentation.xml"]
                return any(name in names for name in required)
        except Exception:
            return False

    def _calculate_score(self, issues: List[QualityIssue]) -> float:
        base_score = 100
        for issue in issues:
            if issue.severity == "critical":
                base_score -= 35
            elif issue.severity == "major":
                base_score -= 15
            elif issue.severity == "minor":
                base_score -= 5
        return max(0, base_score)

    def _determine_level(self, score: float) -> QualityLevel:
        if score >= 90:
            return QualityLevel.EXCELLENT
        elif score >= 70:
            return QualityLevel.GOOD
        elif score >= 50:
            return QualityLevel.PASS
        else:
            return QualityLevel.FAIL

    def _generate_summary(self, issues: List[QualityIssue], score: float, file_size: int) -> str:
        critical = sum(1 for i in issues if i.severity == "critical")
        size_mb = file_size / 1024 / 1024
        return f"PPTX 质量分数: {score:.1f}, 大小: {size_mb:.2f} MB, 严重问题: {critical}"


class QualityAgent:
    """
    质量管控 Agent

    负责整个生成流程的质量控制:
    - 检查火山云生成的内容质量
    - 验证 SVG 规范
    - 检查 PPTX 兼容性
    - 不符合标准则打回重制
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.svg_validator = SVGValidator()
        self.content_validator = ContentValidator()
        self.pptx_validator = PPTXValidator()

    def validate_svg(self, svg_content: str) -> QualityReport:
        """验证 SVG 质量"""
        return self.svg_validator.validate(svg_content)

    def validate_content(self, content: Dict) -> QualityReport:
        """验证内容质量"""
        return self.content_validator.validate(content)

    def validate_pptx(self, file_path: str) -> QualityReport:
        """验证 PPTX 质量"""
        return self.pptx_validator.validate(file_path)

    def validate_slides(self, slides: List[Dict]) -> Tuple[List[Dict], List[QualityReport]]:
        """批量验证幻灯片"""
        valid_slides = []
        reports = []

        for i, slide in enumerate(slides):
            report = self.content_validator.validate(slide)
            reports.append(report)

            # 只有通过基本检查的才保留
            if report.level != QualityLevel.FAIL:
                valid_slides.append(slide)

        return valid_slides, reports

    def check_and_fix_svg(self, svg_content: str) -> Tuple[str, QualityReport]:
        """检查并尝试修复 SVG"""
        report = self.validate_svg(svg_content)

        if report.level == QualityLevel.FAIL:
            # 返回原始内容，等待重新生成
            return svg_content, report

        # 如果有警告，尝试修复
        if report.issues:
            fixed = self._attempt_fix_svg(svg_content, report.issues)
            return fixed, self.validate_svg(fixed)

        return svg_content, report

    def _attempt_fix_svg(self, svg: str, issues: List[QualityIssue]) -> str:
        """尝试修复 SVG 问题"""
        fixed = svg

        # 修复缺少命名空间的问题
        if 'xmlns="http://www.w3.org/2000/svg"' not in fixed:
            fixed = fixed.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)

        # 修复缺少 viewBox 的问题
        if 'viewBox="' not in fixed:
            # 尝试从 width/height 获取
            w_match = re.search(r'width="(\d+)"', fixed)
            h_match = re.search(r'height="(\d+)"', fixed)
            if w_match and h_match:
                w, h = w_match.group(1), h_match.group(1)
                fixed = fixed.replace("<svg", f'<svg viewBox="0 0 {w} {h}"', 1)
            else:
                # 默认使用 16:9
                fixed = fixed.replace("<svg", '<svg viewBox="0 0 1600 900"', 1)

        return fixed


def create_quality_agent(config: Optional[Dict] = None) -> QualityAgent:
    """创建质量管控 Agent"""
    return QualityAgent(config)
