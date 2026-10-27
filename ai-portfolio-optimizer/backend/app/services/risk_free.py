import os
import time
import logging
import requests

logger = logging.getLogger("risk_free")

FALLBACK_RATE = 0.03
CACHE_SECONDS = 12 * 3600
_cache = {"value": None, "ts": 0.0}


def get_risk_free_rate() -> float:
    """Latest US 3-month Treasury yield (FRED series DGS3MO) as a decimal."""
    now = time.time()
    if _cache["value"] is not None and now - _cache["ts"] < CACHE_SECONDS:
        return _cache["value"]

    key = os.getenv("FRED_API_KEY")
    if not key:
        return FALLBACK_RATE

    try:
        resp = requests.get(
            "https://api.stlouisfed.org/fred/series/observations",
            params={
                "series_id": "DGS3MO",
                "api_key": key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 10,
            },
            timeout=10,
        )
        resp.raise_for_status()
        for obs in resp.json().get("observations", []):
            if obs["value"] != ".":  # FRED uses "." for missing days
                rate = float(obs["value"]) / 100
                _cache["value"], _cache["ts"] = rate, now
                return rate
    except Exception as e:
        logger.warning(f"FRED fetch failed: {e}")

    return _cache["value"] if _cache["value"] is not None else FALLBACK_RATE
