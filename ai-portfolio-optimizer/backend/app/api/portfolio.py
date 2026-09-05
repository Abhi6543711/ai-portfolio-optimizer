from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.services.market_data import fetch_price_data, compute_daily_returns
from app.services.supabase_client import get_supabase
from app.risk import risk_analysis
from app.optimization import optimizer
from app.ml import predictor

router = APIRouter()


class PortfolioRequest(BaseModel):
    tickers: list[str]
    period: str = "2y"  # e.g. "1y", "2y", "5y"
    user_id: str | None = None  # if provided, results are saved to Supabase
    portfolio_name: str = "My Portfolio"

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, v):
        if not v or len(v) < 2:
            raise ValueError("Provide at least 2 tickers for diversification")
        if len(v) > 15:
            raise ValueError("Limit to 15 tickers to keep it fast on the free tier")
        return [t.strip().upper() for t in v]


@router.post("/api/portfolio/analyze")
def analyze_portfolio(request: PortfolioRequest):
    try:
        prices = fetch_price_data(request.tickers, request.period)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Market data error: {e}")

    daily_returns = compute_daily_returns(prices)

    # Equal-weight baseline metrics (for reference/display)
    equal_weight_returns = daily_returns.mean(axis=1)
    baseline_metrics = risk_analysis.portfolio_risk_metrics(equal_weight_returns)
    baseline_score = risk_analysis.risk_score(baseline_metrics)

    try:
        strategies = optimizer.optimize_all_strategies(prices)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization error: {e}")

    predictions = predictor.predict_all(prices)

    result = {
        "tickers": request.tickers,
        "baseline": {
            "metrics": baseline_metrics,
            "risk_score": baseline_score,
        },
        "strategies": strategies,
        "predictions": predictions,
    }

    if request.user_id:
        saved_id = _save_to_supabase(request, result)
        result["saved_portfolio_id"] = saved_id

    return result


def _save_to_supabase(request: PortfolioRequest, result: dict) -> str | None:
    supabase = get_supabase()
    if not supabase:
        return None

    balanced = result["strategies"]["balanced"]
    row = {
        "user_id": request.user_id,
        "portfolio_name": request.portfolio_name,
        "strategy": "balanced",
        "expected_return": balanced["expected_return"],
        "volatility": balanced["volatility"],
        "sharpe_ratio": balanced["sharpe_ratio"],
        "risk_score": result["baseline"]["risk_score"]["score"],
        "risk_level": result["baseline"]["risk_score"]["level"],
        "tickers": request.tickers,
    }
    inserted = supabase.table("portfolios").insert(row).execute()
    portfolio_id = inserted.data[0]["id"]

    asset_rows = [
        {"portfolio_id": portfolio_id, "ticker_symbol": t, "asset_weight": w}
        for t, w in balanced["weights"].items()
    ]
    if asset_rows:
        supabase.table("portfolio_assets").insert(asset_rows).execute()

    prediction_rows = [
        {
            "portfolio_id": portfolio_id,
            "ticker_symbol": ticker,
            "current_price": p.get("current_price"),
            "predicted_next_close": p.get("predicted_next_close"),
            "predicted_change_pct": p.get("predicted_change_pct"),
        }
        for ticker, p in result["predictions"].items()
        if "error" not in p
    ]
    if prediction_rows:
        supabase.table("predictions").insert(prediction_rows).execute()

    return portfolio_id


@router.get("/api/portfolio/history/{user_id}")
def get_history(user_id: str):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured on server")

    response = (
        supabase.table("portfolios")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"portfolios": response.data}


@router.get("/api/health")
def health_check():
    return {"status": "ok"}
