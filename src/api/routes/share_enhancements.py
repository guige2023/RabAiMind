"""
URL Shortener, QR Code Analytics & Beacon Routes
R153: Presentation QR Code & NFC Integration
"""


from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ...api.middleware.auth import get_current_user
from ...core.security import User
from ...services.beacon_service import get_beacon_service
from ...services.url_shortener import get_url_shortener_service

router = APIRouter(prefix="/api/v1/share", tags=["share-enhancements"])


# ==================== Pydantic Models ====================

class ShortUrlCreate(BaseModel):
    original_url: str
    ppt_id: str = ""
    title: str = ""


class ShortUrlResponse(BaseModel):
    short_code: str
    short_url: str
    original_url: str
    created_at: str


class QRScanRecord(BaseModel):
    short_code: str
    device_info: str = ""
    location: str = ""
    accessed_via: str = Field(default="qr_code", pattern="^(qr_code|nfc|beacon)$")


class BeaconCreate(BaseModel):
    ppt_id: str
    name: str
    uuid: str = ""
    major: int = 1
    minor: int = 1
    tx_power: int = -59
    url: str = ""


class BeaconUpdate(BaseModel):
    name: str | None = None
    uuid: str | None = None
    major: int | None = None
    minor: int | None = None
    tx_power: int | None = None
    url: str | None = None
    active: bool | None = None


# ==================== URL Shortener Routes ====================

@router.post("/short-url")
async def create_short_url(
    req: ShortUrlCreate,
    user: User = Depends(get_current_user),
):
    """Create a short URL for a presentation."""
    svc = get_url_shortener_service()
    result = svc.create_short_url(
        original_url=req.original_url,
        owner_id=user.user_id,
        ppt_id=req.ppt_id,
        title=req.title,
    )
    return {"success": True, **result}


@router.get("/short-url/{short_code}")
async def resolve_short_url(short_code: str):
    """Resolve a short URL code to original URL (public endpoint)."""
    svc = get_url_shortener_service()
    result = svc.resolve_short_url(short_code)
    if not result:
        raise HTTPException(status_code=404, detail="短链接不存在")
    return {"success": True, **result}


@router.get("/short-urls")
async def list_short_urls(user: User = Depends(get_current_user)):
    """List all short URLs for the current user."""
    svc = get_url_shortener_service()
    urls = svc.list_short_urls(owner_id=user.user_id)
    return {"success": True, "short_urls": urls}


@router.get("/short-url/{short_code}/analytics")
async def get_short_url_analytics(
    short_code: str,
    user: User = Depends(get_current_user),
):
    """Get analytics for a short URL."""
    svc = get_url_shortener_service()
    analytics = svc.get_url_analytics(short_code)
    if not analytics:
        raise HTTPException(status_code=404, detail="短链接不存在")
    return {"success": True, **analytics}


@router.delete("/short-url/{short_code}")
async def delete_short_url(
    short_code: str,
    user: User = Depends(get_current_user),
):
    """Delete a short URL."""
    svc = get_url_shortener_service()
    success = svc.delete_short_url(short_code, owner_id=user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="短链接不存在或无权限删除")
    return {"success": success}


# ==================== QR Scan Analytics Routes ====================

@router.post("/qr-scan")
async def record_qr_scan(
    short_code: str = Query(""),
    device_info: str = Query(""),
    location: str = Query(""),
):
    """Record a QR code scan event (public endpoint)."""
    svc = get_url_shortener_service()
    if short_code:
        svc.record_qr_scan(short_code)

    return {"success": True, "short_code": short_code}


@router.post("/nfc-tap")
async def record_nfc_tap(
    short_code: str = Query(""),
    device_info: str = Query(""),
    location: str = Query(""),
):
    """Record an NFC tap event (public endpoint)."""
    svc = get_url_shortener_service()
    if short_code:
        svc.record_nfc_tap(short_code)
    return {"success": True, "short_code": short_code}


@router.post("/beacon-trigger")
async def record_beacon_trigger(
    beacon_id: str = Query(""),
    short_code: str = Query(""),
    device_info: str = Query(""),
):
    """Record a Bluetooth beacon proximity trigger event."""
    beacon_svc = get_beacon_service()
    short_svc = get_url_shortener_service()

    if beacon_id:
        beacon_svc.record_trigger(beacon_id)
    if short_code:
        short_svc.record_beacon_trigger(short_code)

    return {"success": True}


# ==================== Beacon Routes ====================

@router.post("/beacon")
async def create_beacon(
    req: BeaconCreate,
    user: User = Depends(get_current_user),
):
    """Create a Bluetooth beacon configuration for a presentation."""
    svc = get_beacon_service()
    beacon = svc.create_beacon(
        owner_id=user.user_id,
        ppt_id=req.ppt_id,
        name=req.name,
        uuid_str=req.uuid,
        major=req.major,
        minor=req.minor,
        tx_power=req.tx_power,
        url=req.url,
    )
    return {"success": True, "beacon": beacon}


@router.get("/beacons")
async def list_beacons(
    ppt_id: str = Query(""),
    user: User = Depends(get_current_user),
):
    """List beacon configurations for the current user."""
    svc = get_beacon_service()
    beacons = svc.list_beacons(owner_id=user.user_id, ppt_id=ppt_id)
    return {"success": True, "beacons": beacons}


@router.get("/beacon/{beacon_id}")
async def get_beacon(
    beacon_id: str,
    user: User = Depends(get_current_user),
):
    """Get a specific beacon configuration."""
    svc = get_beacon_service()
    beacon = svc.get_beacon(beacon_id)
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon不存在")
    if beacon.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="无权限访问")
    return {"success": True, "beacon": beacon}


@router.put("/beacon/{beacon_id}")
async def update_beacon(
    beacon_id: str,
    req: BeaconUpdate,
    user: User = Depends(get_current_user),
):
    """Update a beacon configuration."""
    svc = get_beacon_service()
    beacon = svc.get_beacon(beacon_id)
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon不存在")
    if beacon.get("owner_id") != user.user_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = svc.update_beacon(beacon_id, updates)
    return {"success": True, "beacon": updated}


@router.delete("/beacon/{beacon_id}")
async def delete_beacon(
    beacon_id: str,
    user: User = Depends(get_current_user),
):
    """Delete a beacon configuration."""
    svc = get_beacon_service()
    success = svc.delete_beacon(beacon_id, owner_id=user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Beacon不存在或无权限删除")
    return {"success": success}
