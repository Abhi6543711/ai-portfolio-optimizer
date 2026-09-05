"""
AI-Based Market Trend Prediction Module
Uses lagged-price features with RandomForest (and LinearRegression baseline)
to predict next-day closing price per ticker.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


def _build_features(series: pd.Series, lags: int = 5) -> pd.DataFrame:
    df = pd.DataFrame({"price": series})
    for lag in range(1, lags + 1):
        df[f"lag_{lag}"] = df["price"].shift(lag)
    df["target"] = df["price"].shift(-1)
    return df.dropna()


def predict_ticker_trend(prices: pd.Series) -> dict:
    df = _build_features(prices)
    if len(df) < 30:
        return {"error": "Not enough data to train a model for this ticker"}

    feature_cols = [c for c in df.columns if c.startswith("lag_")]
    X = df[feature_cols]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    rf = RandomForestRegressor(n_estimators=200, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)

    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)

    latest_features = X.iloc[[-1]]
    next_day_prediction = float(rf.predict(latest_features)[0])
    current_price = float(prices.iloc[-1])
    predicted_change_pct = round(
        (next_day_prediction - current_price) / current_price * 100, 2
    )

    return {
        "current_price": round(current_price, 2),
        "predicted_next_close": round(next_day_prediction, 2),
        "predicted_change_pct": predicted_change_pct,
        "model_performance": {
            "random_forest": {
                "mae": round(mean_absolute_error(y_test, rf_pred), 4),
                "rmse": round(mean_squared_error(y_test, rf_pred) ** 0.5, 4),
                "r2": round(r2_score(y_test, rf_pred), 4),
            },
            "linear_regression": {
                "mae": round(mean_absolute_error(y_test, lr_pred), 4),
                "rmse": round(mean_squared_error(y_test, lr_pred) ** 0.5, 4),
                "r2": round(r2_score(y_test, lr_pred), 4),
            },
        },
    }


def predict_all(prices: pd.DataFrame) -> dict:
    return {ticker: predict_ticker_trend(prices[ticker]) for ticker in prices.columns}
