import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function History({ userId }) {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetch(`${API_BASE_URL}/api/portfolio/history/${userId}`)
      .then((r) => r.json())
      .then((data) => setPortfolios(data.portfolios || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return null
  if (!portfolios.length) return null

  return (
    <div className="history-box">
      <h2>Past Portfolios</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Tickers</th><th>Return</th><th>Risk</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map((p) => (
            <tr key={p.id}>
              <td>{p.portfolio_name}</td>
              <td>{(p.tickers || []).join(', ')}</td>
              <td>{(p.expected_return * 100).toFixed(2)}%</td>
              <td>{p.risk_level}</td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
