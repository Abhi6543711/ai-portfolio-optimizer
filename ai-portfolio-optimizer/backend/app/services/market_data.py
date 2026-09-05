"""
Market Data Module
Fetches historical price data for given tickers using yfinance (free, no API key).
"""
import yfinance as yf
import pandas as pd


def fetch_price_data(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Fetch adjusted close prices for a list of tickers.
    Returns a DataFrame: rows = dates, columns = tickers.
    """
    if not tickers:
        raise ValueError("No tickers provided")

    data = yf.download(tickers, period=period, auto_adjust=True, progress=False)

    if data.empty:
        raise ValueError("No data returned for given tickers")

    # yfinance returns multi-index columns when multiple tickers are passed
    if isinstance(data.columns, pd.MultiIndex):
        prices = data["Close"]
    else:
        prices = data[["Close"]]
        prices.columns = tickers

    prices = prices.dropna(how="all").ffill().dropna()
    return prices


def compute_daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """Compute daily percentage returns from a price DataFrame."""
    return prices.pct_change().dropna()
