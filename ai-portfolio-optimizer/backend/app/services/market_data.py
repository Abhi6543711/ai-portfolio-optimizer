"""
Market Data Module
Fetches historical price data using Twelve Data's free API tier.

Note: yfinance (Yahoo) and Stooq both actively block requests from cloud-provider
IP ranges (Render, AWS, GCP, etc.) — a widely reported, unresolved issue for
scraped data sources. Twelve Data is a real API service (not scraped) with a
free tier that works reliably from cloud hosts.
"""
import os
import logging
import requests
import pandas as pd

logger = logging.getLogger("market_data")

TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY")
BASE_URL = "https://api.twelvedata.com/time_series"

PERIOD_TO_OUTPUTSIZE = {
    "1y": 260,
    "2y": 520,
    "5y": 1300,
}


def fetch_price_data(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    if not tickers:
        raise ValueError("No tickers provided")
    if not TWELVE_DATA_API_KEY:
        raise ValueError("Server misconfiguration: TWELVE_DATA_API_KEY is not set")

    outputsize = PERIOD_TO_OUTPUTSIZE.get(period, 520)
    symbols = ",".join(t.strip().upper() for t in tickers)

    params = {
        "symbol": symbols,
        "interval": "1day",
        "outputsize": outputsize,
        "apikey": TWELVE_DATA_API_KEY,
    }

    try:
        resp = requests.get(BASE_URL, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise ValueError(f"Failed to reach Twelve Data: {e}")

    # Single-ticker responses aren't nested under the symbol key; normalize that.
    if len(tickers) == 1:
        data = {tickers[0].upper(): data}

    series_by_ticker = {}
    failed = []

    for ticker in tickers:
        entry = data.get(ticker.upper())
        if not entry or entry.get("status") == "error" or "values" not in entry:
            msg = entry.get("message") if isinstance(entry, dict) else "no data"
            logger.warning(f"Twelve Data error for {ticker}: {msg}")
            failed.append(ticker)
            continue

        df = pd.DataFrame(entry["values"])
        df["datetime"] = pd.to_datetime(df["datetime"])
        df["close"] = df["close"].astype(float)
        df = df.set_index("datetime").sort_index()
        series_by_ticker[ticker] = df["close"]

    if not series_by_ticker:
        raise ValueError(
            f"No data returned for given tickers ({', '.join(tickers)}). "
            "Check the ticker symbols are valid (e.g. AAPL, MSFT) and try again."
        )

    prices = pd.DataFrame(series_by_ticker)
    prices = prices.dropna(how="all").ffill().dropna()

    if prices.empty:
        raise ValueError("No usable price data after cleaning — try different tickers or a longer period")

    if failed:
        prices.attrs["failed_tickers"] = failed

    return prices


def compute_daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    return prices.pct_change().dropna()
