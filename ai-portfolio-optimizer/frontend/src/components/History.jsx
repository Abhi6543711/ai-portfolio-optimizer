import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient.js'

export default function History({ userId, refreshKey }) {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setPortfolios(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (userId) load()
  }, [userId, refreshKey])

  async function toggleView(id) {
    if (openId === id) {
      setOpenId(null)
      setDetail(null)
      return
    }
    setOpenId(id)
    setDetail(null)
    const [assets, preds] = await Promise.all([
      supabase.from('portfolio_assets').select('*').eq('portfolio_id', id)
        .order('asset_weight', { ascending: false }),
      supabase.from('predictions').select('*').eq('portfolio_id', id),
    ])
    setDetail({ assets: assets.data || [], predictions: preds.data || [] })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this portfolio permanently?')) return
    const { error } = await supabase.from('portfolios').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setPortfolios((prev) => prev.filter((p) => p.id !== id))
    if (openId === id) {
      setOpenId(null)
      setDetail(null)
    }
  }

  if (loading || !portfolios.length) return error ? <div className="error-banner">{error}</div> : null

  return (
    <div className="history-box">
      <h2>Past Portfolios</h2>
      {error && <div className="error-banner">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Tickers</th><th>Return</th><th>Risk</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map((p) => (
            <>
              <tr key={p.id}>
                <td>{p.portfolio_name}</td>
                <td>{(p.tickers || []).join(', ')}</td>
                <td>{(Number(p.expected_return) * 100).toFixed(2)}%</td>
                <td>{p.risk_level}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button onClick={() => toggleView(p.id)}>
                    {openId === p.id ? 'Hide' : 'View'}
                  </button>
                  <button className="danger" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
              {openId === p.id && (
                <tr key={p.id + '-detail'} className="detail-row">
                  <td colSpan={6}>
                    {!detail ? (
                      'Loading...'
                    ) : (
                      <div className="detail-grid">
                        <div>
                          <h4>Saved Allocation ({p.strategy})</h4>
                          {detail.assets.map((a) => (
                            <div key={a.id} className="alloc-row">
                              <span>{a.ticker_symbol}</span>
                              <div className="alloc-bar">
                                <div style={{ width: `${Number(a.asset_weight) * 100}%` }} />
                              </div>
                              <span>{(Number(a.asset_weight) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                          <p className="muted">
                            Volatility {(Number(p.volatility) * 100).toFixed(2)}% · Sharpe{' '}
                            {Number(p.sharpe_ratio).toFixed(2)} · Risk score {p.risk_score}/100
                          </p>
                        </div>
                        <div>
                          <h4>Predictions at the time</h4>
                          {detail.predictions.map((d) => (
                            <div key={d.id} className="alloc-row">
                              <span>{d.ticker_symbol}</span>
                              <span>${d.current_price} → ${d.predicted_next_close}</span>
                              <span className={Number(d.predicted_change_pct) >= 0 ? 'positive' : 'negative'}>
                                {d.predicted_change_pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
