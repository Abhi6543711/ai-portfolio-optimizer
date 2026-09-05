"""
Financial Risk Analysis Module
Computes volatility, expected return, Sharpe ratio, max drawdown, and VaR.
"""
import numpy as np
import pandas as pd

TRADING_DAYS = 252
RISK_FREE_RATE = 0.03  # annualized, approx free-tier assumption


def annualized_return(daily_returns: pd.Series) -> float:
    return float(daily_returns.mean() * TRADING_DAYS)


def annualized_volatility(daily_returns: pd.Series) -> float:
    return float(daily_returns.std() * np.sqrt(TRADING_DAYS))


def sharpe_ratio(exp_return: float, volatility: float) -> float:
    if volatility == 0:
        return 0.0
    return float((exp_return - RISK_FREE_RATE) / volatility)


def max_drawdown(cumulative_returns: pd.Series) -> float:
    running_max = cumulative_returns.cummax()
    drawdown = (cumulative_returns - running_max) / running_max
    return float(drawdown.min())


def value_at_risk(daily_returns: pd.Series, confidence: float = 0.95) -> float:
    """Historical VaR at given confidence level (returns a negative number = potential loss)."""
    return float(np.percentile(daily_returns, (1 - confidence) * 100))


def portfolio_risk_metrics(portfolio_daily_returns: pd.Series) -> dict:
    exp_ret = annualized_return(portfolio_daily_returns)
    vol = annualized_volatility(portfolio_daily_returns)
    sharpe = sharpe_ratio(exp_ret, vol)
    cum_returns = (1 + portfolio_daily_returns).cumprod()
    mdd = max_drawdown(cum_returns)
    var_95 = value_at_risk(portfolio_daily_returns, 0.95)

    return {
        "expected_return": round(exp_ret, 4),
        "volatility": round(vol, 4),
        "sharpe_ratio": round(sharpe, 4),
        "max_drawdown": round(mdd, 4),
        "value_at_risk_95": round(var_95, 4),
    }


def risk_score(metrics: dict) -> dict:
    """
    Simple 0-100 risk score derived from volatility and drawdown.
    Higher = riskier.
    """
    vol_component = min(metrics["volatility"] / 0.5, 1) * 60       # cap at 50% annual vol
    dd_component = min(abs(metrics["max_drawdown"]) / 0.5, 1) * 40  # cap at 50% drawdown
    score = round(vol_component + dd_component)

    if score < 34:
        level = "Low"
    elif score < 67:
        level = "Medium"
    else:
        level = "High"

    return {"score": score, "level": level}
