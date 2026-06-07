import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: '', success: '' })

    try {
      const { data } = await api.post('/api/auth/register', formData)
      signIn({ nextUser: data.user, nextToken: data.token })
      setStatus({ loading: false, error: '', success: 'Account created. Redirecting...' })
      navigate('/dashboard')
    } catch (error) {
      setStatus({
        loading: false,
        error: error.response?.data?.message || 'Unable to create account right now',
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
            <h1>Start with a clean account</h1>
            <p>Create your account now so the rest of the project can build on a stable auth foundation.</p>
            <div className="hero-points">
              <div className="hero-point">
                <strong>Simple signup</strong>
                <span>Name, email, and password are ready against the backend.</span>
              </div>
              <div className="hero-point">
                <strong>Secure flow</strong>
                <span>Password hashing and token issuance are handled server-side.</span>
              </div>
              <div className="hero-point">
                <strong>Future-ready</strong>
                <span>Routing and shared auth state support the later note modules.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-panel">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Create account</h2>
            <p>Enter your details to get started.</p>

            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
              </label>

              <label className="field">
                <span>Email</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
              </label>

              <label className="field">
                <span>Password</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
              </label>

              <button className="primary-button" type="submit" disabled={status.loading}>
                {status.loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            {status.error ? <div className="error-banner">{status.error}</div> : null}
            {status.success ? <div className="success-banner">{status.success}</div> : null}

            <p className="form-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default RegisterPage