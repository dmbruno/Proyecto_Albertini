import { Link, useLocation } from 'react-router-dom'

const LINKS = [
  {
    to: '/pedidos',
    label: 'Pedidos',
    shortLabel: 'Pedidos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    to: '/pedidos/nuevo',
    label: 'Nuevo pedido',
    shortLabel: 'Nuevo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8"  y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/clientes',
    label: 'Clientes',
    shortLabel: 'Clientes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/lista-precios',
    label: 'Lista de Precios',
    shortLabel: 'Precios',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="16.5" y1="9.4"  x2="7.5"  y2="4.21"/>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/estadisticas',
    label: 'Estadísticas',
    shortLabel: 'Stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
  },
]

function useActiveLink() {
  const { pathname } = useLocation()
  return (to) => {
    if (to === '/pedidos') {
      // activo en /pedidos y sub-rutas, EXCEPTO /pedidos/nuevo
      return pathname.startsWith('/pedidos') && !pathname.startsWith('/pedidos/nuevo')
    }
    if (to === '/pedidos/nuevo') {
      return pathname === '/pedidos/nuevo'
    }
    return pathname.startsWith(to)
  }
}

export default function NavMenu() {
  const isActive = useActiveLink()

  return (
    <>
      {/* Sidebar — desktop */}
      <nav className="sidebar" aria-label="Navegación principal">
        <ul className="sidebar__nav">
          {LINKS.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`sidebar__link${isActive(link.to) ? ' sidebar__link--active' : ''}`}
              >
                <span className="sidebar__link-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav — mobile */}
      <nav className="bottom-nav" aria-label="Navegación">
        {LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`bottom-nav__item${isActive(link.to) ? ' bottom-nav__item--active' : ''}`}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{link.icon}</span>
            <span>{link.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
