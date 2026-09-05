import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899']

const STRATEGY_LABELS = {
  conservative: 'Conservative (Min Risk)',
  balanced: 'Balanced (Max Sharpe)',
  aggressive: 'Aggressive (Max Return)',
}

function AllocationPie({ weights }) {
  const data = Object.entries(weights).map(([ticker, weight]) => ({
    name: ticker,
    value: Math.round(weight * 10000) / 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function StrategyCard({ name, data }) {
  return (
    <div className="strategy-card">
      <h3>{STRATEGY_LABELS[name] || name}</h3>
      <div className="metrics-row">
        <Metric label="Expected Return" value={`${(data.expected_return * 100).toFixed(2)}%`} />
        <Metric label="Volatility" value={`${(data.volatility * 100).toFixed(2)}%`} />
        <Metric label="Sharpe Ratio" value={data.sharpe_ratio.toFixed(2)} />
      </div>
      <AllocationPie weights={data.weights} />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  )
}

function PredictionsTable({ predictions }) {
  const rows = Object.entries(predictions)
  return (
    <div className="predictions-table">
      <h3>Market Trend Predictions (Next Close)</h3>
      <table>
        <thead>
          <tr>
            <th>Ticker</th><th>Current</th><th>Predicted</th><th>Change</th><th>R² (RF)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([ticker, p]) => (
            <tr key={ticker}>
              <td>{ticker}</td>
              {p.error ? (
                <td colSpan={4}>{p.error}</td>
              ) : (
                <>
                  <td>${p.current_price}</td>
                  <td>${p.predicted_next_close}</td>
                  <td className={p.predicted_change_pct >= 0 ? 'positive' : 'negative'}>
                    {p.predicted_change_pct}%
                  </td>
                  <td>{p.model_performance.random_forest.r2}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ResultsDashboard({ results }) {
  const { baseline, strategies, predictions } = results

  const riskBarData = [{
    name: 'Equal-Weight Baseline',
    Return: +(baseline.metrics.expected_return * 100).toFixed(2),
    Volatility: +(baseline.metrics.volatility * 100).toFixed(2),
  }, ...Object.entries(strategies).map(([name, d]) => ({
    name: STRATEGY_LABELS[name] || name,
    Return: +(d.expected_return * 100).toFixed(2),
    Volatility: +(d.volatility * 100).toFixed(2),
  }))]

  return (
    <div className="results-dashboard">
      <section className="baseline-summary">
        <h2>Portfolio Risk Score</h2>
        <div className={`risk-score risk-${baseline.risk_score.level.toLowerCase()}`}>
          {baseline.risk_score.score}/100 — {baseline.risk_score.level} Risk
        </div>
      </section>

      <section>
        <h2>Return vs. Risk Comparison</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={riskBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="Return" fill="#10b981" />
            <Bar dataKey="Volatility" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="strategies-grid">
        <h2>Recommended Portfolio Strategies</h2>
        <div className="strategy-cards">
          {Object.entries(strategies).map(([name, data]) => (
            <StrategyCard key={name} name={name} data={data} />
          ))}
        </div>
      </section>

      <section>
        <PredictionsTable predictions={predictions} />
      </section>
    </div>
  )
}
