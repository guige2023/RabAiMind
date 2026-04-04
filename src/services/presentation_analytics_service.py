# -*- coding: utf-8 -*-
"""
Presentation Analytics Service - 演示分析服务
Tracks who viewed presentations, time per slide, heatmaps, scroll depth
"""

import json
import os
import uuid
import threading
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'presentation_analytics')
os.makedirs(DATA_DIR, exist_ok=True)

LOCK = threading.Lock()

# Heatmap grid: divide slide into NxN zones
HEATMAP_GRID = 8  # 8x8 grid


class PresentationAnalyticsService:
    """Service for tracking presentation view analytics"""

    _instance: Optional['PresentationAnalyticsService'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._lock = LOCK
        self._sessions: Dict[str, dict] = {}  # session_id -> session data
        self._load_all()

    def _data_file(self, task_id: str) -> str:
        return os.path.join(DATA_DIR, f"{task_id}.json")

    def _load_all(self):
        """Load all analytics data into memory"""
        try:
            for fname in os.listdir(DATA_DIR):
                if fname.endswith('.json'):
                    fpath = os.path.join(DATA_DIR, fname)
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        task_id = fname.replace('.json', '')
                        # Load sessions into memory
                        for session in data.get('sessions', []):
                            sid = session.get('session_id')
                            if sid:
                                self._sessions[sid] = session
        except Exception:
            pass

    def _save(self, task_id: str, data: dict):
        """Persist data to disk"""
        with self._lock:
            fpath = self._data_file(task_id)
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    def _get_data(self, task_id: str) -> dict:
        """Get analytics data for a presentation"""
        fpath = self._data_file(task_id)
        if os.path.exists(fpath):
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass

        return {
            "task_id": task_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "sessions": [],  # list of view sessions
            "total_views": 0,
            "unique_viewers": set(),
            "heatmap_aggregated": {},  # slide_idx -> aggregated grid weights
        }

    # ==================== View Session Tracking ====================

    def track_view_start(self, task_id: str, viewer_id: str, viewer_name: str = "Anonymous") -> str:
        """
        Start a new view session for a presentation.
        Returns session_id.
        """
        session_id = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "task_id": task_id,
            "viewer_id": viewer_id,
            "viewer_name": viewer_name,
            "started_at": datetime.now().isoformat(),
            "ended_at": None,
            "duration_seconds": 0,
            "slide_views": [],  # [{slide_index, enter_time, exit_time, duration_seconds}]
            "current_slide_index": 0,
            "scroll_depth_percent": 0,
            "heatmap_data": {},  # slide_index -> [{x, y, weight}]
            "device_type": "web",
            "completed": False,
        }

        with self._lock:
            self._sessions[session_id] = session

        # Load existing data and append session
        data = self._get_data(task_id)
        data["sessions"].append(session)
        data["total_views"] = data.get("total_views", 0) + 1
        if "unique_viewers" not in data:
            data["unique_viewers"] = []
        if viewer_id not in data["unique_viewers"]:
            data["unique_viewers"].append(viewer_id)
        data["updated_at"] = datetime.now().isoformat()
        self._save(task_id, data)

        return session_id

    def track_slide_view(self, session_id: str, slide_index: int, duration_seconds: float = 0,
                          enter_time: Optional[str] = None) -> dict:
        """
        Record time spent on a specific slide.
        Called periodically via heartbeat or when user navigates to next slide.
        """
        with self._lock:
            if session_id not in self._sessions:
                return {"success": False, "error": "session not found"}

            session = self._sessions[session_id]

            # Update or append slide view
            slide_views = session.get("slide_views", [])
            # Find if this slide already has an open entry (no exit_time yet)
            open_entry = next(
                (sv for sv in slide_views if sv["slide_index"] == slide_index and sv.get("exit_time") is None),
                None
            )

            now_iso = datetime.now().isoformat()
            if open_entry:
                open_entry["exit_time"] = now_iso
                open_entry["duration_seconds"] = duration_seconds
            else:
                slide_views.append({
                    "slide_index": slide_index,
                    "enter_time": enter_time or now_iso,
                    "exit_time": now_iso,
                    "duration_seconds": duration_seconds,
                })

            session["slide_views"] = slide_views
            session["current_slide_index"] = slide_index

            # Persist
            self._save(session["task_id"], session.copy())

        return {"success": True, "session_id": session_id, "slide_index": slide_index}

    def track_heatmap(self, session_id: str, slide_index: int, heatmap_points: List[dict]) -> dict:
        """
        Record heatmap attention data for a slide.
        heatmap_points: [{"x": 0.0-1.0, "y": 0.0-1.0, "weight": float}, ...]
        """
        with self._lock:
            if session_id not in self._sessions:
                return {"success": False, "error": "session not found"}

            session = self._sessions[session_id]

            if slide_index not in session.get("heatmap_data", {}):
                session["heatmap_data"][slide_index] = []

            session["heatmap_data"][slide_index].extend(heatmap_points)
            self._save(session["task_id"], session.copy())

        return {"success": True, "session_id": session_id, "slide_index": slide_index}

    def track_scroll_depth(self, session_id: str, scroll_percent: float) -> dict:
        """Record scroll depth for web-hosted presentations (0-100)"""
        with self._lock:
            if session_id not in self._sessions:
                return {"success": False, "error": "session not found"}

            session = self._sessions[session_id]
            session["scroll_depth_percent"] = max(session.get("scroll_depth_percent", 0), scroll_percent)
            self._save(session["task_id"], session.copy())

        return {"success": True, "session_id": session_id, "scroll_depth_percent": scroll_percent}

    def end_session(self, session_id: str, duration_seconds: float = 0) -> dict:
        """End a view session"""
        with self._lock:
            if session_id not in self._sessions:
                return {"success": False, "error": "session not found"}

            session = self._sessions[session_id]
            session["ended_at"] = datetime.now().isoformat()
            session["duration_seconds"] = duration_seconds
            session["completed"] = True

            self._save(session["task_id"], session.copy())

        return {"success": True, "session_id": session_id, "duration_seconds": duration_seconds}

    # ==================== Analytics Retrieval ====================

    def get_presentation_analytics(self, task_id: str) -> dict:
        """Get all analytics for a presentation"""
        data = self._get_data(task_id)

        sessions = data.get("sessions", [])
        total_views = data.get("total_views", 0)
        unique_viewers = data.get("unique_viewers", [])
        if isinstance(unique_viewers, set):
            unique_viewers = list(unique_viewers)

        # Per-slide time analysis
        slide_time_map: Dict[int, List[float]] = defaultdict(list)
        heatmap_aggregated: Dict[int, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        scroll_depths = []

        for session in sessions:
            for sv in session.get("slide_views", []):
                if sv.get("duration_seconds", 0) > 0:
                    slide_time_map[sv["slide_index"]].append(sv["duration_seconds"])

            for slide_idx, points in session.get("heatmap_data", {}).items():
                for pt in points:
                    grid_x = min(int(pt.get("x", 0) * HEATMAP_GRID), HEATMAP_GRID - 1)
                    grid_y = min(int(pt.get("y", 0) * HEATMAP_GRID), HEATMAP_GRID - 1)
                    weight = pt.get("weight", 1.0)
                    heatmap_aggregated[slide_idx][f"{grid_x},{grid_y}"] += weight

            if session.get("scroll_depth_percent", 0) > 0:
                scroll_depths.append(session["scroll_depth_percent"])

        # Build per-slide stats
        slide_stats = []
        all_slide_indices = sorted(slide_time_map.keys())
        for slide_idx in all_slide_indices:
            times = slide_time_map[slide_idx]
            avg_time = sum(times) / len(times) if times else 0
            max_time = max(times) if times else 0
            min_time = min(times) if times else 0
            heatmap_grid = {}
            for cell, weight in heatmap_aggregated.get(slide_idx, {}).items():
                heatmap_grid[cell] = weight
            slide_stats.append({
                "slide_index": slide_idx,
                "view_count": len(times),
                "avg_time_seconds": round(avg_time, 1),
                "max_time_seconds": round(max_time, 1),
                "min_time_seconds": round(min_time, 1),
                "total_time_seconds": round(sum(times), 1),
                "heatmap_grid": heatmap_grid,  # {"x,y": weight, ...}
            })

        # Viewer list
        viewers = []
        seen = set()
        for session in sessions:
            vid = session.get("viewer_id")
            if vid and vid not in seen:
                seen.add(vid)
                viewers.append({
                    "viewer_id": vid,
                    "viewer_name": session.get("viewer_name", "Anonymous"),
                    "session_count": sum(1 for s in sessions if s.get("viewer_id") == vid),
                    "first_view": session.get("started_at"),
                    "last_view": session.get("ended_at") or session.get("started_at"),
                    "total_duration_seconds": sum(
                        sv.get("duration_seconds", 0)
                        for s in sessions if s.get("viewer_id") == vid
                        for sv in s.get("slide_views", [])
                    ),
                })

        # Scroll depth stats
        avg_scroll = sum(scroll_depths) / len(scroll_depths) if scroll_depths else 0
        scroll_reached_end = sum(1 for d in scroll_depths if d >= 90)

        # Aggregate heatmap for overview (average across slides)
        overview_heatmap: Dict[str, float] = defaultdict(float)
        for slide_heatmap in heatmap_aggregated.values():
            for cell, weight in slide_heatmap.items():
                overview_heatmap[cell] += weight
        # Normalize
        max_weight = max(overview_heatmap.values()) if overview_heatmap else 1
        overview_heatmap = {k: round(v / max_weight, 3) for k, v in overview_heatmap.items()}

        # Calculate effectiveness score (0-100)
        effectiveness_score = self._calculate_effectiveness_score(
            total_views=total_views,
            unique_viewers=len(unique_viewers),
            scroll_depths=scroll_depths,
            scroll_reached_end=scroll_reached_end,
            overview_heatmap=overview_heatmap,
            slide_stats=slide_stats,
        )

        return {
            "success": True,
            "task_id": task_id,
            "total_views": total_views,
            "unique_viewers": len(unique_viewers),
            "viewer_list": viewers,
            "slide_stats": slide_stats,
            "avg_scroll_depth_percent": round(avg_scroll, 1),
            "scroll_depth_reached_end_count": scroll_reached_end,
            "scroll_depth_samples": len(scroll_depths),
            "heatmap_grid_size": HEATMAP_GRID,
            "overview_heatmap": overview_heatmap,
            "effectiveness_score": effectiveness_score,
            # R134: Presentation Analytics Dashboard
            "geo_distribution": self.get_geo_distribution(task_id),
            "browser_device_breakdown": self.get_browser_device_breakdown(task_id),
            "cta_stats": self.get_cta_stats(task_id),
        }

    # ==================== Effectiveness Score ====================

    def _calculate_effectiveness_score(
        self,
        total_views: int,
        unique_viewers: int,
        scroll_depths: List[float],
        scroll_reached_end: int,
        overview_heatmap: Dict[str, float],
        slide_stats: List[dict],
    ) -> dict:
        """
        Calculate a composite presentation effectiveness score (0-100).
        Returns the score and its breakdown components.

        Scoring components (total 100 points):
        - Reach score (20 pts): how many unique viewers
        - Depth score (25 pts): scroll depth / completion rate
        - Engagement score (20 pts): total views / avg session duration
        - Hotspot coverage (15 pts): how many grid cells got attention
        - Slide completion rate (20 pts): how many viewers read all slides
        """
        scores = {}

        # 1. Reach score (0-20): log scale, more viewers = higher score
        # Baseline: 1 viewer = 5pts, 10 viewers = 15pts, 50+ = 20pts
        if unique_viewers <= 0:
            reach_score = 0
        else:
            reach_score = min(20, round(5 + 6.5 * (1 - 1 / (1 + unique_viewers / 5)), 1))
        scores["reach_score"] = reach_score
        scores["reach_max"] = 20

        # 2. Depth score (0-25): scroll depth completion
        if scroll_depths:
            avg_depth = sum(scroll_depths) / len(scroll_depths)
            depth_score = min(25, round((avg_depth / 100) * 25, 1))
        else:
            depth_score = 0
        scores["depth_score"] = depth_score
        scores["depth_max"] = 25

        # 3. Engagement score (0-20): session count and view frequency
        if total_views > 0:
            # Higher views + more unique = higher engagement
            engagement_score = min(20, round(
                (10 if total_views >= 5 else total_views * 2) +
                (10 if unique_viewers >= 3 else unique_viewers * 3.33)
            ))
        else:
            engagement_score = 0
        scores["engagement_score"] = engagement_score
        scores["engagement_max"] = 20

        # 4. Hotspot coverage score (0-15): what % of grid cells got any attention
        grid_size = HEATMAP_GRID
        total_cells = grid_size * grid_size
        if overview_heatmap:
            covered_cells = len([w for w in overview_heatmap.values() if w > 0])
            coverage_pct = covered_cells / total_cells
            hotspot_score = min(15, round(coverage_pct * 15, 1))
        else:
            hotspot_score = 0
        scores["hotspot_score"] = hotspot_score
        scores["hotspot_max"] = 15

        # 5. Slide completion score (0-20): how many reached 90%+ scroll
        total_sessions = len(scroll_depths)
        if total_sessions > 0:
            completion_rate = scroll_reached_end / total_sessions
            completion_score = min(20, round(completion_rate * 20, 1))
        else:
            completion_score = 0
        scores["completion_score"] = completion_score
        scores["completion_max"] = 20

        total = round(sum([
            reach_score, depth_score, engagement_score,
            hotspot_score, completion_score
        ]), 1)

        return {
            "total": total,
            "reach_score": scores["reach_score"],
            "depth_score": scores["depth_score"],
            "engagement_score": scores["engagement_score"],
            "hotspot_score": scores["hotspot_score"],
            "completion_score": scores["completion_score"],
        }

    # ==================== PDF Report Generation ====================

    def generate_pdf_report(self, task_id: str) -> bytes:
        """
        Generate a PDF analytics report for a presentation.
        Returns raw PDF bytes.
        """
        analytics = self.get_presentation_analytics(task_id)

        # Build HTML content
        html = self._build_report_html(analytics)

        # Try reportlab first, fallback to weasyprint/html2pdf
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.units import mm
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            from reportlab.pdfgen import canvas
            from io import BytesIO

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
            styles = getSampleStyleSheet()

            title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=20, spaceAfter=20, alignment=TA_CENTER, textColor=colors.HexColor('#165DFF'))
            heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.HexColor('#1f1f1f'))
            normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=10, spaceAfter=6)

            story = []

            story.append(Paragraph(f"📊 RabAiMind 演示分析报告", title_style))
            story.append(Paragraph(f"任务ID: {task_id}", normal_style))
            story.append(Paragraph(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
            story.append(Spacer(1, 15*mm))

            # Summary section
            story.append(Paragraph("📈 核心指标概览", heading_style))
            summary_data = [
                ["指标", "数值"],
                ["总浏览次数", str(analytics.get("total_views", 0))],
                ["独立访客数", str(analytics.get("unique_viewers", 0))],
                ["追踪幻灯片数", str(len(analytics.get("slide_stats", [])))],
                ["平均滚动深度", f"{analytics.get('avg_scroll_depth_percent', 0)}%"],
                ["完整阅读人数", str(analytics.get("scroll_depth_reached_end_count", 0))],
            ]
            t = Table(summary_data, colWidths=[80*mm, 60*mm])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#165DFF')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')]),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
            story.append(Spacer(1, 10*mm))

            # Effectiveness Score
            es = analytics.get("effectiveness_score")
            if es:
                story.append(Paragraph("🎯 演示效果评分", heading_style))
                eff_total = es.get("total", 0)
                if eff_total >= 80:
                    eff_label = "卓越"
                    eff_color = "#00B42A"
                elif eff_total >= 60:
                    eff_label = "优秀"
                    eff_color = "#165DFF"
                elif eff_total >= 40:
                    eff_label = "良好"
                    eff_color = "#FF7D00"
                elif eff_total >= 20:
                    eff_label = "一般"
                    eff_color = "#F53FAD"
                else:
                    eff_label = "待提升"
                    eff_color = "#8c8c8c"

                eff_data = [
                    ["综合评分", f"{eff_total} / 100 — {eff_label}"],
                    ["触达力 (20分)", f"{es.get('reach_score', 0)} / 20"],
                    ["阅读深度 (25分)", f"{es.get('depth_score', 0)} / 25"],
                    ["互动度 (20分)", f"{es.get('engagement_score', 0)} / 20"],
                    ["热点覆盖 (15分)", f"{es.get('hotspot_score', 0)} / 15"],
                    ["完成率 (20分)", f"{es.get('completion_score', 0)} / 20"],
                ]
                t_eff = Table(eff_data, colWidths=[80*mm, 60*mm])
                t_eff.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(eff_color.lstrip('#'))),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')]),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ]))
                story.append(t_eff)
                story.append(Spacer(1, 10*mm))

            # Slide stats
            if analytics.get("slide_stats"):
                story.append(Paragraph("⏱ 幻灯片浏览时长", heading_style))
                slide_data = [["页码", "浏览次数", "平均时长(秒)", "总时长(秒)"]]
                for s in analytics.get("slide_stats", []):
                    slide_data.append([
                        str(s["slide_index"] + 1),
                        str(s["view_count"]),
                        str(s["avg_time_seconds"]),
                        str(s["total_time_seconds"]),
                    ])
                t2 = Table(slide_data, colWidths=[30*mm, 30*mm, 35*mm, 35*mm])
                t2.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#165DFF')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')]),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))
                story.append(t2)
                story.append(Spacer(1, 10*mm))

            # Viewer list
            if analytics.get("viewer_list"):
                story.append(Paragraph("👁 访客列表", heading_style))
                viewer_data = [["访客名称", "会话次数", "总浏览时长(秒)"]]
                for v in analytics.get("viewer_list", []):
                    viewer_data.append([
                        v.get("viewer_name", "Anonymous")[:20],
                        str(v.get("session_count", 0)),
                        str(round(v.get("total_duration_seconds", 0), 1)),
                    ])
                t3 = Table(viewer_data, colWidths=[60*mm, 40*mm, 40*mm])
                t3.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#165DFF')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')]),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))
                story.append(t3)
                story.append(Spacer(1, 10*mm))

            # Scroll depth
            if analytics.get("scroll_depth_samples", 0) > 0:
                story.append(Paragraph("📜 滚动深度", heading_style))
                story.append(Paragraph(
                    f"平均滚动深度: {analytics.get('avg_scroll_depth_percent', 0)}%<br/>"
                    f"完全阅读（≥90%）人数: {analytics.get('scroll_depth_reached_end_count', 0)} / {analytics.get('scroll_depth_samples', 0)}",
                    normal_style
                ))
                story.append(Spacer(1, 5*mm))

            # Footer
            story.append(Spacer(1, 10*mm))
            footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
            story.append(Paragraph("由 RabAiMind 演示分析系统生成 | https://rabaicloud.com", footer_style))

            doc.build(story)
            return buffer.getvalue()

        except ImportError:
            # Fallback: use HTML to PDF via subprocess (wkhtmltopdf)
            try:
                import subprocess
                # Write HTML to temp file
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
                    f.write(html)
                    html_path = f.name
                pdf_path = html_path + '.pdf'
                result = subprocess.run(
                    ['wkhtmltopdf', '--enable-local-file-access', '--print-media-type', html_path, pdf_path],
                    capture_output=True, timeout=30
                )
                if result.returncode == 0 and os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as f:
                        pdf_bytes = f.read()
                    os.unlink(html_path)
                    os.unlink(pdf_path)
                    return pdf_bytes
                else:
                    raise Exception(f"wkhtmltopdf failed: {result.stderr.decode()}")
            except Exception as e:
                logger = __import__('logging').getLogger(__name__)
                logger.warning(f"PDF generation failed: {e}, returning HTML report")
                return html.encode('utf-8')

    def _build_report_html(self, analytics: dict) -> str:
        """Build HTML report content"""
        slide_rows = ""
        for s in analytics.get("slide_stats", []):
            slide_rows += f"""
            <tr>
                <td>{s['slide_index'] + 1}</td>
                <td>{s['view_count']}</td>
                <td>{s['avg_time_seconds']}</td>
                <td>{s['max_time_seconds']}</td>
                <td>{s['total_time_seconds']}</td>
            </tr>"""

        viewer_rows = ""
        for v in analytics.get("viewer_list", []):
            viewer_rows += f"""
            <tr>
                <td>{v.get('viewer_name', 'Anonymous')}</td>
                <td>{v.get('session_count', 0)}</td>
                <td>{round(v.get('total_duration_seconds', 0), 1)}</td>
            </tr>"""

        es = analytics.get("effectiveness_score")
        eff_section = ""
        if es:
            eff_total = es.get("total", 0)
            if eff_total >= 80:
                eff_label = "卓越"
                eff_color = "#00B42A"
            elif eff_total >= 60:
                eff_label = "优秀"
                eff_color = "#165DFF"
            elif eff_total >= 40:
                eff_label = "良好"
                eff_color = "#FF7D00"
            elif eff_total >= 20:
                eff_label = "一般"
                eff_color = "#F53FAD"
            else:
                eff_label = "待提升"
                eff_color = "#8c8c8c"

            eff_section = f"""
<h2>🎯 演示效果评分</h2>
<div class="stats-grid">
  <div class="stat-card" style="background: {eff_color}22; border: 2px solid {eff_color}">
    <div class="stat-value" style="color: {eff_color}">{eff_total}</div>
    <div class="stat-label">{eff_label}</div>
  </div>
  <div class="stat-card"><div class="stat-value">{es.get('reach_score', 0)}</div><div class="stat-label">触达力 /20</div></div>
  <div class="stat-card"><div class="stat-value">{es.get('depth_score', 0)}</div><div class="stat-label">阅读深度 /25</div></div>
  <div class="stat-card"><div class="stat-value">{es.get('engagement_score', 0)}</div><div class="stat-label">互动度 /20</div></div>
  <div class="stat-card"><div class="stat-value">{es.get('hotspot_score', 0)}</div><div class="stat-label">热点覆盖 /15</div></div>
  <div class="stat-card"><div class="stat-value">{es.get('completion_score', 0)}</div><div class="stat-label">完成率 /20</div></div>
</div>
"""

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>RabAiMind 演示分析报告</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1f1f1f; }}
  h1 {{ color: #165DFF; text-align: center; }}
  h2 {{ border-bottom: 2px solid #165DFF; padding-bottom: 8px; color: #1f1f1f; }}
  table {{ width: 100%; border-collapse: collapse; margin: 16px 0; }}
  th {{ background: #165DFF; color: white; padding: 10px; text-align: center; }}
  td {{ padding: 8px 12px; text-align: center; border-bottom: 1px solid #e8e8e8; }}
  tr:nth-child(even) {{ background: #f5f7fa; }}
  .stats-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }}
  .stat-card {{ background: #f5f7fa; border-radius: 12px; padding: 20px; text-align: center; }}
  .stat-value {{ font-size: 32px; font-weight: 700; color: #165DFF; }}
  .stat-label {{ font-size: 13px; color: #8c8c8c; margin-top: 4px; }}
  .footer {{ text-align: center; color: #8c8c8c; font-size: 12px; margin-top: 40px; border-top: 1px solid #e8e8e8; padding-top: 20px; }}
  @media print {{ body {{ padding: 20px; }} }}
</style>
</head>
<body>
<h1>📊 RabAiMind 演示分析报告</h1>
<p style="text-align:center;color:#8c8c8c">任务ID: {analytics.get('task_id', 'N/A')} | 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">{analytics.get('total_views', 0)}</div><div class="stat-label">总浏览次数</div></div>
  <div class="stat-card"><div class="stat-value">{analytics.get('unique_viewers', 0)}</div><div class="stat-label">独立访客</div></div>
  <div class="stat-card"><div class="stat-value">{analytics.get('avg_scroll_depth_percent', 0)}%</div><div class="stat-label">平均滚动深度</div></div>
</div>

{eff_section}

<h2>⏱ 幻灯片浏览时长</h2>
<table>
  <thead><tr><th>页码</th><th>浏览次数</th><th>平均时长(秒)</th><th>最长时长(秒)</th><th>总时长(秒)</th></tr></thead>
  <tbody>{slide_rows}</tbody>
</table>

<h2>👁 访客列表</h2>
<table>
  <thead><tr><th>访客名称</th><th>会话次数</th><th>总浏览时长(秒)</th></tr></thead>
  <tbody>{viewer_rows}</tbody>
</table>

<h2>📜 滚动深度统计</h2>
<p>完整阅读（≥90%）人数: {analytics.get('scroll_depth_reached_end_count', 0)} / {analytics.get('scroll_depth_samples', 0)}</p>

<div class="footer">由 RabAiMind 演示分析系统生成 | https://rabaicloud.com</div>
</body>
</html>"""


    # ==================== CTA / Conversion Tracking ====================

    def track_cta_click(self, task_id: str, session_id: str, viewer_id: str,
                        cta_label: str, cta_url: str = "") -> dict:
        """
        Track a CTA (call-to-action) button click for conversion goals.
        """
        data = self._get_data(task_id)

        cta_click = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "viewer_id": viewer_id,
            "cta_label": cta_label,
            "cta_url": cta_url,
            "clicked_at": datetime.now().isoformat(),
        }

        with self._lock:
            if "cta_clicks" not in data:
                data["cta_clicks"] = []
            data["cta_clicks"].append(cta_click)
            data["updated_at"] = datetime.now().isoformat()
            self._save(task_id, data)

        return {"success": True, "cta_click_id": cta_click["id"]}

    def get_cta_stats(self, task_id: str) -> dict:
        """Get CTA click statistics for a presentation"""
        data = self._get_data(task_id)
        clicks = data.get("cta_clicks", [])

        # Group by CTA label
        by_label: Dict[str, int] = defaultdict(int)
        by_viewer: Dict[str, int] = defaultdict(int)
        recent_clicks = []

        for click in clicks:
            label = click.get("cta_label", "unknown")
            by_label[label] += 1
            by_viewer[click.get("viewer_id", "unknown")] += 1
            recent_clicks.append(click)

        # Sort recent by time
        recent_clicks.sort(key=lambda x: x.get("clicked_at", ""), reverse=True)

        return {
            "total_clicks": len(clicks),
            "unique_clickers": len(by_viewer),
            "by_cta_label": dict(by_label),
            "recent_clicks": recent_clicks[:20],
        }

    # ==================== Live / Real-time Stats ====================

    def get_live_stats(self, task_id: str) -> dict:
        """
        Get real-time stats for active viewers.
        Returns active viewers in the last N minutes.
        """
        data = self._get_data(task_id)
        sessions = data.get("sessions", [])

        now = datetime.now()
        active_window_seconds = 5 * 60  # 5-minute window

        active_sessions = []
        for session in sessions:
            if session.get("completed"):
                continue
            started = session.get("started_at")
            if not started:
                continue
            try:
                start_time = datetime.fromisoformat(started.replace("Z", "+00:00").replace("+00:00", ""))
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(started)
                # Make naive for comparison
                if start_time.tzinfo:
                    start_time = start_time.replace(tzinfo=None)
                elapsed = (now - start_time).total_seconds()
                if elapsed < active_window_seconds:
                    active_sessions.append({
                        "session_id": session.get("session_id"),
                        "viewer_name": session.get("viewer_name", "Anonymous"),
                        "current_slide": session.get("current_slide_index", 0),
                        "elapsed_seconds": round(elapsed),
                        "started_at": started,
                    })
            except Exception:
                pass

        # Engagement metrics
        total_sessions = len(sessions)
        completed_sessions = sum(1 for s in sessions if s.get("completed"))

        # Avg duration for completed sessions
        durations = [s.get("duration_seconds", 0) for s in sessions if s.get("completed") and s.get("duration_seconds", 0) > 0]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 0

        return {
            "active_viewers_now": len(active_sessions),
            "active_sessions": active_sessions,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "avg_duration_seconds": avg_duration,
            "completion_rate_pct": round(completed_sessions / total_sessions * 100, 1) if total_sessions > 0 else 0,
        }

    # ==================== Browser / Device Breakdown ====================

    def _parse_browser(self, user_agent: str) -> str:
        """Parse browser name from user agent string"""
        ua = user_agent.lower()
        if "edg/" in ua or "edge/" in ua:
            return "Edge"
        if "chrome/" in ua and "safari/" in ua and "chromium/" not in ua:
            return "Chrome"
        if "firefox/" in ua:
            return "Firefox"
        if "safari/" in ua and "chrome/" not in ua:
            return "Safari"
        if "opera/" in ua or "opr/" in ua:
            return "Opera"
        if "msie" in ua or "trident/" in ua:
            return "IE"
        return "Other"

    def _parse_device(self, user_agent: str) -> str:
        """Parse device type from user agent string"""
        ua = user_agent.lower()
        if "mobile" in ua or "android" in ua and "mobile" in ua:
            return "Mobile"
        if "tablet" in ua or "ipad" in ua:
            return "Tablet"
        return "Desktop"

    def get_browser_device_breakdown(self, task_id: str) -> dict:
        """Get browser and device breakdown from session user agents"""
        data = self._get_data(task_id)
        sessions = data.get("sessions", [])

        browsers: Dict[str, int] = defaultdict(int)
        devices: Dict[str, int] = defaultdict(int)
        by_viewer: Dict[str, dict] = {}

        for session in sessions:
            vid = session.get("viewer_id", "unknown")
            ua = session.get("user_agent", "")

            if vid not in by_viewer:
                by_viewer[vid] = {"browser": None, "device": None}

            # Only record once per viewer
            if by_viewer[vid]["browser"] is None and ua:
                browser = self._parse_browser(ua)
                device = self._parse_device(ua)
                browsers[browser] += 1
                devices[device] += 1
                by_viewer[vid]["browser"] = browser
                by_viewer[vid]["device"] = device

        return {
            "browsers": dict(browsers),
            "devices": dict(devices),
            "total_sessions": len(sessions),
        }

    # ==================== Geographic Distribution ====================

    def get_geo_distribution(self, task_id: str) -> dict:
        """Get geographic distribution from session data"""
        data = self._get_data(task_id)
        sessions = data.get("sessions", [])

        countries: Dict[str, int] = defaultdict(int)
        cities: Dict[str, int] = defaultdict(int)
        country_cities: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

        for session in sessions:
            country = session.get("country", "") or "Unknown"
            city = session.get("city", "") or "Unknown"

            countries[country] += 1
            if country != "Unknown" and city != "Unknown":
                cities[city] += 1
                country_cities[country][city] += 1

        # Sort
        sorted_countries = dict(sorted(countries.items(), key=lambda x: x[1], reverse=True))
        sorted_cities = dict(sorted(cities.items(), key=lambda x: x[1], reverse=True)[:20])

        return {
            "countries": sorted_countries,
            "cities": sorted_cities,
            "country_cities": dict(country_cities),
            "total_locations": len(countries),
        }

    # ==================== Slide Time Heatmap ====================

    def get_slide_time_heatmap(self, task_id: str, total_slides: int = 10) -> dict:
        """
        Get average time per slide as a heatmap-compatible structure.
        Returns array of {slide_index, avg_time, view_count, intensity}.
        """
        data = self._get_data(task_id)
        sessions = data.get("sessions", [])

        slide_times: Dict[int, List[float]] = defaultdict(list)
        for session in sessions:
            for sv in session.get("slide_views", []):
                if sv.get("duration_seconds", 0) > 0:
                    slide_times[sv["slide_index"]].append(sv["duration_seconds"])

        # Build stats for ALL slides (even unviewed)
        all_slides = []
        max_avg = 0
        for idx in range(total_slides):
            times = slide_times.get(idx, [])
            avg = round(sum(times) / len(times), 1) if times else 0
            if avg > max_avg:
                max_avg = avg
            all_slides.append({
                "slide_index": idx,
                "avg_time_seconds": avg,
                "view_count": len(times),
                "total_time_seconds": round(sum(times), 1) if times else 0,
            })

        # Normalize intensity (0-1)
        for slide in all_slides:
            slide["intensity"] = round(slide["avg_time_seconds"] / max_avg, 3) if max_avg > 0 else 0

        return {
            "slides": all_slides,
            "max_avg_time": max_avg,
            "total_slides": total_slides,
        }


_presentation_analytics_service: Optional['PresentationAnalyticsService'] = None


def get_presentation_analytics_service() -> PresentationAnalyticsService:
    global _presentation_analytics_service
    if _presentation_analytics_service is None:
        _presentation_analytics_service = PresentationAnalyticsService()
    return _presentation_analytics_service
