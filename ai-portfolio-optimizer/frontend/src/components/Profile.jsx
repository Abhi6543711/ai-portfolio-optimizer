import { useState } from 'react'
import { supabase } from '../services/supabaseClient.js'

export default function Profile({ user, savedCount, onSignOut }) {
  const [name, setName] = useState(user.user_metadata?.full_name || '')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)

  async function saveName() {
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setMsg(error ? error.message : 'Name updated')
  }

  async function changePassword() {
    if (password.length < 6) return setMsg('Password must be at least 6 characters')
    const { error } = await supabase.auth.updateUser({ password })
    setMsg(error ? error.message : 'Password changed')
    if (!error) setPassword('')
  }

  return (
    <div className="profile-box">
      <h2>Profile</h2>
      <div className="profile-stats">
        <div><span className="metric-value">{savedCount}</span><span className="metric-label">Saved portfolios</span></div>
        <div><span className="metric-value">{new Date(user.created_at).toLocaleDateString()}</span><span className="metric-label">Member since</span></div>
      </div>

      <label>Email<input type="text" value={user.email} disabled /></label>

      <label>
        Display name
        <div className="inline-row">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <button onClick={saveName}>Save</button>
        </div>
      </label>

      <label>
        New password
        <div className="inline-row">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
          <button onClick={changePassword}>Change</button>
        </div>
      </label>

      {msg && <p className="info-banner">{msg}</p>}
      <button className="signout-btn" onClick={onSignOut}>Sign Out</button>
    </div>
  )
}
