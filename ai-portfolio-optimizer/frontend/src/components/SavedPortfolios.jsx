import { useState } from 'react'
import AllocationTable from './AllocationTable.jsx'
import { downloadReport, printReport, money } from '../utils/report.js'

export default function SavedPortfolios({ saved, loading, onDelete }) {
  const [openId, setOpenId] = useState(null)

  if (loading) return <p className="muted">Loading...</p>
  if (!saved.length)
    return <p className="muted">No saved portfolios yet. Run an analysis and click Save Portfolio.</p>

  return (
    <div className="saved-list">
      {saved.map((p) => {
        const data = {
          name: p.portfolio_name,
          createdAt: p.created_at,
          amount: Number(p.investment_amount) || 10000,
          period: p.period,
          result: p.result,
        }
        return (
          <div key={p.id} className="saved-card">
            <div className="saved-head">
              <div>
                <h3>{p.portfolio_name}</h3>
                <p className="muted">
                  {new Date(p.created_at).toLocaleDateString()} · {(p.tickers || []).join(', ')} ·{' '}
                  {money(data.amount)} · Risk: {p.risk_level}
                </p>
              </div>
              <div className="row-actions">
                <button onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                  {openId === p.id ? 'Hide' : 'View'}
                </button>
                <button onClick={() => downloadReport(data)}>Report</button>
                <button onClick={() => printReport(data)}>PDF</button>
                <button
                  className="danger"
                  onClick={() => window.confirm('Delete this portfolio?') && onDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            {openId === p.id && (
              <AllocationTable result={p.result} amount={data.amount} title="Saved Plan" />
            )}
          </div>
        )
      })}
    </div>
  )
}
