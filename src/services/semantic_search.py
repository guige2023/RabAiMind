"""
语义搜索服务
基于 AI embeddings 的语义搜索能力
"""
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from ..config import settings

EMBEDDINGS_DIR = Path("data/embeddings")
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

SEMANTIC_INDEX_FILE = EMBEDDINGS_DIR / "semantic_index.json"
TEMPLATE_EMBEDDINGS_FILE = EMBEDDINGS_DIR / "template_embeddings.json"
PPT_EMBEDDINGS_FILE = EMBEDDINGS_DIR / "ppt_embeddings.json"


def _load_json(path: Path) -> dict:
    if path.exists():
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            pass
    return {}


def _save_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


async def get_embedding(text: str, client=None) -> list[float] | None:
    """使用 Volcano ARK API 获取文本 embedding"""
    try:
        import httpx

        # 构建请求
        model = "Embedding-3"
        url = f"{settings.VOLCANO_ENDPOINT}embeddings"
        headers = {
            "Authorization": f"Bearer {settings.VOLCANO_API_KEY}",
            "Content-Type": "application/json"
        }
        body = {
            "model": model,
            "input": text[:2000]  # 限制输入长度
        }

        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.post(url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()

            # 提取 embedding 向量
            embedding = data.get("data", [{}])[0].get("embedding", [])
            return embedding

    except Exception as e:
        print(f"[SemanticSearch] get_embedding failed: {e}")
        return None


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """计算余弦相似度"""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def batch_cosine_similarity(query_emb: list[float], candidates: list[list[float]]) -> list[float]:
    """批量计算余弦相似度"""
    return [cosine_similarity(query_emb, c) for c in candidates]


class SemanticSearch:
    """语义搜索服务"""

    def __init__(self):
        self.template_embeddings = _load_json(TEMPLATE_EMBEDDINGS_FILE)
        self.ppt_embeddings = _load_json(PPT_EMBEDDINGS_FILE)
        self.semantic_index = _load_json(SEMANTIC_INDEX_FILE)

    def _persist(self):
        _save_json(TEMPLATE_EMBEDDINGS_FILE, self.template_embeddings)
        _save_json(PPT_EMBEDDINGS_FILE, self.ppt_embeddings)
        _save_json(SEMANTIC_INDEX_FILE, self.semantic_index)

    def index_template(self, template_id: str, name: str, description: str,
                       category: str = "", style: str = "", tags: list[str] = None):
        """将模板加入语义索引"""
        tags = tags or []
        text = f"{name} {description} {category} {style} {' '.join(tags)}"
        content_hash = hashlib.md5(text.encode()).hexdigest()

        self.semantic_index.setdefault("templates", {})
        self.semantic_index["templates"][template_id] = {
            "name": name,
            "description": description,
            "category": category,
            "style": style,
            "tags": tags,
            "content_hash": content_hash,
            "indexed_at": datetime.now().isoformat()
        }
        self._persist()

    def index_ppt(self, task_id: str, title: str, slides: list[dict[str, Any]]):
        """将 PPT 加入语义索引"""
        self.semantic_index.setdefault("ppt", {})

        slide_texts = []
        for i, slide in enumerate(slides):
            slide_text = f"第{i+1}页 {slide.get('title', '')} {slide.get('content', '')}"
            slide_texts.append(slide_text)

        combined = " ".join(slide_texts)
        content_hash = hashlib.md5(combined.encode()).hexdigest()

        self.semantic_index["ppt"][task_id] = {
            "title": title,
            "slide_count": len(slides),
            "content_hash": content_hash,
            "indexed_at": datetime.now().isoformat()
        }
        self._persist()

    async def semantic_search_templates(
        self,
        query: str,
        limit: int = 10,
        category: str | None = None,
        style: str | None = None,
        top_k: int = 50
    ) -> list[dict[str, Any]]:
        """
        语义搜索模板

        Returns:
            List of dicts with template_id, name, similarity_score, etc.
        """
        if not query or not query.strip():
            return []

        # 1. 获取查询的 embedding
        query_emb = await get_embedding(query)
        if not query_emb:
            # Fallback to keyword matching if embedding fails
            return self._keyword_fallback_templates(query, limit, category, style)

        # 2. 获取候选模板的 embeddings
        candidates: list[tuple] = []  # (template_id, embedding, metadata)
        templates_meta = self.semantic_index.get("templates", {})

        # 如果还没有预计算的 embeddings，动态生成
        from ..services.template_manager import get_template_manager
        manager = get_template_manager()

        for template_id, meta in templates_meta.items():
            if template_id in self.template_embeddings:
                emb = self.template_embeddings[template_id]
                candidates.append((template_id, emb, meta))

        # 如果没有预计算 embedding，动态生成
        if not candidates:
            all_templates = manager.list_templates()
            for t in all_templates:
                candidates.append((
                    t.id,
                    None,  # will compute if needed
                    {"name": t.name, "description": t.description, "category": t.category, "style": t.style}
                ))

        # 3. 动态获取缺失的 embeddings
        uncached = [(tid, meta) for tid, emb, meta in candidates if emb is None]
        for tid, meta in uncached:
            text = f"{meta.get('name', '')} {meta.get('description', '')} {meta.get('category', '')} {meta.get('style', '')}"
            emb = await get_embedding(text)
            if emb:
                self.template_embeddings[tid] = emb

        # 保存新计算的 embeddings
        if uncached:
            self._persist()

        # 4. 计算相似度
        results = []
        for template_id, emb, meta in candidates:
            if emb is None:
                continue

            # Apply filters
            if category and meta.get("category") != category:
                continue
            if style and meta.get("style") != style:
                continue

            score = cosine_similarity(query_emb, emb)
            results.append({
                "template_id": template_id,
                "name": meta.get("name", ""),
                "description": meta.get("description", ""),
                "category": meta.get("category", ""),
                "style": meta.get("style", ""),
                "similarity_score": round(score, 4)
            })

        # 5. 排序并返回 top_k
        results.sort(key=lambda x: -x["similarity_score"])
        return results[:limit]

    async def semantic_search_ppt(
        self,
        query: str,
        limit: int = 20
    ) -> list[dict[str, Any]]:
        """
        语义搜索 PPT 内容
        支持自然语言理解，如"查找包含图表的幻灯片"
        """
        if not query or not query.strip():
            return []

        query_emb = await get_embedding(query)
        if not query_emb:
            return []

        results = []
        ppt_meta = self.semantic_index.get("ppt", {})

        for task_id, meta in ppt_meta.items():
            if task_id not in self.ppt_embeddings:
                continue

            emb = self.ppt_embeddings[task_id]
            score = cosine_similarity(query_emb, emb)

            if score > 0.3:  # threshold
                results.append({
                    "task_id": task_id,
                    "title": meta.get("title", ""),
                    "slide_count": meta.get("slide_count", 0),
                    "similarity_score": round(score, 4)
                })

        results.sort(key=lambda x: -x["similarity_score"])
        return results[:limit]

    def _keyword_fallback_templates(
        self,
        query: str,
        limit: int = 10,
        category: str | None = None,
        style: str | None = None
    ) -> list[dict[str, Any]]:
        """关键词回退搜索"""
        from ..services.template_manager import get_template_manager
        manager = get_template_manager()
        templates = manager.search_templates(query=query, category=category, style=style, limit=limit)

        results = []
        for t in templates:
            # Simple relevance scoring
            score = 0
            q = query.lower()
            if q in t.name.lower():
                score += 2
            if q in t.description.lower():
                score += 1
            results.append({
                "template_id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "similarity_score": score
            })

        results.sort(key=lambda x: -x["similarity_score"])
        return results[:limit]


# 全局实例
_semantic_search: SemanticSearch | None = None


def get_semantic_search() -> SemanticSearch:
    global _semantic_search
    if _semantic_search is None:
        _semantic_search = SemanticSearch()
    return _semantic_search
