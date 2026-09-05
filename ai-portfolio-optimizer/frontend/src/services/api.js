const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzePortfolio(tickers, period = '2y', userId = null, portfolioName = 'My Portfolio') {
  const response = await fetch(`${API_BASE_URL}/api/portfolio/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers, period, user_id: userId, portfolio_name: portfolioName }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to analyze portfolio')
  }

  return response.json()
}
