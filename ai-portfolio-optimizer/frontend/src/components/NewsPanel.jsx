import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function NewsPanel({ tickers }) {
  const [news, setNews] = useState(null)
  const key = tickers.join(',')

  useEffect(() => {
    setNews(null)
    fetch(`${API_BASE_URL}/api/news?tickers=${key}`)
      .then((r) => r.json())
      .then((d) => setNews(d.news || {}))
      .catch(() => setNews({}))
  }, [key])

  if (!news) return null
  const entries = Object.entries(news).filter(([, items]) => items.length)
  if (!entries.length) return null

  return (
    <section className="news-panel">
      <h2>Latest News</h2>
      <div className="news-grid">
        {entries.map(([symbol, items]) => (
          <div key={symbol} className="news-card">
            <h3>{symbol}</h3>
            {items.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer">
                {n.headline}
                <span>
                  {n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
