const STRAT = {
  conservative: 'Conservative (Min Risk)',
  balanced: 'Balanced (Max Sharpe)',
  aggressive: 'Aggressive (Max Return)',
}
const pct = (v) => (Number(v) * 100).toFixed(2) + '%'
export const money = (v) =>
  '$' + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function allocationRows(strategy, prices, amount) {
  return Object.entries(strategy.weights)
    .sort((a, b) => b[1] - a[1])
    .map(([ticker, weight]) => {
      const dollars = weight * amount
      const price = prices?.[ticker]
      const shares = price ? Math.floor(dollars / price) : null
      return { ticker, weight, dollars, price, shares }
    })
}

export function buildReportHtml({ name, createdAt, amount, period, result }) {
  const date = new Date(createdAt || Date.now()).toLocaleDateString()
  const base = result.baseline

  const strategies = Object.entries(result.strategies)
    .map(([key, s]) => {
      const rows = allocationRows(s, result.latest_prices, amount)
        .map(
          (r) =>
            `<tr><td>${esc(r.ticker)}</td><td>${(r.weight * 100).toFixed(1)}%</td><td>${money(r.dollars)}</td><td>${r.shares ?? '-'}</td></tr>`
        )
        .join('')
      return `<section><h2>${STRAT[key] || key}</h2>
<p>Expected return <b>${pct(s.expected_return)}</b> &middot; Volatility <b>${pct(s.volatility)}</b> &middot; Sharpe <b>${Number(s.sharpe_ratio).toFixed(2)}</b></p>
<table><tr><th>Asset</th><th>Weight</th><th>Amount</th><th>Shares</th></tr>${rows}</table></section>`
    })
    .join('')

  const preds = Object.entries(result.predictions || {})
    .filter(([, p]) => !p.error)
    .map(
      ([t, p]) =>
        `<tr><td>${esc(t)}</td><td>$${p.current_price}</td><td>$${p.predicted_next_close}</td><td>${p.predicted_change_pct}%</td></tr>`
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;max-width:760px;margin:30px auto;padding:0 20px;color:#1a1d2e}
h1{margin-bottom:4px}h2{margin-top:28px;border-bottom:2px solid #4f46e5;padding-bottom:4px}
.meta{color:#666;font-size:14px}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;font-size:14px}
th{background:#f3f4f9}
.note{margin-top:30px;font-size:12px;color:#777}
</style></head><body>
<h1>${esc(name)}</h1>
<p class="meta">Created ${date} &middot; Assets: ${result.tickers.map(esc).join(', ')} &middot; History: ${esc(period || '-')} &middot; Investment: ${money(amount)}</p>
<p>Equal-weight baseline risk: <b>${base.risk_score.score}/100 (${base.risk_score.level})</b>. Risk-free rate used: ${pct(result.risk_free_rate ?? 0.03)}.</p>
${strategies}
<h2>Next-day price predictions</h2>
<table><tr><th>Asset</th><th>Current</th><th>Predicted</th><th>Change</th></tr>${preds}</table>
<p class="note">Educational project only. Not financial advice. Historical performance does not guarantee future returns; ML predictions can be significantly wrong.</p>
</body></html>`
}

export function downloadReport(data) {
  const html = buildReportHtml(data)
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (data.name || 'portfolio').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.html'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function printReport(data) {
  const w = window.open('', '_blank')
  if (!w) return alert('Allow pop-ups to print or save as PDF')
  w.document.write(buildReportHtml(data))
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}
