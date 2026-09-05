# AI Portfolio Optimizer

Free, AI-based portfolio optimization system: market data + risk analysis + ML trend prediction + portfolio optimization, with a clean React dashboard.

> Educational/research project. Not financial advice.

## Stack (100% free)
- Frontend: React + Vite
- Backend: FastAPI (Python)
- ML: scikit-learn
- Optimization: PyPortfolioOpt / SciPy
- Market data: yfinance (no API key needed)

## Supabase setup (free tier)
1. Create a project at supabase.com (free tier).
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → used as `SUPABASE_URL` (backend) / `VITE_SUPABASE_URL` (frontend)
   - `anon public` key → `VITE_SUPABASE_ANON_KEY` (frontend)
   - `service_role` key → `SUPABASE_SERVICE_KEY` (backend only — never expose this in frontend)
4. In **Authentication → Providers**, Email is enabled by default — that's all you need.

## Run locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# create backend/.env with:
#   SUPABASE_URL=your-project-url
#   SUPABASE_SERVICE_KEY=your-service-role-key
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Free deployment
- **Frontend** → Vercel (free tier): import repo, set root dir to `frontend`, add env var `VITE_API_URL` = your backend URL.
- **Backend** → Render.com free web service: root dir `backend`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## API
`POST /api/portfolio/analyze`
```json
{ "tickers": ["AAPL", "MSFT", "GOOGL"], "period": "2y" }
```
Returns baseline risk metrics, three optimized strategies (conservative/balanced/aggressive), and next-day ML price predictions per ticker.

## Roadmap
- Supabase auth + persistence (save/compare past portfolios)
- Live price refresh
- Backtesting
