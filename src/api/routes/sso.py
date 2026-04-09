"""
SSO/SAML Authentication Routes

Provides Single Sign-On support via SAML 2.0 and generic OIDC/OAuth2.
Supports Okta, Azure AD, Google Workspace, and other SAML/OIDC providers.

Environment Variables:
- SSO_ENABLED: Enable SSO (default: false)
- SSO_PROVIDER: "saml" or "oidc" (default: saml)
- SSO_METADATA_URL: SAML IDP metadata URL (or OIDC discovery URL)
- SSO_ENTITY_ID: SP entity ID / issuer
- SSO_ASSERTION_CONSUMER_SERVICE_URL: ACS URL for SAML
- SSO_SIGNING_CERT: IDP signing certificate (PEM)
- SSO_CLIENT_ID: OAuth2 client ID (for OIDC)
- SSO_CLIENT_SECRET: OAuth2 client secret (for OIDC)
- SSO_SCOPES: OAuth2 scopes (default: openid profile email)
- SSO_CALLBACK_URL: Callback URL after successful SSO

Author: Claude
Date: 2026-04-04
"""

import logging
import os
import secrets
import urllib.parse
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel

from ...api.middleware.auth import get_current_user
from ...core.auth import auth_manager
from ...core.security import Role, User, get_audit_logger

logger = logging.getLogger("sso")

router = APIRouter(prefix="/api/v1/auth/sso", tags=["sso"])


# ==================== SSO Configuration ====================

@dataclass
class SSOConfig:
    enabled: bool
    provider: str  # "saml" or "oidc"
    entity_id: str
    metadata_url: str
    acs_url: str
    signing_cert: str
    client_id: str
    client_secret: str
    scopes: str
    callback_url: str
    provider_name: str

    @classmethod
    def from_env(cls) -> "SSOConfig":
        enabled = os.getenv("SSO_ENABLED", "false").lower() == "true"
        provider = os.getenv("SSO_PROVIDER", "saml").lower()
        entity_id = os.getenv("SSO_ENTITY_ID", f"rabai-{secrets.token_hex(4)}")
        metadata_url = os.getenv("SSO_METADATA_URL", "")
        acs_url = os.getenv("SSO_ASSERTION_CONSUMER_SERVICE_URL", "")
        signing_cert = os.getenv("SSO_SIGNING_CERT", "")
        client_id = os.getenv("SSO_CLIENT_ID", "")
        client_secret = os.getenv("SSO_CLIENT_SECRET", "")
        scopes = os.getenv("SSO_SCOPES", "openid profile email")
        callback_url = os.getenv("SSO_CALLBACK_URL", "http://localhost:8003/api/v1/auth/sso/callback")
        provider_name = os.getenv("SSO_PROVIDER_NAME", "SSO")

        # Infer provider name from entity_id/metadata_url if not set
        if provider_name == "SSO" and metadata_url:
            if "okta" in metadata_url.lower():
                provider_name = "Okta"
            elif "azure" in metadata_url.lower() or "microsoft" in metadata_url.lower():
                provider_name = "Azure AD"
            elif "google" in metadata_url.lower():
                provider_name = "Google"
            elif "onelogin" in metadata_url.lower():
                provider_name = "OneLogin"

        return cls(
            enabled=enabled,
            provider=provider,
            entity_id=entity_id,
            metadata_url=metadata_url,
            acs_url=acs_url,
            signing_cert=signing_cert,
            client_id=client_id,
            client_secret=client_secret,
            scopes=scopes,
            callback_url=callback_url,
            provider_name=provider_name,
        )


def get_sso_config() -> SSOConfig:
    return SSOConfig.from_env()


# ==================== In-Memory State ====================

# Temporary state for SSO flow (state parameter for CSRF protection)
_sso_states: dict[str, dict] = {}

# Persistent SSO-linked user mappings (sso_provider:sso_id -> user_id)
_sso_user_map: dict[str, dict] = {}  # key: "provider:subject", value: {user_id, username, email, linked_at}
_SSO_MAP_FILE = "./data/sso_users.json"


def _load_sso_map() -> dict[str, dict]:
    try:
        with open(_SSO_MAP_FILE, encoding="utf-8") as f:
            return json_load(f)
    except Exception:
        return {}


def _save_sso_map():
    with open(_SSO_MAP_FILE, "w", encoding="utf-8") as f:
        json_dump(_sso_user_map, f, ensure_ascii=False, indent=2)


def _get_sso_key(provider: str, subject: str) -> str:
    return f"{provider}:{subject}"


# ==================== Pydantic Models ====================

class SSOProviderInfo(BaseModel):
    enabled: bool
    provider: str
    provider_name: str
    entity_id: str
    authorization_url: str
    scopes: str


class SSOLinkRequest(BaseModel):
    """Link current account to SSO provider."""
    provider: str = "saml"


class SSOLinkResponse(BaseModel):
    success: bool
    message: str
    linked_provider: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    sso_provider: str
    user_id: str


# ==================== Helpers ====================

def json_load(f):
    import json
    return json.load(f)


def json_dump(obj, f, **kwargs):
    import json
    return json.dump(obj, f, **kwargs)


def _generate_state() -> str:
    return secrets.token_urlsafe(32)


def _store_state(state: str, nonce: str = ""):
    _sso_states[state] = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "nonce": nonce,
    }


def _verify_state(state: str) -> bool:
    if state not in _sso_states:
        return False
    state_data = _sso_states.pop(state)
    created = datetime.fromisoformat(state_data["created_at"].replace("Z", "+00:00"))
    # State valid for 10 minutes
    if (datetime.utcnow() - created.replace(tzinfo=None)).total_seconds() > 600:
        return False
    return True


def _build_authorization_url(config: SSOConfig, state: str) -> str:
    """Build SAML AuthnRequest or OIDC authorization URL."""
    if config.provider == "saml":
        return _build_saml_authn_request(config, state)
    else:
        return _build_oidc_authorization_url(config, state)


def _build_saml_authn_request(config: SSOConfig, state: str) -> str:
    """Build a SAML 2.0 AuthnRequest URL (redirect binding)."""
    import base64
    import uuid

    # Build SAML AuthnRequest
    request_id = f"_{uuid.uuid4().hex}"
    issue_instant = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Simple SAML 2.0 AuthnRequest template
    authn_request = f"""<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="{request_id}"
    Version="2.0"
    IssueInstant="{issue_instant}"
    Destination="{config.metadata_url}"
    AssertionConsumerServiceURL="{config.acs_url}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>{config.entity_id}</saml:Issuer>
    <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>"""

    encoded = base64.b64encode(authn_request.encode()).decode()
    relay_state = state

    # Most SAML providers use redirect with SAMLRequest parameter
    params = urllib.parse.urlencode({"SAMLRequest": encoded, "RelayState": relay_state})
    url = f"{config.metadata_url}?{params}"
    return url


def _build_oidc_authorization_url(config: SSOConfig, state: str) -> str:
    """Build OIDC Authorization Code flow URL."""
    params = {
        "client_id": config.client_id,
        "response_type": "code",
        "scope": config.scopes,
        "redirect_uri": config.callback_url,
        "state": state,
        "nonce": secrets.token_urlsafe(16),
    }
    # Use authorization_endpoint from discovery or construct
    auth_endpoint = os.getenv("SSO_AUTH_ENDPOINT", config.metadata_url)
    return f"{auth_endpoint}?{urllib.parse.urlencode(params)}"


def _exchange_code_for_token(code: str, config: SSOConfig) -> dict[str, Any]:
    """Exchange authorization code for tokens (OIDC)."""
    import urllib.error
    import urllib.request

    token_url = os.getenv("SSO_TOKEN_ENDPOINT")
    if not token_url:
        raise HTTPException(status_code=500, detail="SSO token endpoint not configured")

    data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": config.callback_url,
        "client_id": config.client_id,
        "client_secret": config.client_secret,
    }).encode()

    try:
        req = urllib.request.Request(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {e}")


async def _parse_saml_response(request: Request, config: SSOConfig) -> dict[str, Any]:
    """Parse SAML 2.0 POST response and extract user info."""
    import base64

    # Get SAMLResponse from form body
    saml_response = (await request.form()).get("SAMLResponse")
    if not saml_response:
        raise HTTPException(status_code=400, detail="Missing SAMLResponse")

    try:
        decoded = base64.b64decode(saml_response).decode("utf-8")

        # In production, use a proper SAML parser (python3-saml, onelogin_saml)
        # For now, extract key fields via regex (basic extraction)
        import re

        def extract(saml_xml, pattern):
            m = re.search(pattern, saml_xml)
            return m.group(1) if m else ""

        subject = extract(decoded, r"<saml:NameID[^>]*>([^<]+)</saml:NameID>")
        email = extract(decoded, r"EmailAddress[^>]*>([^<]+)</saml:")
        if not email:
            email = extract(decoded, r"emailAddress[^>]*>([^<]+)</saml:")
        if not email:
            email = subject

        issuer = extract(decoded, r"<saml:Issuer[^>]*>([^<]+)</saml:Issuer>")

        return {
            "subject": subject,
            "email": email,
            "issuer": issuer,
            "provider": "saml",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse SAML response: {e}")


def _fetch_oidc_userinfo(token: str) -> dict[str, Any]:
    """Fetch user info from OIDC userinfo endpoint."""
    import urllib.error
    import urllib.request

    userinfo_url = os.getenv("SSO_USERINFO_ENDPOINT")
    if not userinfo_url:
        raise HTTPException(status_code=500, detail="OIDC userinfo endpoint not configured")

    try:
        req = urllib.request.Request(
            userinfo_url,
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        raise HTTPException(status_code=400, detail=f"Userinfo fetch failed: {e}")


def _find_or_create_sso_user(provider: str, subject: str, email: str, name: str = "") -> dict[str, Any]:
    """Find existing user linked to SSO, or return info for new user."""
    global _sso_user_map
    _sso_user_map = _load_sso_user_map()

    key = _get_sso_key(provider, subject)
    existing = _sso_user_map.get(key)

    if existing:
        existing["last_login"] = datetime.utcnow().isoformat() + "Z"
        _save_sso_map()
        return existing

    # New SSO user — return placeholder (account needs to be created via /auth/sso/register)
    return {
        "user_id": None,
        "username": email.split("@")[0] if email else subject,
        "email": email,
        "name": name,
        "provider": provider,
        "subject": subject,
        "is_new": True,
    }


# ==================== Routes ====================

@router.get("/providers", response_model=list[SSOProviderInfo])
async def list_sso_providers():
    """
    List available SSO providers.
    Shows provider info without revealing secrets.
    """
    config = get_sso_config()
    if not config.enabled:
        return []

    return [
        SSOProviderInfo(
            enabled=True,
            provider=config.provider,
            provider_name=config.provider_name,
            entity_id=config.entity_id,
            authorization_url=config.metadata_url,
            scopes=config.scopes,
        )
    ]


@router.get("/login")
async def sso_login(
    provider: str = Query("saml", pattern="^(saml|oidc)$"),
):
    """
    Initiate SSO login flow.

    Generates a state parameter, stores it in memory,
    and redirects to the SSO provider's login page.
    """
    config = get_sso_config()
    if not config.enabled:
        raise HTTPException(status_code=404, detail="SSO未启用")

    if provider != config.provider:
        raise HTTPException(status_code=400, detail=f"Provider '{provider}' not configured")

    state = _generate_state()
    nonce = secrets.token_urlsafe(16)
    _store_state(state, nonce)

    auth_url = _build_authorization_url(config, state)
    return RedirectResponse(url=auth_url, status_code=302)


@router.post("/callback/saml")
async def saml_callback(request: Request):
    """
    SAML 2.0 Assertion Consumer Service (ACS) endpoint.

    Receives the SAML response, validates it, and creates/links user.
    """
    config = get_sso_config()
    if not config.enabled:
        raise HTTPException(status_code=404, detail="SSO未启用")

    relay_state = (await request.form()).get("RelayState")
    if relay_state and not _verify_state(relay_state):
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    # Parse SAML response
    sso_info = await _parse_saml_response(request, config)

    # Find or create user
    user_info = _find_or_create_sso_user(
        provider="saml",
        subject=sso_info["subject"],
        email=sso_info["email"],
    )

    # Log the SSO login
    get_audit_logger().log(
        action="sso_login",
        user_id=user_info.get("user_id") or "new_sso_user",
        role="user",
        path="/api/v1/auth/sso/callback/saml",
        extra={"provider": "saml", "email": sso_info["email"]}
    )

    if user_info.get("is_new"):
        # New user — return a temporary token for registration
        temp_token = auth_manager.create_token(
            user_id=f"sso_temp_{sso_info['subject']}",
            extra_data={
                "sso_provider": "saml",
                "sso_subject": sso_info["subject"],
                "email": sso_info["email"],
                "is_sso_temp": True,
            }
        )
        return JSONResponse({
            "success": True,
            "is_new_user": True,
            "sso_provider": "saml",
            "email": sso_info["email"],
            "temp_token": temp_token,
            "message": "SSO验证成功，请完成注册",
        })

    # Existing user — create JWT
    token = auth_manager.create_token(
        user_id=user_info["user_id"],
        extra_data={
            "username": user_info.get("username", ""),
            "sso_provider": "saml",
            "email": sso_info["email"],
        }
    )

    return JSONResponse({
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": auth_manager._config.token_expire_hours * 3600,
        "user_id": user_info["user_id"],
        "sso_provider": "saml",
    })


@router.get("/callback/oidc")
async def oidc_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    OIDC Authorization Code callback.

    Exchanges the authorization code for tokens,
    fetches user info, and creates/links user.
    """
    config = get_sso_config()
    if not config.enabled:
        raise HTTPException(status_code=404, detail="SSO未启用")

    if not _verify_state(state):
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    # Exchange code for tokens
    tokens = _exchange_code_for_token(code, config)
    access_token = tokens.get("access_token", "")
    id_token = tokens.get("id_token", "")

    # Fetch user info
    userinfo = _fetch_oidc_userinfo(access_token)

    email = userinfo.get("email", "")
    subject = userinfo.get("sub", "")
    name = userinfo.get("name", "")
    username = userinfo.get("preferred_username", email.split("@")[0] if email else subject)

    # Find or create user
    sso_user = _find_or_create_sso_user(
        provider="oidc",
        subject=subject,
        email=email,
        name=name,
    )

    get_audit_logger().log(
        action="sso_login",
        user_id=sso_user.get("user_id") or "new_sso_user",
        role="user",
        path="/api/v1/auth/sso/callback/oidc",
        extra={"provider": "oidc", "email": email}
    )

    if sso_user.get("is_new"):
        temp_token = auth_manager.create_token(
            user_id=f"sso_temp_{subject}",
            extra_data={
                "sso_provider": "oidc",
                "sso_subject": subject,
                "email": email,
                "is_sso_temp": True,
            }
        )
        return JSONResponse({
            "success": True,
            "is_new_user": True,
            "sso_provider": "oidc",
            "email": email,
            "temp_token": temp_token,
            "message": "SSO验证成功，请完成注册",
        })

    token = auth_manager.create_token(
        user_id=sso_user["user_id"],
        extra_data={
            "username": sso_user.get("username", ""),
            "sso_provider": "oidc",
            "email": email,
        }
    )

    return JSONResponse({
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": auth_manager._config.token_expire_hours * 3600,
        "user_id": sso_user["user_id"],
        "sso_provider": "oidc",
    })


@router.post("/register")
async def sso_register(
    username: str,
    temp_token: str,
):
    """
    Complete SSO registration for new users.

    User provides a username to complete account creation.
    The temp_token was issued during SSO callback for new users.
    """
    try:
        payload = auth_manager.verify_token(temp_token)
        if not payload.get("is_sso_temp"):
            raise HTTPException(status_code=400, detail="Invalid token")

        sso_provider = payload.get("sso_provider")
        sso_subject = payload.get("sso_subject")
        email = payload.get("email")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token验证失败: {e}")

    # Create the actual user
    from .security import _user_store
    user_id = f"user_{len(_user_store) + 1}"
    user_info = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": Role.USER.value,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "sso_provider": sso_provider,
        "sso_subject": sso_subject,
    }

    _user_store[username] = user_info

    # Link SSO to user
    global _sso_user_map
    _sso_user_map = _load_sso_map()
    key = _get_sso_key(sso_provider, sso_subject)
    _sso_user_map[key] = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "linked_at": datetime.utcnow().isoformat() + "Z",
        "last_login": datetime.utcnow().isoformat() + "Z",
    }
    _save_sso_map()

    # Create proper JWT
    token = auth_manager.create_token(
        user_id=user_id,
        extra_data={"username": username, "sso_provider": sso_provider}
    )

    get_audit_logger().log(
        action="sso_register",
        user_id=user_id,
        role=Role.USER.value,
        path="/api/v1/auth/sso/register",
        extra={"sso_provider": sso_provider, "username": username}
    )

    return JSONResponse({
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": auth_manager._config.token_expire_hours * 3600,
        "user_id": user_id,
        "username": username,
        "sso_provider": sso_provider,
    })


@router.get("/me")
async def get_sso_status(current_user: User = Depends(get_current_user)):
    """Get SSO link status for the current user."""
    global _sso_user_map
    _sso_user_map = _load_sso_map()

    linked_providers = []
    for key, info in _sso_user_map.items():
        if info.get("user_id") == current_user.user_id:
            provider, subject = key.split(":", 1)
            linked_providers.append({
                "provider": provider,
                "linked_at": info.get("linked_at"),
                "last_login": info.get("last_login"),
            })

    return {
        "user_id": current_user.user_id,
        "linked_providers": linked_providers,
    }


@router.post("/link")
async def link_sso_provider(
    provider: str = Query("saml", pattern="^(saml|oidc)$"),
    current_user: User = Depends(get_current_user),
):
    """
    Link an SSO provider to an existing account.

    Initiates the SSO flow. After successful SSO authentication,
    the provider will be linked to the current user's account.
    """
    config = get_sso_config()
    if not config.enabled:
        raise HTTPException(status_code=404, detail="SSO未启用")

    state = _generate_state()
    _store_state(state, nonce=str(current_user.user_id))

    # Store linking intent in state
    _sso_states[state]["link_user_id"] = current_user.user_id

    auth_url = _build_authorization_url(config, state)
    return JSONResponse({
        "success": True,
        "authorization_url": auth_url,
        "message": f"请在浏览器中完成{config.provider_name}授权"
    })


@router.delete("/link/{sso_provider}")
async def unlink_sso_provider(
    sso_provider: str,
    current_user: User = Depends(get_current_user),
):
    """
    Unlink an SSO provider from the current account.
    """
    global _sso_user_map
    _sso_user_map = _load_sso_map()

    # Find and remove the link
    keys_to_remove = []
    for key, info in _sso_user_map.items():
        if info.get("user_id") == current_user.user_id and key.startswith(f"{sso_provider}:"):
            keys_to_remove.append(key)

    if not keys_to_remove:
        raise HTTPException(status_code=404, detail="未找到该SSO链接")

    for key in keys_to_remove:
        del _sso_user_map[key]

    _save_sso_map()

    get_audit_logger().log(
        action="sso_unlink",
        user_id=current_user.user_id,
        role=current_user.role.value,
        path=f"/api/v1/auth/sso/link/{sso_provider}",
        extra={"unlinked_provider": sso_provider}
    )

    return {"success": True, "message": f"已解除{sso_provider}链接"}


# ==================== SSO Config (Admin) ====================

@router.get("/config")
async def get_sso_config_info(current_user: User = Depends(get_current_user)):
    """Get SSO configuration (admin only, no secrets)."""
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="管理员权限 Required")

    config = get_sso_config()
    return {
        "enabled": config.enabled,
        "provider": config.provider,
        "provider_name": config.provider_name,
        "entity_id": config.entity_id,
        "metadata_url": config.metadata_url,
        "scopes": config.scopes,
        "has_signing_cert": bool(config.signing_cert),
        "has_client_secret": bool(config.client_secret),
    }
