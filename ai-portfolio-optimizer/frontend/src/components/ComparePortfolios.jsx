import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function ComparePortfolios({ saved }) {
  const [ids, setIds] = useState([])
  const [strategy, setStrategy] = useState('balanced')

  function toggle(id) {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  if (saved.length < 2)
    return <p className="muted">Save at least 2 portfolios to compare them.</p>

  const chosen = saved.filter((p) => ids.includes(p.id))
  const rows = chosen.map((p) => ({ p, s: p.result.strategies[strategy] }))
  const tickers = [...new Set(rows.flatMap(({ s }) => Object.keys(s.weights)))]
  const chartData = rows.map(({ p, s }) => ({
    name: p.portfolio_name,
    Return: +(s.expected_return * 100).toFixed(2),
    Volatility: +(s.volatility * 100).toFixed(2),
  }))

  return (
    <div>
      <div className="compare-controls">
        <label>
          Strategy
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>
        <p className="muted">Select 2–4 portfolios:</p>
      </div>

      <div className="compare-picks">
        {saved.map((p) => (
          <label key={p.id} className={ids.includes(p.id) ? 'pick on' : 'pick'}>
            <input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} />
            {p.portfolio_name}
          </label>
        ))}
      </div>

      {chosen.length >= 2 && (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Return" fill="#10b981" />
              <Bar dataKey="Volatility" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>

          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                {rows.map(({ p }) => <th key={p.id}>{p.portfolio_name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td>Expected return</td>{rows.map(({ p, s }) => <td key={p.id}>{(s.expected_return * 100).toFixed(2)}%</td>)}</tr>
              <tr><td>Volatility</td>{rows.map(({ p, s }) => <td key={p.id}>{(s.volatility * 100).toFixed(2)}%</td>)}</tr>
              <tr><td>Sharpe ratio</td>{rows.map(({ p, s }) => <td key={p.id}>{Number(s.sharpe_ratio).toFixed(2)}</td>)}</tr>
              <tr><td>Baseline risk</td>{rows.map(({ p }) => <td key={p.id}>{p.result.baseline.risk_score.score}/100</td>)}</tr>
              <tr className="divider"><td colSpan={rows.length + 1}>Allocation</td></tr>
              {tickers.map((t) => (
                <tr key={t}>
                  <td>{t}</td>
                  {rows.map(({ p, s }) => (
                    <td key={p.id}>{s.weights[t] ? `${(s.weights[t] * 100).toFixed(1)}%` : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
