import { useEffect, useState } from 'react'
import PortfolioForm from './components/PortfolioForm.jsx'
import ResultsDashboard from './components/ResultsDashboard.jsx'
import AllocationTable from './components/AllocationTable.jsx'
import SaveBar from './components/SaveBar.jsx'
import NewsPanel from './components/NewsPanel.jsx'
import SavedPortfolios from './components/SavedPortfolios.jsx'
import ComparePortfolios from './components/ComparePortfolios.jsx'
import Profile from './components/Profile.jsx'
import Login from './components/Login.jsx'
import { analyzePortfolio } from './services/api.js'
import { supabase } from './services/supabaseClient.js'

const TABS = ['Analyze', 'Saved', 'Compare', 'Profile']

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('Analyze')
  const [results, setResults] = useState(null)
  const [amount, setAmount] = useState(10000)
  const [period, setPeriod] = useState('2y')
  const [runId, setRunId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  async function loadSaved() {
    setSavedLoading(true)
    const { data } = await supabase
      .from('portfolios')
      .select('*')
      .not('result', 'is', null)
      .order('created_at', { ascending: false })
    setSaved(data || [])
    setSavedLoading(false)
  }

  useEffect(() => {
    if (userId) loadSaved()
  }, [userId])

  async function handleSubmit(tickers, selectedPeriod, investment) {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const data = await analyzePortfolio(tickers, selectedPeriod)
      setAmount(investment)
      setPeriod(selectedPeriod)
      setResults(data)
      setRunId((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    await supabase.from('portfolios').delete().eq('id', id)
    setSaved((prev) => prev.filter((p) => p.id !== id))
  }

  const displayName = session?.user?.user_metadata?.full_name

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Portfolio Optimizer</h1>
        <p>
          {displayName ? `Welcome, ${displayName}. ` : ''}
          Data-driven portfolio recommendations — for educational purposes only.
        </p>
      </header>

      {!session ? (
        <Login />
      ) : (
        <>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
                {t === 'Saved' ? `Saved (${saved.length})` : t}
              </button>
            ))}
          </nav>

          {tab === 'Analyze' && (
            <>
              <PortfolioForm onSubmit={handleSubmit} loading={loading} />
              {error && <div className="error-banner">{error}</div>}
              {results && (
                <>
                  <ResultsDashboard results={results} />
                  <AllocationTable result={results} amount={amount} />
                  <SaveBar
                    key={runId}
                    results={results}
                    amount={amount}
                    period={period}
                    userId={userId}
                    onSaved={loadSaved}
                  />
                  <NewsPanel tickers={results.tickers} />
                </>
              )}
            </>
          )}

          {tab === 'Saved' && (
            <SavedPortfolios saved={saved} loading={savedLoading} onDelete={handleDelete} />
          )}
          {tab === 'Compare' && <ComparePortfolios saved={saved} />}
          {tab === 'Profile' && (
            <Profile
              user={session.user}
              savedCount={saved.length}
              onSignOut={() => supabase.auth.signOut()}
            />
          )}
        </>
      )}

      <footer className="app-footer">
        Not financial advice. Historical performance does not guarantee future returns.
      </footer>
    </div>
  )
}
