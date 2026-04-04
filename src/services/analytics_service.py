# -*- coding: utf-8 -*-
"""
Analytics Service

Computes usage statistics, template popularity, weekly activity heatmap,
productivity scores, and export data from task history.

Author: Claude
Date: 2026-04-04
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service - computes usage statistics from task history"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

    def compute_analytics(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compute full analytics from task history.
        
        Args:
            tasks: List of task dicts from TaskManager.get_history()
            
        Returns:
            Analytics dict with:
            - summary: overall stats
            - popular_templates: template usage ranking
            - weekly_activity: day-of-week + hour heatmap
            - productivity_score: 0-100 score
            - daily_stats: array of daily stats for chart
        """
        if not tasks:
            return self._empty_analytics()

        # Filter to completed tasks only for most metrics
        completed = [t for t in tasks if t.get("status") == "completed"]
        
        # Summary stats
        total_generations = len(completed)
        total_slides = sum(t.get("slide_count", 0) or 0 for t in completed)
        
        # Template usage
        template_counts: Dict[str, int] = defaultdict(int)
        style_counts: Dict[str, int] = defaultdict(int)
        scene_counts: Dict[str, int] = defaultdict(int)
        daily_generations: Dict[str, int] = defaultdict(int)
        weekly_activity: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))  # day -> hour -> count
        
        # Time tracking (estimate from created_at -> updated_at)
        total_time_seconds = 0
        generation_times: List[float] = []
        
        for task in completed:
            template = task.get("template", "default") or "default"
            style = task.get("style", "professional") or "professional"
            scene = task.get("scene", "business") or "business"
            
            template_counts[template] += 1
            style_counts[style] += 1
            scene_counts[scene] += 1
            
            # Parse timestamps
            created = self._parse_timestamp(task.get("created_at"))
            updated = self._parse_timestamp(task.get("updated_at"))
            
            if created and updated:
                delta = (updated - created).total_seconds()
                if 0 < delta < 7200:  # sanity: max 2 hours
                    total_time_seconds += delta
                    generation_times.append(delta)
            
            # Daily grouping (date key: YYYY-MM-DD)
            if created:
                day_key = created.strftime("%Y-%m-%d")
                daily_generations[day_key] += 1
                
                # Weekly activity: day of week (0=Mon, 6=Sun) + hour
                dow = created.strftime("%w")  # 0=Sunday
                hour = created.hour
                weekly_activity[dow][str(hour)] += 1
        
        # Average time per generation
        avg_time = total_time_seconds / len(completed) if completed else 0
        
        # Popular templates (top 10)
        popular_templates = sorted(
            [{"name": k, "count": v} for k, v in template_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        # Popular styles
        popular_styles = sorted(
            [{"name": k, "count": v} for k, v in style_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        # Popular scenes
        popular_scenes = sorted(
            [{"name": k, "count": v} for k, v in scene_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        # Weekly activity heatmap (7 days x 24 hours)
        days = ["0", "1", "2", "3", "4", "5", "6"]  # Sun to Sat
        day_labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        heatmap_data = []
        for i, day in enumerate(days):
            row = {"day": day_labels[i], "day_idx": day}
            for hour in range(24):
                row[str(hour)] = weekly_activity[day].get(str(hour), 0)
            heatmap_data.append(row)
        
        # Productivity score (0-100)
        productivity_score = self._compute_productivity_score(
            total_generations=total_generations,
            avg_time=avg_time,
            generation_times=generation_times,
            weekly_activity=weekly_activity
        )
        
        # Daily stats for line chart (last 30 days)
        daily_stats = self._compute_daily_stats(daily_generations)
        
        return {
            "summary": {
                "total_generations": total_generations,
                "total_slides": total_slides,
                "total_time_seconds": round(total_time_seconds, 1),
                "avg_time_seconds": round(avg_time, 1),
                "avg_slides_per_ppt": round(total_slides / total_generations, 1) if total_generations > 0 else 0,
                "unique_templates_used": len(template_counts),
                "unique_styles_used": len(style_counts),
            },
            "popular_templates": popular_templates,
            "popular_styles": popular_styles,
            "popular_scenes": popular_scenes,
            "weekly_activity": heatmap_data,
            "productivity_score": productivity_score,
            "daily_stats": daily_stats,
        }

    def _compute_productivity_score(
        self,
        total_generations: int,
        avg_time: float,
        generation_times: List[float],
        weekly_activity: Dict[str, Dict[str, int]]
    ) -> int:
        """
        Compute productivity score 0-100 based on:
        - Volume: more generations = higher score (up to a cap)
        - Speed: faster generations = higher score
        - Consistency: more active days = higher score
        """
        # Volume score (max 40 points)
        # Cap at 100 generations for full points
        volume_score = min(40, int(40 * min(total_generations / 100, 1)))
        
        # Speed score (max 30 points)
        # Ideal generation time is 60-180 seconds
        if avg_time > 0 and generation_times:
            median_time = sorted(generation_times)[len(generation_times) // 2]
            if median_time <= 60:
                speed_score = 30
            elif median_time <= 180:
                speed_score = 30 - int((median_time - 60) / 4)
            elif median_time <= 600:
                speed_score = 15 - int((median_time - 180) / 28)
            else:
                speed_score = 0
        else:
            speed_score = 15  # neutral if no data
        
        # Consistency score (max 30 points)
        # Count days with at least one generation
        active_days = len(set(
            day for day_map in weekly_activity.values()
            for _ in day_map.values() if _ > 0
        ))
        # Also factor in weekend vs weekday usage
        consistency_score = min(30, active_days * 3)
        
        total = volume_score + speed_score + consistency_score
        return min(100, max(0, total))

    def _compute_daily_stats(self, daily_generations: Dict[str, int]) -> List[Dict[str, Any]]:
        """Compute daily stats for the last 30 days."""
        result = []
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            day_key = day.strftime("%Y-%m-%d")
            count = daily_generations.get(day_key, 0)
            result.append({
                "date": day_key,
                "day_label": day.strftime("%m/%d"),
                "weekday": day.strftime("%w"),
                "weekday_label": ["日", "一", "二", "三", "四", "五", "六"][int(day.strftime("%w"))],
                "count": count
            })
        return result

    def _parse_timestamp(self, ts: Optional[str]) -> Optional[datetime]:
        """Parse various timestamp formats."""
        if not ts:
            return None
        try:
            # Try ISO format
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            pass
        try:
            # Try simpler format
            return datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None

    def _empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure."""
        empty_heatmap = []
        days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        for i, day in enumerate(days):
            row: Dict[str, Any] = {"day": day, "day_idx": str(i)}
            for h in range(24):
                row[str(h)] = 0
            empty_heatmap.append(row)
        
        return {
            "summary": {
                "total_generations": 0,
                "total_slides": 0,
                "total_time_seconds": 0,
                "avg_time_seconds": 0,
                "avg_slides_per_ppt": 0,
                "unique_templates_used": 0,
                "unique_styles_used": 0,
            },
            "popular_templates": [],
            "popular_styles": [],
            "popular_scenes": [],
            "weekly_activity": empty_heatmap,
            "productivity_score": 0,
            "daily_stats": [],
        }


# Singleton accessor
_analytics_service: Optional[AnalyticsService] = None


def get_analytics_service() -> AnalyticsService:
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service
