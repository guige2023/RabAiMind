"""
Shared HTTP Client with Connection Pooling

Provides a global httpx.AsyncClient with proper connection pool limits.
All HTTP requests in the application should use this shared client instead of
creating new clients per request.

Features:
- Connection pooling (reuses TCP connections)
- Configurable limits (max connections, max keepalive connections)
- Automatic cleanup on app shutdown
- Thread-safe for FastAPI's async context
- SSRF protection via is_safe_url()

Usage:
    from src.core.http_client import http_client, is_safe_url

    # In async context:
    response = await http_client.get("https://api.example.com/data")
    response = await http_client.post("https://api.example.com/submit", json=data)

Author: Claude
Date: 2026-04-04
"""

import ipaddress
import logging
from typing import Any
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

# Blocked hostnames / addresses
_BLOCKED_HOSTNAMES = frozenset({
    "localhost", "127.0.0.1", "::1", "0.0.0.0",
    "localhost.localdomain", "ip6-localhost", "ip6-loopback",
})

# Reserved/private network prefixes
_PRIVATE_NETWORKS = (
    ipaddress.ip_network("10.0.0.0/8", strict=False),
    ipaddress.ip_network("172.16.0.0/12", strict=False),
    ipaddress.ip_network("192.168.0.0/16", strict=False),
    ipaddress.ip_network("169.254.0.0/16", strict=False),   # link-local
    ipaddress.ip_network("224.0.0.0/4", strict=False),      # multicast
    ipaddress.ip_network("240.0.0.0/4", strict=False),      # reserved
    ipaddress.ip_network("127.0.0.0/8", strict=False),      # loopback
    ipaddress.ip_network("0.0.0.0/8", strict=False),       # current network
    ipaddress.ip_network("fc00::/7", strict=False),          # unique local
    ipaddress.ip_network("fe80::/10", strict=False),         # link-local
)


def is_safe_url(url: str) -> bool:
    """
    Check if a URL is safe against SSRF attacks.

    Blocks:
    - Localhost / 127.0.0.1 / ::1
    - Private/reserved IP ranges (10.x, 172.16-31.x, 192.168.x, link-local, etc.)
    - URLs without a clear host (e.g. file://, data://)

    Args:
        url: The URL to validate

    Returns:
        True if the URL is safe to fetch, False otherwise
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname or ""
    if not hostname:
        return False

    # Block literal blocked hostnames
    if hostname.lower() in _BLOCKED_HOSTNAMES:
        return False

    # Block hosts that resolve to private IPs
    try:
        addr = ipaddress.ip_address(hostname)
        for net in _PRIVATE_NETWORKS:
            if addr in net:
                return False
    except ValueError:
        # Not an IP literal — resolve hostname
        try:
            import socket
            infos = socket.getaddrinfo(hostname, None)
            for info in infos:
                sockaddr = info[4]
                if sockaddr:
                    try:
                        resolved = ipaddress.ip_address(sockaddr[0])
                        for net in _PRIVATE_NETWORKS:
                            if resolved in net:
                                logger.warning(f"SSRF blocked: {hostname} resolves to private IP {sockaddr[0]}")
                                return False
                    except ValueError:
                        continue
        except Exception:
            # DNS resolution failed — treat as potentially unsafe
            logger.warning(f"SSRF check: could not resolve hostname '{hostname}', blocking as precaution")
            return False

    return True

# Connection pool limits
# These are conservative defaults that work well for most use cases
DEFAULT_LIMITS = httpx.Limits(
    max_keepalive_connections=20,   # Max idle connections to keep alive
    max_connections=100,            # Max total connections
    keepalive_expiry=30.0           # Keepalive timeout in seconds
)

# Default timeout configuration
DEFAULT_TIMEOUT = httpx.Timeout(
    connect=10.0,     # Connection timeout
    read=30.0,        # Read timeout
    write=10.0,       # Write timeout
    pool=30.0         # Pool/connection acquisition timeout
)

# Long timeout for large operations (file downloads, etc.)
LONG_TIMEOUT = httpx.Timeout(
    connect=15.0,
    read=120.0,
    write=60.0,
    pool=60.0
)


class HttpClient:
    """
    Shared HTTP client with connection pooling.

    Usage:
        from src.core.http_client import http_client

        # GET request
        response = await http_client.get(url)

        # POST request with JSON
        response = await http_client.post(url, json=data)

        # With custom timeout
        response = await http_client.get(url, timeout=httpx.Timeout(60.0))

        # Streaming response
        async with http_client.stream("GET", url) as response:
            async for chunk in response.aiter_bytes():
                ...
    """

    def __init__(
        self,
        limits: httpx.Limits | None = None,
        default_timeout: httpx.Timeout | None = None,
    ):
        self._limits = limits or DEFAULT_LIMITS
        self._default_timeout = default_timeout or DEFAULT_TIMEOUT
        self._client: httpx.AsyncClient | None = None
        self._started = False

    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create the underlying AsyncClient."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                limits=self._limits,
                timeout=self._default_timeout,
                follow_redirects=True,
                # Don't verify=False - always use proper SSL verification
            )
            logger.debug(
                f"Created httpx.AsyncClient with limits: "
                f"max_connections={self._limits.max_connections}, "
                f"max_keepalive_connections={self._limits.max_keepalive_connections}"
            )
        return self._client

    @property
    def is_started(self) -> bool:
        return self._started

    async def start(self):
        """Start the client (pre-warm connections). Call this on app startup."""
        if not self._started:
            # Access client property to create it
            _ = self.client
            self._started = True
            logger.info(
                f"HTTP connection pool started: "
                f"max_connections={self._limits.max_connections}, "
                f"max_keepalive={self._limits.max_keepalive_connections}"
            )

    async def close(self):
        """Close the client and release all connections. Call this on app shutdown."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            self._started = False
            logger.info("HTTP connection pool closed")

    async def get(self, url: str, **kwargs) -> httpx.Response:
        """Send a GET request."""
        return await self.client.get(url, **kwargs)

    async def post(self, url: str, **kwargs) -> httpx.Response:
        """Send a POST request."""
        return await self.client.post(url, **kwargs)

    async def put(self, url: str, **kwargs) -> httpx.Response:
        """Send a PUT request."""
        return await self.client.put(url, **kwargs)

    async def patch(self, url: str, **kwargs) -> httpx.Response:
        """Send a PATCH request."""
        return await self.client.patch(url, **kwargs)

    async def delete(self, url: str, **kwargs) -> httpx.Response:
        """Send a DELETE request."""
        return await self.client.delete(url, **kwargs)

    async def head(self, url: str, **kwargs) -> httpx.Response:
        """Send a HEAD request."""
        return await self.client.head(url, **kwargs)

    async def options(self, url: str, **kwargs) -> httpx.Response:
        """Send an OPTIONS request."""
        return await self.client.options(url, **kwargs)

    def stream(self, method: str, url: str, **kwargs):
        """
        Create a streaming context manager for large responses.

        Usage:
            async with http_client.stream("GET", url) as response:
                async for chunk in response.aiter_bytes():
                    ...
        """
        return self.client.stream(method, url, **kwargs)

    def get_stats(self) -> dict[str, Any]:
        """Get connection pool statistics."""
        if self._client is None:
            return {"status": "not_started"}

        # httpx doesn't expose detailed stats directly, but we can track state
        return {
            "status": "active",
            "max_connections": self._limits.max_connections,
            "max_keepalive_connections": self._limits.max_keepalive_connections,
            "keepalive_expiry": self._limits.keepalive_expiry,
            "started": self._started,
        }


# Global singleton instance
http_client = HttpClient()


# ==================== Utility Functions ====================

async def get_image_from_url(url: str, timeout: float | None = None) -> bytes:
    """
    Download image data from URL using the shared connection pool.

    Args:
        url: Image URL
        timeout: Optional timeout override in seconds

    Returns:
        Image bytes

    Raises:
        ValueError: If the URL fails SSRF validation
    """
    if not is_safe_url(url):
        raise ValueError(f"URL failed SSRF validation: {url}")

    kwargs: dict[str, Any] = {}
    if timeout:
        kwargs["timeout"] = httpx.Timeout(timeout)

    response = await http_client.get(url, **kwargs)
    response.raise_for_status()
    return response.content


async def fetch_json(url: str, timeout: float | None = None) -> dict[str, Any]:
    """
    Fetch JSON data from URL using the shared connection pool.

    Args:
        url: API URL
        timeout: Optional timeout override in seconds

    Returns:
        Parsed JSON response

    Raises:
        ValueError: If the URL fails SSRF validation
    """
    if not is_safe_url(url):
        raise ValueError(f"URL failed SSRF validation: {url}")

    kwargs: dict[str, Any] = {"headers": {"Accept": "application/json"}}
    if timeout:
        kwargs["timeout"] = httpx.Timeout(timeout)

    response = await http_client.get(url, **kwargs)
    response.raise_for_status()
    return response.json()
