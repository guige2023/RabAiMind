"""
自定义异常模块

定义项目中所有自定义异常类型，便于错误处理和调试
"""
from typing import Optional, Dict, Any


class RabAiMindError(Exception):
    base_error: bool = True
    error_code: str = "UNKNOWN_ERROR"
    http_status: int = 500
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code or self.error_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details
            }
        }


class ConfigurationError(RabAiMindError):
    error_code = "CONFIG_ERROR"
    http_status = 500


class APIKeyNotConfiguredError(ConfigurationError):
    error_code = "API_KEY_NOT_CONFIGURED"


class InvalidConfigError(ConfigurationError):
    error_code = "INVALID_CONFIG"


class APIError(RabAiMindError):
    error_code = "API_ERROR"
    http_status = 502


class APIConnectionError(APIError):
    error_code = "API_CONNECTION_ERROR"
    http_status = 503


class APITimeoutError(APIError):
    error_code = "API_TIMEOUT"
    http_status = 504


class APIRateLimitError(APIError):
    error_code = "API_RATE_LIMIT"
    http_status = 429


class APIResponseError(APIError):
    error_code = "API_RESPONSE_ERROR"


class ContentGenerationError(RabAiMindError):
    error_code = "CONTENT_GENERATION_ERROR"
    http_status = 500


class TextGenerationError(ContentGenerationError):
    error_code = "TEXT_GENERATION_ERROR"


class ImageGenerationError(ContentGenerationError):
    error_code = "IMAGE_GENERATION_ERROR"


class SVGGenerationError(ContentGenerationError):
    error_code = "SVG_GENERATION_ERROR"


class PPTGenerationError(RabAiMindError):
    error_code = "PPT_GENERATION_ERROR"
    http_status = 500


class PPTXConversionError(PPTGenerationError):
    error_code = "PPTX_CONVERSION_ERROR"


class PPTXOptimizationError(PPTGenerationError):
    error_code = "PPTX_OPTIMIZATION_ERROR"


class ValidationError(RabAiMindError):
    error_code = "VALIDATION_ERROR"
    http_status = 400


class InvalidInputError(ValidationError):
    error_code = "INVALID_INPUT"


class InvalidParameterError(ValidationError):
    error_code = "INVALID_PARAMETER"


class ContentTooLongError(ValidationError):
    error_code = "CONTENT_TOO_LONG"


class TaskError(RabAiMindError):
    error_code = "TASK_ERROR"
    http_status = 500


class TaskNotFoundError(TaskError):
    error_code = "TASK_NOT_FOUND"
    http_status = 404


class TaskCancelledError(TaskError):
    error_code = "TASK_CANCELLED"


class TaskTimeoutError(TaskError):
    error_code = "TASK_TIMEOUT"


class FileError(RabAiMindError):
    error_code = "FILE_ERROR"
    http_status = 500


class FileNotFoundError(FileError):
    error_code = "FILE_NOT_FOUND"
    http_status = 404


class FileTooLargeError(FileError):
    error_code = "FILE_TOO_LARGE"
    http_status = 413


class UnsupportedFormatError(FileError):
    error_code = "UNSUPPORTED_FORMAT"
    http_status = 415


class SecurityError(RabAiMindError):
    error_code = "SECURITY_ERROR"
    http_status = 403


class PathTraversalError(SecurityError):
    error_code = "PATH_TRAVERSAL"


class XSSDetectedError(SecurityError):
    error_code = "XSS_DETECTED"


class SSRFDetectedError(SecurityError):
    error_code = "SSRF_DETECTED"


def sanitize_error(e: Exception) -> str:
    """
    将异常转换为用户友好的错误消息
    避免泄露内部实现细节
    """
    if isinstance(e, RabAiMindError):
        return e.message
    
    error_mapping = {
        "ConnectionError": "网络连接失败，请检查网络后重试",
        "Timeout": "请求超时，请稍后重试",
        "HTTPError": "服务暂时不可用，请稍后重试",
        "JSONDecodeError": "数据解析失败，请稍后重试",
    }
    
    error_type = type(e).__name__
    return error_mapping.get(error_type, "服务暂时不可用，请稍后重试")


def get_http_status(e: Exception) -> int:
    """获取异常对应的 HTTP 状态码"""
    if isinstance(e, RabAiMindError):
        return e.http_status
    return 500
