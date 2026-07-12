import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import './Login.css'

const initialFormState = {
  email: '',
  password: '',
  remember: true,
}

function Login() {
  const [formData, setFormData] = useState(initialFormState)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const validateForm = (values) => {
    const nextErrors = {}

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid business email.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setFormData((currentState) => ({
      ...currentState,
      [name]: nextValue,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validateForm(formData)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setMessage('Please correct the highlighted fields and try again.')
      return
    }

    setMessage('Sign-in successful. Redirecting to the ERP dashboard...')
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="login-brand">
          <div className="login-brand__icon">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="login-brand__eyebrow">AssetFlow</p>
            <h1>Enterprise Asset &amp; Resource Management System</h1>
          </div>
        </div>

        <div className="login-copy">
          <p>
            Manage assets, bookings, maintenance and audits from a single platform.
          </p>
        </div>

        <div className="login-highlights" aria-hidden="true">
          <div className="login-highlight">Live resource visibility</div>
          <div className="login-highlight">Operations audit control</div>
          <div className="login-highlight">Smart maintenance planning</div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__header">
            <p className="login-card__eyebrow">Secure sign in</p>
            <h2>Welcome back</h2>
            <p className="login-card__text">Sign in to access your AssetFlow workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field-group">
              <span>Email</span>
              <div className={`field-input ${errors.email ? 'field-input--error' : ''}`}>
                <Mail size={17} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@assetflow.com"
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            <label className="field-group">
              <span>Password</span>
              <div className={`field-input ${errors.password ? 'field-input--error' : ''}`}>
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            <div className="login-meta">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span>Remember Me</span>
              </label>
              <a href="#" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <button className="signin-button" type="submit">
              Sign In
            </button>

            <p className="register-link-row">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="register-link">
                Create Account
              </Link>
            </p>

            {message && <p className="form-message">{message}</p>}
          </form>
        </div>

        <p className="login-footer">© 2026 AssetFlow ERP</p>
      </section>
    </main>
  )
}

export default Login
