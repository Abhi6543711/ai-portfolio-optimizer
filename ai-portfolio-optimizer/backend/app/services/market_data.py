"""
Market Data Module
Fetches historical price data for given tickers using Stooq (free, no API key).

Note: Yahoo Finance (via yfinance) blocks requests from most cloud-provider IP
ranges (Render, AWS, GCP, etc.) at the network level, regardless of headers or
browser impersonation — a widely reported, unresolved issue. Stooq is a free,
keyless alternative that works reliably from cloud hosts.
"""
import pandas as pd
import pandas_datareader.data as web
from datetime import datetime, timedelta

PERIOD_TO_DAYS = {
    "1y": 365,
    "2y": 730,
    "5y": 1825,
}


def _stooq_symbol(ticker: str) -> str:
    """Stooq expects US tickers with a .US suffix."""
    ticker = ticker.strip().upper()
    return ticker if "." in ticker else f"{ticker}.US"


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
        try:
            df = web.DataReader(_stooq_symbol(ticker), "stooq", start=start, end=end)
            if df.empty:
                failed.append(ticker)
                continue
            df = df.sort_index()  # stooq returns newest-first by default
            series_by_ticker[ticker] = df["Close"]
        except Exception:
            failed.append(ticker)

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
        # Non-fatal: proceed with whichever tickers succeeded
        prices.attrs["failed_tickers"] = failed

    return prices


def compute_daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """Compute daily percentage returns from a price DataFrame."""
    return prices.pct_change().dropna()
