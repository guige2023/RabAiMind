"""全局异常处理模块"""
from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ErrorResponse(BaseException):
    """错误响应模型"""
    def __init__(
        self,
        code: str,
        message: str,
        details: Optional[Any] = None,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        self.code = code
        self.message = message
        self.details = details
        self.status_code = status_code


class BusinessError(Exception):
    """业务异常"""
    def __init__(self, message: str, code: str = "BUSINESS_ERROR", status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class ResourceNotFoundError(BusinessError):
    """资源不存在异常"""
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} not found: {resource_id}",
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedError(BusinessError):
    """未授权异常"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenError(BusinessError):
    """禁止访问异常"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )


async def business_error_handler(request: Request, exc: BusinessError) -> JSONResponse:
    """业务异常处理器"""
    logger.warning(f"Business error: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "details": exc.details
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """请求验证异常处理器"""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": exc.errors()
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """HTTP异常处理器"""
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "details": None
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """通用异常处理器"""
    logger.error(f"Unhandled exception: {type(exc).__name__} - {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred",
            "details": str(exc) if settings.debug else None
        }
    )


from app.core.config import settings


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""
    
    async def dispatch(self, request: Request, call_next):
        # 记录请求
        logger.info(f"Request: {request.method} {request.url.path}")
        
        # 记录响应
        response = await call_next(request)
        
        logger.info(f"Response: {request.method} {request.url.path} - {response.status_code}")
        
        return response


def setup_exception_handlers(app):
    """配置全局异常处理器"""
    from fastapi import FastAPI
    
    # 注册业务异常处理器
    app.add_exception_handler(BusinessError, business_error_handler)
    
    # 注册验证异常处理器
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # 注册HTTP异常处理器
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    
    # 注册通用异常处理器
    app.add_exception_handler(Exception, general_exception_handler)
