import { useState } from 'react'
import { allocationRows, money } from '../utils/report.js'

const LABELS = { conservative: 'Conservative', balanced: 'Balanced', aggressive: 'Aggressive' }

export default function AllocationTable({ result, amount, title = 'Your Investment Plan' }) {
  const [key, setKey] = useState('balanced')
  const rows = allocationRows(result.strategies[key], result.latest_prices, amount)
  const invested = rows.reduce((t, r) => t + (r.shares && r.price ? r.shares * r.price : 0), 0)
  const hasPrices = !!result.latest_prices

  return (
    <section className="alloc-section">
      <h2>{title} — {money(amount)}</h2>
      <div className="tabs small">
        {Object.keys(LABELS).map((k) => (
          <button key={k} className={k === key ? 'active' : ''} onClick={() => setKey(k)}>
            {LABELS[k]}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Asset</th><th>Weight</th><th>Amount</th><th>Price</th><th>Shares</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ticker}>
              <td>{r.ticker}</td>
              <td>{(r.weight * 100).toFixed(1)}%</td>
              <td>{money(r.dollars)}</td>
              <td>{r.price ? `$${r.price}` : '-'}</td>
              <td>{r.shares ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasPrices && (
        <p className="muted">Whole shares only. Uninvested cash: {money(amount - invested)}</p>
      )}
    </section>
  )
}
