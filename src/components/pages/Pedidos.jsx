import { useState }     from 'react'
import { Link }         from 'react-router-dom'
import AppLayout        from '../templates/AppLayout'
import Badge            from '../atoms/Badge'
import Button           from '../atoms/Button'
import Spinner          from '../atoms/Spinner'
import ConfirmDialog    from '../molecules/ConfirmDialog'
import { usePedidos }   from '../../hooks/usePedidos'
import { useToast }     from '../../context/ToastContext'

const FILTROS = [
  { id: 'todos',    label: 'Todos'     },
  { id: 'borrador', label: 'Borrador'  },
  { id: 'enviado',  label: 'Enviado'   },
]

function fmtFecha(str) {
  if (!str) return ''
  return new Date(str + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function clientesUnicos(pedido) {
  const seen = new Set()
  const nombres = []
  for (const item of (pedido.pedido_items ?? [])) {
    if (!seen.has(item.cliente_id)) {
      seen.add(item.cliente_id)
      const nombre = item.clientes?.razon_social
      if (nombre) nombres.push(nombre)
    }
  }
  return nombres
}

export default function Pedidos() {
  const { pedidos, loading, error, eliminar } = usePedidos()
  const { addToast } = useToast()

  const [filtro,    setFiltro]    = useState('todos')
  const [confirmar, setConfirmar] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const lista = pedidos.filter(p => filtro === 'todos' || p.estado === filtro)

  const handleEliminar = async () => {
    setDeleting(true)
    const { error } = await eliminar(confirmar.id)
    if (error) { addToast('Error al eliminar: ' + error.message, 'error') }
    else       { addToast('Pedido eliminado.') }
    setDeleting(false)
    setConfirmar(null)
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">{pedidos.length} pedidos en total</p>
        </div>
        <Link to="/pedidos/nuevo">
          <Button variant="primary" size="md">+ Nuevo pedido</Button>
        </Link>
      </div>

      <div className="filter-tabs">
        {FILTROS.map(f => (
          <button
            key={f.id}
            className={`filter-tab${filtro === f.id ? ' filter-tab--active' : ''}`}
            onClick={() => setFiltro(f.id)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">Error al cargar pedidos: {error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : lista.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <p className="empty-state__title">Sin pedidos</p>
          <p className="empty-state__desc">
            {filtro === 'todos'
              ? 'Todavía no hay pedidos cargados.'
              : `No hay pedidos en estado "${filtro}".`}
          </p>
          <Link to="/pedidos/nuevo">
            <Button>+ Nuevo pedido</Button>
          </Link>
        </div>
      ) : (
        <div className="list">
          {lista.map(pedido => {
            const clientes = clientesUnicos(pedido)
            return (
              <div key={pedido.id} className="list-item">
                <div className="list-item__body">
                  <p className="list-item__title">
                    Pedido del {fmtFecha(pedido.fecha)}
                    &nbsp; <Badge variant={pedido.estado}>{pedido.estado}</Badge>
                  </p>
                  <p className="list-item__meta">
                    {clientes.length === 0
                      ? 'Sin clientes'
                      : clientes.length === 1
                        ? clientes[0]
                        : `${clientes[0]} y ${clientes.length - 1} más`}
                    {' · '}{(pedido.pedido_items ?? []).length} líneas
                  </p>
                </div>
                <div className="list-item__actions">
                  <Link to={`/pedidos/${pedido.id}`}>
                    <Button variant="secondary" size="sm">Ver</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmar(pedido)}
                    title="Eliminar pedido"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmar && (
        <ConfirmDialog
          title="Eliminar pedido"
          message={`¿Eliminás el pedido del ${fmtFecha(confirmar.fecha)}? Esta acción no se puede deshacer.`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmar(null)}
          loading={deleting}
        />
      )}
    </AppLayout>
  )
}
