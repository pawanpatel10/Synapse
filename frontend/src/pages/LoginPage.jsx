import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const LoginPage = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    try {
      const { data } = await api.post('/api/auth/login', formData)
      signIn({ nextUser: data.user, nextToken: data.token })
      setStatus({ loading: false, error: '', success: 'Login successful. Redirecting...' })
      navigate('/dashboard')
    } catch (error) {
      setStatus({
        loading: false,
        error: error.response?.data?.message || 'Unable to log in right now',
        success: '',
      })
    }
  }

  return (
    <main className="app-shell auth-shell">
      <section className="auth-card auth-layout">
        <div className="auth-panel">
          <div className="brand">
            <span className="brand-mark" />
            <div>Synapse</div>
          </div>
          <div className="hero-copy">
            <h1>Build your study workspace</h1>
            <p>Sign in to manage notes, track progress, and prepare the dashboard for collaboration and advanced features.</p>
          </div>
        </div>

        <div className="form-panel">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Welcome back</h2>
            <p>Use your Synapse account to continue.</p>

            <div className="field-grid">
              <label className="field">
                <span>Email</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
              </label>

              <label className="field">
                <span>Password</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
              </label>

              <button className="primary-button" type="submit" disabled={status.loading}>
                {status.loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {status.error ? <div className="error-banner">{status.error}</div> : null}
            {status.success ? <div className="success-banner">{status.success}</div> : null}

            <p className="form-footer">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
