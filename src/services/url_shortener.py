"""
URL Shortener Service — Short codes for presentation links
R153: Presentation QR Code & NFC Integration
"""

import base64
import hashlib
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

SHORT_URL_DIR = Path(__file__).parent.parent.parent / "data" / "short_urls"
SHORT_URL_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache
_short_url_cache: dict[str, dict[str, Any]] = {}
_code_to_url_cache: dict[str, dict[str, Any]] = {}


def _load_data() -> dict[str, dict[str, Any]]:
    fpath = SHORT_URL_DIR / "urls.json"
    if fpath.exists():
        try:
            with open(fpath, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_data(data: dict[str, dict[str, Any]]) -> None:
    fpath = SHORT_URL_DIR / "urls.json"
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _generate_short_code(url: str, owner_id: str = "default") -> str:
    """Generate a deterministic short code from URL + owner."""
    raw = f"{url}:{owner_id}:{uuid.uuid4().hex[:4]}"
    h = hashlib.sha256(raw.encode()).digest()
    # Base64 URL-safe, strip padding, take first 8 chars
    code = base64.urlsafe_b64encode(h).decode().rstrip("=")[:8]
    return code


class UrlShortenerService:
    """Service for shortening presentation URLs."""

    def create_short_url(
        self,
        original_url: str,
        owner_id: str = "default",
        ppt_id: str = "",
        title: str = "",
    ) -> dict[str, Any]:
        """Create a short URL for a presentation."""
        data = _load_data()

        # Check if already shortened for this owner+ppt
        for uid, entry in data.items():
            if entry.get("original_url") == original_url and entry.get("owner_id") == owner_id:
                return {
                    "short_code": entry["short_code"],
                    "short_url": f"/s/{entry['short_code']}",
                    "original_url": original_url,
                    "created_at": entry["created_at"],
                }

        short_code = _generate_short_code(original_url, owner_id)
        created_at = datetime.now().isoformat()

        entry = {
            "uid": short_code,
            "short_code": short_code,
            "original_url": original_url,
            "owner_id": owner_id,
            "ppt_id": ppt_id,
            "title": title,
            "created_at": created_at,
            "access_count": 0,
            "qr_scan_count": 0,
            "nfc_count": 0,
            "beacon_count": 0,
        }

        data[short_code] = entry
        _save_data(data)

        return {
            "short_code": short_code,
            "short_url": f"/s/{short_code}",
            "original_url": original_url,
            "created_at": created_at,
        }

    def resolve_short_url(self, short_code: str) -> dict[str, Any] | None:
        """Resolve a short code back to original URL."""
        data = _load_data()
        entry = data.get(short_code)
        if entry:
            # Increment access count
            entry["access_count"] = entry.get("access_count", 0) + 1
            data[short_code] = entry
            _save_data(data)
            return {
                "original_url": entry["original_url"],
                "ppt_id": entry.get("ppt_id", ""),
                "title": entry.get("title", ""),
            }
        return None

    def record_qr_scan(self, short_code: str) -> None:
        """Record a QR code scan."""
        data = _load_data()
        if short_code in data:
            data[short_code]["qr_scan_count"] = data[short_code].get("qr_scan_count", 0) + 1
            _save_data(data)

    def record_nfc_tap(self, short_code: str) -> None:
        """Record an NFC tap."""
        data = _load_data()
        if short_code in data:
            data[short_code]["nfc_count"] = data[short_code].get("nfc_count", 0) + 1
            _save_data(data)

    def record_beacon_trigger(self, short_code: str) -> None:
        """Record a beacon proximity trigger."""
        data = _load_data()
        if short_code in data:
            data[short_code]["beacon_count"] = data[short_code].get("beacon_count", 0) + 1
            _save_data(data)

    def get_url_analytics(self, short_code: str) -> dict[str, Any] | None:
        """Get analytics for a short URL."""
        data = _load_data()
        entry = data.get(short_code)
        if not entry:
            return None
        return {
            "short_code": short_code,
            "original_url": entry["original_url"],
            "title": entry.get("title", ""),
            "total_accesses": entry.get("access_count", 0),
            "qr_scans": entry.get("qr_scan_count", 0),
            "nfc_taps": entry.get("nfc_count", 0),
            "beacon_triggers": entry.get("beacon_count", 0),
            "created_at": entry.get("created_at", ""),
        }

    def list_short_urls(self, owner_id: str = "default") -> list:
        """List all short URLs for an owner."""
        data = _load_data()
        return [
            {
                "short_code": v["short_code"],
                "short_url": f"/s/{v['short_code']}",
                "original_url": v["original_url"],
                "title": v.get("title", ""),
                "total_accesses": v.get("access_count", 0),
                "qr_scans": v.get("qr_scan_count", 0),
                "nfc_taps": v.get("nfc_count", 0),
                "beacon_triggers": v.get("beacon_count", 0),
                "created_at": v.get("created_at", ""),
            }
            for v in data.values()
            if v.get("owner_id") == owner_id
        ]

    def delete_short_url(self, short_code: str, owner_id: str = "default") -> bool:
        """Delete a short URL."""
        data = _load_data()
        entry = data.get(short_code)
        if entry and entry.get("owner_id") == owner_id:
            del data[short_code]
            _save_data(data)
            return True
        return False


_svc = UrlShortenerService()


def get_url_shortener_service() -> UrlShortenerService:
    return _svc
