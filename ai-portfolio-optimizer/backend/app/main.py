from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.portfolio import router as portfolio_router

app = FastAPI(
    title="AI Portfolio Optimization API",
    description="Free, open-source AI-based portfolio optimization system",
    version="1.0.0",
)

# Allow the frontend (localhost dev + deployed Vercel URL) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your Vercel domain before production use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio_router)


@app.get("/")
def root():
    return {"message": "AI Portfolio Optimization API is running"}
