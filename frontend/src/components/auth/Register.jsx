import { useState } from 'react'
import { Eye, EyeOff, IdCard, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { registerUser } from '../../services/authService.js'
import './auth.css'

const initialFormState = {
  fullName: '',
  email: '',
  employeeId: '',
  password: '',
  confirmPassword: '',
  role: 'Employee',
}

const roleOptions = ['Admin', 'Manager', 'Employee']

function Register() {
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const validateForm = (values) => {
    const nextErrors = {}

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Full Name is required.'
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email Address is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!values.employeeId.trim()) {
      nextErrors.employeeId = 'Employee ID is required.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    if (!values.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentState) => ({
      ...currentState,
      [name]: value,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateForm(formData)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setMessage('Please correct the highlighted fields to continue.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await registerUser(formData)
      setMessage('Account creation request captured. Backend integration can be connected next.')
      setFormData(initialFormState)
    } catch (error) {
      setMessage(error.message || 'Unable to create account right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="auth-brand__eyebrow">AssetFlow</p>
            <h1>Enterprise Asset &amp; Resource Management System</h1>
          </div>
        </div>

        <div className="auth-copy">
          <p>Manage assets, bookings, maintenance and audits from a single platform.</p>
        </div>

        <div className="auth-highlights" aria-hidden="true">
          <div className="auth-highlight">Secure onboarding</div>
          <div className="auth-highlight">Role-based access</div>
          <div className="auth-highlight">Enterprise visibility</div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <p className="auth-card__eyebrow">Create account</p>
            <h2>Create Account</h2>
            <p className="auth-card__text">
              Join AssetFlow Enterprise Asset &amp; Resource Management System
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field-group">
              <span>Full Name</span>
              <div className={`auth-field-input ${errors.fullName ? 'auth-field-input--error' : ''}`}>
                <UserRound size={17} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  aria-invalid={Boolean(errors.fullName)}
                />
              </div>
              {errors.fullName && <small className="auth-field-error">{errors.fullName}</small>}
            </label>

            <label className="auth-field-group">
              <span>Email Address</span>
              <div className={`auth-field-input ${errors.email ? 'auth-field-input--error' : ''}`}>
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
              {errors.email && <small className="auth-field-error">{errors.email}</small>}
            </label>

            <label className="auth-field-group">
              <span>Employee ID</span>
              <div className={`auth-field-input ${errors.employeeId ? 'auth-field-input--error' : ''}`}>
                <IdCard size={17} />
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Enter employee ID"
                  aria-invalid={Boolean(errors.employeeId)}
                />
              </div>
              {errors.employeeId && <small className="auth-field-error">{errors.employeeId}</small>}
            </label>

            <label className="auth-field-group">
              <span>Password</span>
              <div className={`auth-field-input ${errors.password ? 'auth-field-input--error' : ''}`}>
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <small className="auth-field-error">{errors.password}</small>}
            </label>

            <label className="auth-field-group">
              <span>Confirm Password</span>
              <div className={`auth-field-input ${errors.confirmPassword ? 'auth-field-input--error' : ''}`}>
                <LockKeyhole size={17} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <small className="auth-field-error">{errors.confirmPassword}</small>}
            </label>

            <label className="auth-field-group">
              <span>Role</span>
              <div className="auth-field-input">
                <select name="role" value={formData.role} onChange={handleChange}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <button className="auth-submit-button" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {message && <p className="auth-form-message">{message}</p>}
          </form>
        </div>

        <p className="auth-footer">© 2026 AssetFlow ERP</p>
      </section>
    </main>
  )
}

export default Register
