"""
Portfolio Optimization Engine
Uses PyPortfolioOpt for Minimum Risk, Maximum Sharpe, and Maximum Return portfolios.
"""
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models

from app.services.risk_free import get_risk_free_rate


def _inputs(prices: pd.DataFrame):
    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.sample_cov(prices)
    return mu, S


def optimize_min_risk(prices: pd.DataFrame) -> dict:
    mu, S = _inputs(prices)
    rf = get_risk_free_rate()
    ef = EfficientFrontier(mu, S)
    ef.min_volatility()
    cleaned = ef.clean_weights()
    perf = ef.portfolio_performance(risk_free_rate=rf)
    return _format_result(cleaned, perf)


def optimize_max_sharpe(prices: pd.DataFrame) -> dict:
    mu, S = _inputs(prices)
    # PyPortfolioOpt needs the risk-free rate below the best asset's return
    rf = min(get_risk_free_rate(), float(mu.max()) - 1e-4)
    ef = EfficientFrontier(mu, S)
    ef.max_sharpe(risk_free_rate=rf)
    cleaned = ef.clean_weights()
    perf = ef.portfolio_performance(risk_free_rate=rf)
    return _format_result(cleaned, perf)


def optimize_max_return(prices: pd.DataFrame) -> dict:
    """Unconstrained max return is 100% in the highest-return asset."""
    mu, S = _inputs(prices)
    top_asset = mu.idxmax()
    weights = {t: (1.0 if t == top_asset else 0.0) for t in mu.index}

    port_return = float(mu[top_asset])
    port_vol = float(S.loc[top_asset, top_asset] ** 0.5)
    sharpe = (port_return - get_risk_free_rate()) / port_vol if port_vol else 0.0

    return _format_result(weights, (port_return, port_vol, sharpe))


def _format_result(weights: dict, perf: tuple) -> dict:
    exp_ret, vol, sharpe = perf
    return {
        "weights": {k: round(v, 4) for k, v in weights.items() if v > 0},
        "expected_return": round(exp_ret, 4),
        "volatility": round(vol, 4),
        "sharpe_ratio": round(sharpe, 4),
    }


STRATEGY_MAP = {
    "conservative": optimize_min_risk,
    "balanced": optimize_max_sharpe,
    "aggressive": optimize_max_return,
}


def optimize_all_strategies(prices: pd.DataFrame) -> dict:
    return {name: fn(prices) for name, fn in STRATEGY_MAP.items()}
