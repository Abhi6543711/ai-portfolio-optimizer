import { useState } from 'react'

export default function PortfolioForm({ onSubmit, loading }) {
  const [tickerInput, setTickerInput] = useState('AAPL, MSFT, GOOGL, AMZN, NVDA')
  const [period, setPeriod] = useState('2y')

  function handleSubmit(e) {
    e.preventDefault()
    const tickers = tickerInput
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
    onSubmit(tickers, period)
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit}>
      <label>
        Tickers (comma-separated)
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          placeholder="AAPL, MSFT, GOOGL"
        />
      </label>

      <label>
        Historical Period
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="5y">5 Years</option>
        </select>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Portfolio'}
      </button>
    </form>
  )
}
