"""
Market Data Module
Fetches historical price data for given tickers using yfinance (free, no API key).

Note: Yahoo Finance blocks/rate-limits plain requests from datacenter IPs
(common on Render/Heroku/etc). We use curl_cffi to impersonate a real
browser's TLS fingerprint, which reliably avoids this.
"""
import yfinance as yf
import pandas as pd
from curl_cffi import requests as cffi_requests


def _browser_session():
    return cffi_requests.Session(impersonate="chrome")


def fetch_price_data(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Fetch adjusted close prices for a list of tickers.
    Returns a DataFrame: rows = dates, columns = tickers.
    """
    if not tickers:
        raise ValueError("No tickers provided")

    session = _browser_session()
    data = yf.download(
        tickers, period=period, auto_adjust=True, progress=False, session=session
    )

    if data.empty:
        raise ValueError(
            "No data returned for given tickers. Check ticker symbols are valid "
            "(e.g. AAPL, MSFT) and try again."
        )

    # yfinance returns multi-index columns when multiple tickers are passed
    if isinstance(data.columns, pd.MultiIndex):
        prices = data["Close"]
    else:
        prices = data[["Close"]]
        prices.columns = tickers

    prices = prices.dropna(how="all").ffill().dropna()

    if prices.empty:
        raise ValueError("No usable price data after cleaning — try different tickers or a longer period")

    return prices


def compute_daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """Compute daily percentage returns from a price DataFrame."""
    return prices.pct_change().dropna()
