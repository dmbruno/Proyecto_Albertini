import { Link }    from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__brand-icon" aria-hidden="true">
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
        <span>Albertini</span>
      </div>

      <div className="header__spacer" />

      <div className="header__user">
        <span className="header__email">{user?.email}</span>
        <Link to="/admin" className="header__admin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="header__admin-label">Panel admin</span>
        </Link>
        <button className="header__logout" onClick={logout} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </header>
  )
}
