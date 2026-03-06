import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ open, onClose }) {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setTab('signin')
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      if (tab === 'signin') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onClose()
        }
      } else {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess(true)
        }
      }
    } catch (err) {
      console.error('[AuthModal] handleSubmit failed:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(6,13,26,0.95)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-sm rounded-xl p-8"
        style={{ background: '#111318', border: '1px solid #22262f' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-charcoal-400 hover:text-slate-200 transition-colors font-mono text-sm leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-[#22262f]">
          <button
            onClick={() => { setTab('signin'); setError(null); setSuccess(false) }}
            className="font-mono text-[10px] tracking-widest uppercase pb-3 pr-4 transition-colors"
            style={{
              color: tab === 'signin' ? '#00ff88' : '#4a5568',
              borderBottom: tab === 'signin' ? '2px solid #00ff88' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); setSuccess(false) }}
            className="font-mono text-[10px] tracking-widest uppercase pb-3 px-4 transition-colors"
            style={{
              color: tab === 'signup' ? '#00ff88' : '#4a5568',
              borderBottom: tab === 'signup' ? '2px solid #00ff88' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            Sign Up
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <p className="font-mono text-sm text-[#00ff88]">Check your email to confirm your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-charcoal-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg p-3 text-sm text-slate-200 font-sans focus:outline-none transition-colors"
                style={{
                  background: '#060d1a',
                  border: '1px solid #22262f',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00ff88' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#22262f' }}
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-charcoal-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg p-3 text-sm text-slate-200 font-sans focus:outline-none transition-colors"
                style={{
                  background: '#060d1a',
                  border: '1px solid #22262f',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00ff88' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#22262f' }}
              />
            </div>

            {error && (
              <p className="text-sm text-[#ff3d5a] mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-mono text-xs tracking-widest uppercase transition-colors"
              style={{
                background: 'transparent',
                border: '2px solid #00ff88',
                color: '#00ff88',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(0,255,136,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {loading ? '...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
