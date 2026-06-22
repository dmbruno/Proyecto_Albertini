import { useState }       from 'react'
import AppLayout          from '../templates/AppLayout'
import Button             from '../atoms/Button'
import Spinner            from '../atoms/Spinner'
import SearchBar          from '../molecules/SearchBar'
import ConfirmDialog      from '../molecules/ConfirmDialog'
import ClienteForm        from '../organisms/ClienteForm'
import { useClientes }    from '../../hooks/useClientes'
import { useToast }       from '../../context/ToastContext'

function normalize(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function Clientes() {
  const { clientes, loading, error, crear, actualizar, eliminar } = useClientes()
  const { addToast } = useToast()

  const [query,     setQuery]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const filtered = clientes.filter(c => {
    const q = normalize(query)
    return !q ||
      normalize(c.razon_social).includes(q) ||
      normalize(c.cuit).includes(q)
  })

  const handleSave = async (form) => {
    let result
    if (editing?.id) {
      result = await actualizar(editing.id, form)
    } else {
      result = await crear(form)
    }
    if (!result.error) {
      addToast(editing?.id ? 'Cliente actualizado.' : 'Cliente creado correctamente.')
      setModalOpen(false)
      setEditing(null)
    }
    return result
  }

  const handleEdit = (cliente) => {
    setEditing(cliente)
    setModalOpen(true)
  }

  const handleNuevo = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEliminar = async () => {
    setDeleting(true)
    const { error } = await eliminar(confirmar.id)
    if (error) { addToast('Error al eliminar: ' + error.message, 'error') }
    else       { addToast('Cliente eliminado.') }
    setDeleting(false)
    setConfirmar(null)
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes cargados</p>
        </div>
        <Button onClick={handleNuevo}>+ Nuevo cliente</Button>
      </div>

      <SearchBar
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar por razón social o CUIT…"
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👥</div>
          <p className="empty-state__title">Sin clientes</p>
          <p className="empty-state__desc">
            {query ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no cargaste ningún cliente.'}
          </p>
          {!query && <Button onClick={handleNuevo}>+ Nuevo cliente</Button>}
        </div>
      ) : (
        <div className="list">
          {filtered.map(c => (
            <div key={c.id} className="list-item">
              <div className="list-item__body">
                <p className="list-item__title">{c.razon_social}</p>
                <p className="list-item__meta">
                  {[c.cuit, c.tipo_comprobante].filter(Boolean).join(' · ')}
                  {c.direccion && ` · ${c.direccion}`}
                </p>
              </div>
              <div className="list-item__actions">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(c)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmar(c)}
                  style={{ color: 'var(--color-error)' }}
                  title="Eliminar cliente"
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
          ))}
        </div>
      )}

      {modalOpen && (
        <ClienteForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}

      {confirmar && (
        <ConfirmDialog
          title="Eliminar cliente"
          message={`¿Eliminás a "${confirmar.razon_social}"? Los pedidos existentes se conservan pero quedarán sin nombre de cliente asignado.`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmar(null)}
          loading={deleting}
        />
      )}
    </AppLayout>
  )
}
