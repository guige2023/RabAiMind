"""
Beacon Service — Bluetooth beacon proximity trigger configuration
R153: Presentation QR Code & NFC Integration
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

BEACON_DIR = Path(__file__).parent.parent.parent / "data" / "beacons"
BEACON_DIR.mkdir(parents=True, exist_ok=True)


def _load_data() -> dict[str, dict[str, Any]]:
    fpath = BEACON_DIR / "beacons.json"
    if fpath.exists():
        try:
            with open(fpath, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_data(data: dict[str, dict[str, Any]]) -> None:
    fpath = BEACON_DIR / "beacons.json"
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class BeaconService:
    """Service for managing Bluetooth beacon configurations."""

    def create_beacon(
        self,
        owner_id: str,
        ppt_id: str,
        name: str,
        uuid_str: str = "",
        major: int = 1,
        minor: int = 1,
        tx_power: int = -59,
        url: str = "",
    ) -> dict[str, Any]:
        """Create a beacon configuration for a presentation."""
        data = _load_data()

        beacon_id = str(uuid.uuid4())[:8]
        created_at = datetime.now().isoformat()

        # Default iBeacon-format UUID
        if not uuid_str:
            uuid_str = f"FD{A.owner_id[:6].upper()}-{ppt_id[:4].upper()}-RABM-INDEX"

        entry = {
            "beacon_id": beacon_id,
            "owner_id": owner_id,
            "ppt_id": ppt_id,
            "name": name,
            "uuid": uuid_str,
            "major": major,
            "minor": minor,
            "tx_power": tx_power,
            "url": url,
            "trigger_count": 0,
            "created_at": created_at,
            "active": True,
        }

        data[beacon_id] = entry
        _save_data(data)
        return entry

    def list_beacons(self, owner_id: str = "", ppt_id: str = "") -> list[dict[str, Any]]:
        """List beacon configurations."""
        data = _load_data()
        result = []
        for entry in data.values():
            if owner_id and entry.get("owner_id") != owner_id:
                continue
            if ppt_id and entry.get("ppt_id") != ppt_id:
                continue
            result.append(entry)
        return result

    def get_beacon(self, beacon_id: str) -> dict[str, Any] | None:
        """Get a beacon configuration."""
        data = _load_data()
        return data.get(beacon_id)

    def update_beacon(self, beacon_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update a beacon configuration."""
        data = _load_data()
        if beacon_id not in data:
            return None
        for key, val in updates.items():
            if key not in ("beacon_id", "owner_id", "created_at"):
                data[beacon_id][key] = val
        _save_data(data)
        return data[beacon_id]

    def delete_beacon(self, beacon_id: str, owner_id: str = "") -> bool:
        """Delete a beacon configuration."""
        data = _load_data()
        entry = data.get(beacon_id)
        if entry and (not owner_id or entry.get("owner_id") == owner_id):
            del data[beacon_id]
            _save_data(data)
            return True
        return False

    def record_trigger(self, beacon_id: str) -> None:
        """Record a beacon proximity trigger event."""
        data = _load_data()
        if beacon_id in data:
            data[beacon_id]["trigger_count"] = data[beacon_id].get("trigger_count", 0) + 1
            _save_data(data)


_svc = BeaconService()


def get_beacon_service() -> BeaconService:
    return _svc
