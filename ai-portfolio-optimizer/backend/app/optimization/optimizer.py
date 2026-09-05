"""
Portfolio Optimization Engine
Uses PyPortfolioOpt to compute Minimum Risk, Maximum Sharpe, and Maximum Return portfolios.
"""
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models


def get_efficient_frontier(prices: pd.DataFrame) -> EfficientFrontier:
    mu = expected_returns.mean_historical_return(prices)
    S = risk_models.sample_cov(prices)
    return EfficientFrontier(mu, S), mu, S


def optimize_min_risk(prices: pd.DataFrame) -> dict:
    ef, _, _ = get_efficient_frontier(prices)
    weights = ef.min_volatility()
    cleaned = ef.clean_weights()
    perf = ef.portfolio_performance()
    return _format_result(cleaned, perf)


def optimize_max_sharpe(prices: pd.DataFrame) -> dict:
    ef, _, _ = get_efficient_frontier(prices)
    weights = ef.max_sharpe()
    cleaned = ef.clean_weights()
    perf = ef.portfolio_performance()
    return _format_result(cleaned, perf)


def optimize_max_return(prices: pd.DataFrame) -> dict:
    """
    PyPortfolioOpt doesn't have a direct 'max return' solver (unconstrained max return
    is just 100% in the highest-return asset), so we approximate it by targeting
    the highest achievable return point on the efficient frontier just below max volatility.
    """
    mu = expected_returns.mean_historical_return(prices)
    top_asset = mu.idxmax()
    weights = {ticker: (1.0 if ticker == top_asset else 0.0) for ticker in mu.index}

    S = risk_models.sample_cov(prices)
    port_return = float(mu[top_asset])
    port_vol = float(S.loc[top_asset, top_asset] ** 0.5)
    sharpe = (port_return - 0.03) / port_vol if port_vol else 0.0

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
