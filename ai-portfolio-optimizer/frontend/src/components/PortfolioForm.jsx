import { useState } from 'react'

const ASSETS = [
  ['AAPL', 'Apple'], ['MSFT', 'Microsoft'], ['GOOGL', 'Alphabet (Google)'],
  ['AMZN', 'Amazon'], ['NVDA', 'NVIDIA'], ['META', 'Meta Platforms'],
  ['TSLA', 'Tesla'], ['NFLX', 'Netflix'], ['AMD', 'AMD'], ['INTC', 'Intel'],
  ['ORCL', 'Oracle'], ['CRM', 'Salesforce'], ['ADBE', 'Adobe'],
  ['JPM', 'JPMorgan Chase'], ['BAC', 'Bank of America'], ['GS', 'Goldman Sachs'],
  ['V', 'Visa'], ['MA', 'Mastercard'], ['PYPL', 'PayPal'],
  ['JNJ', 'Johnson & Johnson'], ['PFE', 'Pfizer'], ['UNH', 'UnitedHealth'],
  ['LLY', 'Eli Lilly'], ['WMT', 'Walmart'], ['COST', 'Costco'],
  ['KO', 'Coca-Cola'], ['PEP', 'PepsiCo'], ['MCD', "McDonald's"],
  ['NKE', 'Nike'], ['DIS', 'Disney'], ['XOM', 'Exxon Mobil'],
  ['CVX', 'Chevron'], ['BA', 'Boeing'], ['CAT', 'Caterpillar'],
  ['SPY', 'S&P 500 ETF'], ['QQQ', 'Nasdaq 100 ETF'], ['VTI', 'Total US Market ETF'],
  ['GLD', 'Gold ETF'], ['TLT', 'US Treasury Bond ETF'],
]

const DEFAULTS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM']
const COUNTS = [2, 3, 4, 5, 6, 7, 8]

export default function PortfolioForm({ onSubmit, loading }) {
  const [count, setCount] = useState(5)
  const [selected, setSelected] = useState(DEFAULTS.slice(0, 5))
  const [period, setPeriod] = useState('2y')
  const [amount, setAmount] = useState(10000)

  function handleCountChange(e) {
    const n = Number(e.target.value)
    setCount(n)
    setSelected((prev) => {
      if (n <= prev.length) return prev.slice(0, n)
      const next = [...prev]
      for (const [symbol] of ASSETS) {
        if (next.length >= n) break
        if (!next.includes(symbol)) next.push(symbol)
      }
      return next
    })
  }

  function handleAssetChange(index, symbol) {
    setSelected((prev) => prev.map((s, i) => (i === index ? symbol : s)))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(selected, period, Number(amount))
  }

  return (
    <form className="portfolio-form" onSubmit={handleSubmit}>
      <label>
        Number of assets to compare
        <select value={count} onChange={handleCountChange}>
          {COUNTS.map((n) => (
            <option key={n} value={n}>{n} assets</option>
          ))}
        </select>
      </label>

      <label>
        Historical Period
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="1y">1 Year</option>
          <option value="2y">2 Years</option>
          <option value="5y">5 Years</option>
        </select>
      </label>

      <label>
        Investment amount ($)
        <input
          type="number"
          min="100"
          step="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>

      <div className="asset-grid">
        {selected.map((symbol, i) => (
          <label key={i}>
            Asset {i + 1}
            <select value={symbol} onChange={(e) => handleAssetChange(i, e.target.value)}>
              {ASSETS.map(([sym, name]) => (
                <option
                  key={sym}
                  value={sym}
                  disabled={selected.includes(sym) && sym !== symbol}
                >
                  {sym} — {name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Portfolio'}
      </button>
    </form>
  )
}
