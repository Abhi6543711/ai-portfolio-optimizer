"""
Market Data Module
Fetches historical price data for given tickers using Stooq's free CSV export
endpoint (no API key, no library dependency issues).

Note: Yahoo Finance (via yfinance) blocks requests from most cloud-provider IP
ranges (Render, AWS, GCP, etc.) at the network level, regardless of headers or
browser impersonation — a widely reported, unresolved issue. Stooq is a free,
keyless alternative that works reliably from cloud hosts.
"""
import io
import logging
import pandas as pd
import requests
from datetime import datetime, timedelta

logger = logging.getLogger("market_data")

PERIOD_TO_DAYS = {
    "1y": 365,
    "2y": 730,
    "5y": 1825,
}

STOOQ_URL = "https://stooq.com/q/d/l/"


def _stooq_symbol(ticker: str) -> str:
    """Stooq expects US tickers with a .us suffix, lowercase."""
    ticker = ticker.strip().lower()
    return ticker if "." in ticker else f"{ticker}.us"


def _fetch_single(ticker: str, start: datetime, end: datetime) -> pd.Series | None:
    params = {
        "s": _stooq_symbol(ticker),
        "d1": start.strftime("%Y%m%d"),
        "d2": end.strftime("%Y%m%d"),
        "i": "d",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(STOOQ_URL, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        text = resp.text.strip()

        # Stooq returns a plain "N/D" (no data) body for invalid/unknown symbols
        if not text or text.startswith("N/D") or "Date" not in text.splitlines()[0]:
            logger.warning(f"Stooq returned no data for {ticker}: {text[:100]!r}")
            return None

        df = pd.read_csv(io.StringIO(text))
        if df.empty or "Close" not in df.columns:
            return None

        df["Date"] = pd.to_datetime(df["Date"])
        df = df.set_index("Date").sort_index()
        return df["Close"]
    except Exception as e:
        logger.warning(f"Stooq fetch failed for {ticker}: {e}")
        return None

def fetch_price_data(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Fetch closing prices for a list of tickers from Stooq.
    Returns a DataFrame: rows = dates, columns = tickers.
    """
    if not tickers:
        raise ValueError("No tickers provided")

    days = PERIOD_TO_DAYS.get(period, 730)
    end = datetime.today()
    start = end - timedelta(days=days)

    series_by_ticker = {}
    failed = []

    for ticker in tickers:
        series = _fetch_single(ticker, start, end)
        if series is None or series.empty:
            failed.append(ticker)
        else:
            series_by_ticker[ticker] = series

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
    """Compute daily percentage returns from a price DataFrame."""
    return prices.pct_change().dropna()
