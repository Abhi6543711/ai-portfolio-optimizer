import { useState } from 'react'
import { supabase } from '../services/supabaseClient.js'
import { downloadReport, printReport } from '../utils/report.js'

export default function SaveBar({ results, amount, period, userId, onSaved }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState(null)

  const finalName = name.trim() || `Portfolio ${new Date().toLocaleDateString()}`
  const reportData = { name: finalName, amount, period, result: results }

  async function handleSave() {
    setStatus('saving')
    const b = results.strategies.balanced
    const { error } = await supabase.from('portfolios').insert({
      user_id: userId,
      portfolio_name: finalName,
      strategy: 'all',
      expected_return: b.expected_return,
      volatility: b.volatility,
      sharpe_ratio: b.sharpe_ratio,
      risk_score: results.baseline.risk_score.score,
      risk_level: results.baseline.risk_score.level,
      tickers: results.tickers,
      investment_amount: amount,
      period,
      result: results,
    })
    if (error) {
      setStatus(error.message)
    } else {
      setStatus('saved')
      onSaved()
    }
  }

  return (
    <section className="save-bar">
      <input
        type="text"
        placeholder="Portfolio name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={status === 'saved'}
      />
      <button onClick={handleSave} disabled={status === 'saving' || status === 'saved'}>
        {status === 'saved' ? 'Saved ✓' : status === 'saving' ? 'Saving...' : 'Save Portfolio'}
      </button>
      <button className="secondary" onClick={() => downloadReport(reportData)}>
        Download Report
      </button>
      <button className="secondary" onClick={() => printReport(reportData)}>
        Print / PDF
      </button>
      {status && !['saving', 'saved'].includes(status) && (
        <span className="negative">{status}</span>
      )}
    </section>
  )
}
