import { useState }       from 'react'
import { useNavigate }    from 'react-router-dom'
import { useAuth }        from '../../context/AuthContext'
import AuthLayout         from '../templates/AuthLayout'
import Button             from '../atoms/Button'
import Input              from '../atoms/Input'
import PasswordInput      from '../atoms/PasswordInput'
import FormField          from '../molecules/FormField'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await login(email, password)
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/pedidos', { replace: true })
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" width="28" height="28">
              <circle cx="16" cy="13" r="9" fill="#f5c9a0" stroke="#c9956a" strokeWidth="1.2"/>
              <ellipse cx="7.2" cy="13.5" rx="1.8" ry="2.4" fill="#f5c9a0" stroke="#c9956a" strokeWidth="1"/>
              <ellipse cx="24.8" cy="13.5" rx="1.8" ry="2.4" fill="#f5c9a0" stroke="#c9956a" strokeWidth="1"/>
              <rect x="13.5" y="21.5" width="5" height="3.2" rx="1" fill="#f5c9a0" stroke="#c9956a" strokeWidth="1"/>
              <path d="M7 32 Q7 27 16 26.5 Q25 27 25 32Z" fill="white" fillOpacity="0.9"/>
              <circle cx="12.8" cy="13" r="1.1" fill="#3b2a1a"/>
              <circle cx="19.2" cy="13" r="1.1" fill="#3b2a1a"/>
              <path d="M13 17 Q16 19.5 19 17" stroke="#3b2a1a" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div>
            <div className="auth-logo__name">Albertini</div>
            <div className="auth-logo__sub">Gestión de pedidos</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && <div className="error-banner">{error}</div>}

          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </FormField>

          <Button type="submit" loading={loading} full style={{ marginTop: 'var(--space-2)' }}>
            Ingresar
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
