import { useEffect, useState } from 'react'
import PortfolioForm from './components/PortfolioForm.jsx'
import ResultsDashboard from './components/ResultsDashboard.jsx'
import Login from './components/Login.jsx'
import History from './components/History.jsx'
import { analyzePortfolio } from './services/api.js'
import { supabase } from './services/supabaseClient.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(tickers, period) {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const userId = session?.user?.id || null
      const data = await analyzePortfolio(tickers, period, userId)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>AI Portfolio Optimizer</h1>
            <p>Data-driven portfolio recommendations — for educational purposes only.</p>
          </div>
          {session && (
            <button className="signout-btn" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          )}
        </div>
      </header>

      {!session ? (
        <Login />
      ) : (
        <>
          <PortfolioForm onSubmit={handleSubmit} loading={loading} />
          {error && <div className="error-banner">{error}</div>}
          {results && <ResultsDashboard results={results} />}
          <History userId={session.user.id} />
        </>
      )}

      <footer className="app-footer">
        Not financial advice. Historical performance does not guarantee future returns.
      </footer>
    </div>
  )
}
