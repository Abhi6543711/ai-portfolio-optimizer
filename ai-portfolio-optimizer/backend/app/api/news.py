import os
import time
import logging
import requests
from datetime import date, timedelta
from fastapi import APIRouter

logger = logging.getLogger("news")
router = APIRouter()

_cache: dict = {}
CACHE_SECONDS = 900


@router.get("/api/news")
def get_news(tickers: str):
    key = os.getenv("FINNHUB_API_KEY")
    if not key:
        return {"news": {}}

    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()][:8]
    today = date.today()
    start = today - timedelta(days=7)
    result = {}

    for symbol in symbols:
        cached = _cache.get(symbol)
        if cached and time.time() - cached[0] < CACHE_SECONDS:
            result[symbol] = cached[1]
            continue
        try:
            r = requests.get(
                "https://finnhub.io/api/v1/company-news",
                params={
                    "symbol": symbol,
                    "from": start.isoformat(),
                    "to": today.isoformat(),
                    "token": key,
                },
                timeout=10,
            )
            r.raise_for_status()
            items = [
                {
                    "headline": n.get("headline"),
                    "source": n.get("source"),
                    "url": n.get("url"),
                    "datetime": n.get("datetime"),
                }
                for n in r.json()[:3]
            ]
        except Exception as e:
            logger.warning(f"Finnhub news failed for {symbol}: {e}")
            items = []
        _cache[symbol] = (time.time(), items)
        result[symbol] = items

    return {"news": result}
