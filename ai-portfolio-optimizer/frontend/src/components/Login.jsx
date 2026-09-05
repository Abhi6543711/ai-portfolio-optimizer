import { useState } from 'react'
import { supabase } from '../services/supabaseClient.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const fn = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })

    const { error } = await fn
    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then sign in.')
    }
  }

  return (
    <div className="auth-box">
      <h2>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      {error && <p className="error-banner">{error}</p>}
      {info && <p className="info-banner">{info}</p>}

      <button
        className="link-button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
      </button>
    </div>
  )
}
