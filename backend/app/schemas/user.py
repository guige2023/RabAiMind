"""用户相关Pydantic模型"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    """用户注册请求"""
    email: EmailStr = Field(..., description="邮箱")
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class UserLogin(BaseModel):
    """用户登录请求"""
    email: Optional[EmailStr] = Field(None, description="邮箱")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="用户名")
    password: str = Field(..., description="密码")

    class Config:
        json_schema_extra = {
            "examples": [
                {"email": "user@example.com", "password": "password123"},
                {"username": "john_doe", "password": "password123"}
            ]
        }


class UserResponse(BaseModel):
    """用户信息响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="用户ID")
    email: str = Field(..., description="邮箱")
    username: str = Field(..., description="用户名")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")


class Token(BaseModel):
    """Token响应"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")


class TokenData(BaseModel):
    """Token数据"""
    user_id: Optional[int] = Field(None, description="用户ID")
