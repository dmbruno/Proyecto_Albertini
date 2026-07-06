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
          <img src="/logo.png" alt="Albertini Representaciones" className="auth-logo__img" />
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
