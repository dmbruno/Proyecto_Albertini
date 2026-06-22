import { useState }     from 'react'
import AppLayout        from '../templates/AppLayout'
import Button           from '../atoms/Button'
import Badge            from '../atoms/Badge'
import Spinner          from '../atoms/Spinner'
import SearchBar        from '../molecules/SearchBar'
import ConfirmDialog    from '../molecules/ConfirmDialog'
import ProductoForm     from '../organisms/ProductoForm'
import { useProductos } from '../../hooks/useProductos'
import { useToast }     from '../../context/ToastContext'

const FILTROS = [
  { id: 'todos',    label: 'Todos'    },
  { id: 'activo',   label: 'Activos'  },
  { id: 'inactivo', label: 'Inactivos'},
]

function normalize(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function fmtPrecio(n) {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })
}

export default function Productos() {
  const { productos, loading, error, crear, actualizar, toggleActivo, eliminar } = useProductos()
  const { addToast } = useToast()

  const [filtro,    setFiltro]    = useState('todos')
  const [query,     setQuery]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const filtered = productos.filter(p => {
    const matchFiltro =
      filtro === 'todos'  ||
      (filtro === 'activo'   &&  p.activo) ||
      (filtro === 'inactivo' && !p.activo)
    const q = normalize(query)
    const matchQuery = !q || normalize(p.nombre).includes(q)
    return matchFiltro && matchQuery
  })

  const handleSave = async (form) => {
    let result
    if (editing?.id) {
      result = await actualizar(editing.id, form)
    } else {
      result = await crear(form)
    }
    if (!result.error) {
      addToast(editing?.id ? 'Producto actualizado.' : 'Producto creado correctamente.')
      setModalOpen(false)
      setEditing(null)
    }
    return result
  }

  const handleToggle = async (p) => {
    const nuevoEstado = !p.activo
    const { error } = await toggleActivo(p.id, nuevoEstado)
    if (error) { addToast('Error: ' + error.message, 'error') }
    else       { addToast(nuevoEstado ? 'Producto activado.' : 'Producto desactivado.') }
  }

  const handleEliminar = async () => {
    setDeleting(true)
    const { error } = await eliminar(confirmar.id)
    if (error) { addToast(error.message, 'error') }
    else       { addToast('Producto eliminado.') }
    setDeleting(false)
    setConfirmar(null)
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{productos.filter(p => p.activo).length} activos · {productos.length} total</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>+ Nuevo producto</Button>
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

      <SearchBar
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar producto…"
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">Sin productos</p>
          <p className="empty-state__desc">
            {query ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos en este filtro.'}
          </p>
          {!query && filtro === 'todos' && <Button onClick={() => { setEditing(null); setModalOpen(true) }}>+ Nuevo producto</Button>}
        </div>
      ) : (
        <div className="list">
          {filtered.map(p => (
            <div key={p.id} className="list-item">
              <div className="list-item__body">
                <p className="list-item__title">
                  {p.nombre}
                  &nbsp; <Badge variant={p.activo ? 'activo' : 'inactivo'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                </p>
                <p className="list-item__meta">
                  Final: {fmtPrecio(p.precio_final)}
                  {p.precio_sin_iva != null && ` · Sin IVA: ${fmtPrecio(p.precio_sin_iva)}`}
                  {p.un_pallet > 0 && ` · Pallet: ${p.un_pallet} u`}
                  {p.un_caja   > 0 && ` · Caja: ${p.un_caja} u`}
                </p>
              </div>
              <div className="list-item__actions">
                <Button variant="secondary" size="sm" onClick={() => { setEditing(p); setModalOpen(true) }}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(p)}
                  title={p.activo ? 'Desactivar' : 'Activar'}
                  style={{ color: p.activo ? 'var(--color-warning)' : 'var(--color-success)' }}
                >
                  {p.activo ? 'Desactivar' : 'Activar'}
                </Button>
                {!p.activo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmar(p)}
                    title="Eliminar producto"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductoForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}

      {confirmar && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Eliminás "${confirmar.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmar(null)}
          loading={deleting}
        />
      )}
    </AppLayout>
  )
}
