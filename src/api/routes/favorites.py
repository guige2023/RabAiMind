"""
收藏API路由
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from ...services.favorites_manager import get_favorites_manager

router = APIRouter(prefix="/api/v1/favorites", tags=["favorites"])


class FavoriteItemResponse(BaseModel):
    """收藏项响应"""
    id: str
    type: str
    name: str
    description: str
    thumbnail: str | None
    added_at: str | None


class FavoriteRequest(BaseModel):
    """添加收藏请求"""
    item_id: str
    item_type: str  # "template" or "task"
    name: str
    description: str = ""
    thumbnail: str | None = None


class FavoriteListResponse(BaseModel):
    """收藏列表响应"""
    success: bool
    items: list[FavoriteItemResponse]
    total: int


@router.post("/add", response_model=BaseModel)
async def add_favorite(
    user_id: str,
    request: FavoriteRequest
):
    """
    添加收藏

    Args:
        user_id: 用户ID（简化处理，实际应从认证获取）
        request: 收藏请求
    """
    if request.item_type not in ("template", "task"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="item_type必须是template或task"
        )

    manager = get_favorites_manager()
    success = manager.add_favorite(
        user_id=user_id,
        item_id=request.item_id,
        item_type=request.item_type,
        name=request.name,
        description=request.description,
        thumbnail=request.thumbnail
    )

    return {"success": success, "message": "已收藏" if success else "已在收藏夹中"}


@router.delete("/remove", response_model=BaseModel)
async def remove_favorite(
    user_id: str,
    item_id: str,
    item_type: str
):
    """
    移除收藏

    Args:
        user_id: 用户ID
        item_id: 收藏项ID
        item_type: 类型
    """
    if item_type not in ("template", "task"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="item_type必须是template或task"
        )

    manager = get_favorites_manager()
    success = manager.remove_favorite(
        user_id=user_id,
        item_id=item_id,
        item_type=item_type
    )

    return {"success": success, "message": "已取消收藏" if success else "未找到收藏项"}


@router.get("/check", response_model=BaseModel)
async def check_favorite(
    user_id: str,
    item_id: str,
    item_type: str
):
    """检查是否已收藏"""
    manager = get_favorites_manager()
    is_fav = manager.is_favorite(
        user_id=user_id,
        item_id=item_id,
        item_type=item_type
    )

    return {"is_favorite": is_fav}


@router.get("/list/{user_id}", response_model=FavoriteListResponse)
async def list_favorites(
    user_id: str,
    item_type: str | None = None
):
    """
    获取用户收藏列表

    Args:
        user_id: 用户ID
        item_type: 可选，筛选类型
    """
    manager = get_favorites_manager()
    items = manager.get_favorites(user_id=user_id, item_type=item_type)

    return FavoriteListResponse(
        success=True,
        items=[
            FavoriteItemResponse(
                id=item.id,
                type=item.type,
                name=item.name,
                description=item.description,
                thumbnail=item.thumbnail,
                added_at=item.added_at.isoformat() if item.added_at else None
            )
            for item in items
        ],
        total=len(items)
    )


@router.get("/ids/{user_id}", response_model=BaseModel)
async def get_favorite_ids(
    user_id: str,
    item_type: str
):
    """获取用户收藏的ID列表（用于前端选中状态）"""
    if item_type not in ("template", "task"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="item_type必须是template或task"
        )

    manager = get_favorites_manager()
    ids = manager.get_favorite_ids(user_id=user_id, item_type=item_type)

    return {"ids": ids}
