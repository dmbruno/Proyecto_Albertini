import { useState }          from 'react'
import AppLayout             from '../templates/AppLayout'
import Button                from '../atoms/Button'
import Input                 from '../atoms/Input'
import Badge                 from '../atoms/Badge'
import Spinner               from '../atoms/Spinner'
import FormField             from '../molecules/FormField'
import SearchBar             from '../molecules/SearchBar'
import ConfirmDialog         from '../molecules/ConfirmDialog'
import ProductoForm          from '../organisms/ProductoForm'
import { useProductos }      from '../../hooks/useProductos'
import { useListasPrecios }  from '../../hooks/useListasPrecios'
import { useToast }          from '../../context/ToastContext'
import { calcPrecioFinal, calcSinIva, calcComision } from '../../lib/precios'
import { exportarListaPDF } from '../../lib/exportListaPdf'

const FILTROS_ESTADO = [
  { id: 'activo',   label: 'Activos'   },
  { id: 'inactivo', label: 'Inactivos' },
  { id: 'todos',    label: 'Todos'     },
]

function normalize(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ListaForm({ lista, onSave, onClose }) {
  const [gtos,    setGtos]    = useState(String(lista.gtos_flete ?? ''))
  const [imp,     setImp]     = useState(String(lista.impuesto_municipal ?? ''))
  const [comPct,  setComPct]  = useState(String(lista.comision_pct ?? 3))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await onSave({
      gtos_flete:         gtos   === '' ? 0 : Number(gtos),
      impuesto_municipal: imp    === '' ? 0 : Number(imp),
      comision_pct:       comPct === '' ? 3 : Number(comPct),
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Editar lista — {lista.nombre}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <FormField label="Gastos de flete ($)" htmlFor="gtos_flete">
            <Input
              id="gtos_flete"
              type="number"
              step="0.01"
              min="0"
              value={gtos}
              onChange={e => setGtos(e.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Impuesto municipal ($)" htmlFor="impuesto_municipal">
            <Input
              id="impuesto_municipal"
              type="number"
              step="0.01"
              min="0"
              value={imp}
              onChange={e => setImp(e.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Comisión (%)" htmlFor="comision_pct">
            <Input
              id="comision_pct"
              type="number"
              step="0.01"
              min="0"
              value={comPct}
              onChange={e => setComPct(e.target.value)}
              placeholder="3.00"
            />
          </FormField>
          <div className="modal__footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DescargarModal({ productos, lista, onClose }) {
  const [selected, setSelected] = useState(new Set())
  const [loading,  setLoading]  = useState(false)

  const activos = productos.filter(p => p.activo)
  const todosMarcados = selected.size === activos.length && activos.length > 0
  const haySeleccion  = selected.size > 0 && selected.size < activos.length

  const toggleTodos = () => {
    if (todosMarcados) {
      setSelected(new Set())
    } else {
      setSelected(new Set(activos.map(p => p.id)))
    }
  }

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDescargar = async (soloSeleccion) => {
    setLoading(true)
    const base = soloSeleccion ? activos.filter(p => selected.has(p.id)) : activos
    const conPrecio = base.map(p => ({
      ...p,
      precioFinal: calcPrecioFinal(p.precio ?? 0, lista),
    }))
    await exportarListaPDF({ lista, productos: conPrecio })
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Descargar lista</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6"  y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Lista: <strong style={{ color: 'var(--color-text)' }}>{lista.nombre}</strong>
          <br />
          Seleccioná los productos a incluir o descargá la lista completa.
        </p>

        {/* Seleccionar todos */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          marginBottom: 'var(--space-1)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-raised)',
        }}>
          <input
            type="checkbox"
            checked={todosMarcados}
            onChange={toggleTodos}
            style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}
          />
          {todosMarcados ? 'Deseleccionar todos' : 'Seleccionar todos'}
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-normal)' }}>
            {selected.size > 0 ? `${selected.size} de ${activos.length} seleccionados` : `${activos.length} productos`}
          </span>
        </label>

        {/* Lista de productos */}
        <div style={{
          maxHeight: 320,
          overflowY: 'auto',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
        }}>
          {activos.map((p, i) => {
            const precioFinal = calcPrecioFinal(p.precio ?? 0, lista)
            return (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-3)',
                  borderBottom: i < activos.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  cursor: 'pointer',
                  background: selected.has(p.id) ? 'var(--color-primary-bg)' : 'transparent',
                  transition: 'background 150ms',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {p.nombre}
                </span>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-primary)',
                  whiteSpace: 'nowrap',
                }}>
                  ${fmtNum(precioFinal)}
                </span>
              </label>
            )
          })}
        </div>

        <div className="modal__footer">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          {haySeleccion ? (
            <Button loading={loading} onClick={() => handleDescargar(true)}>
              Descargar selección ({selected.size})
            </Button>
          ) : (
            <Button loading={loading} onClick={() => handleDescargar(false)}>
              Descargar completa
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ListaPrecios() {
  const { productos, loading: lpd, error: epd, crear, actualizar, toggleActivo, eliminar } = useProductos()
  const { listas,    loading: lls, error: els, actualizar: actualizarLista } = useListasPrecios()
  const { addToast } = useToast()

  const [listaIdx,      setListaIdx]      = useState(0)
  const [filtroEstado,  setFiltroEstado]  = useState('activo')
  const [query,         setQuery]         = useState('')
  const [modalProd,      setModalProd]      = useState(false)
  const [editingProd,    setEditingProd]    = useState(null)
  const [modalLista,     setModalLista]     = useState(false)
  const [modalDescargar, setModalDescargar] = useState(false)
  const [confirmar,      setConfirmar]      = useState(null)
  const [deleting,       setDeleting]       = useState(false)

  const loading = lpd || lls
  const lista   = listas[listaIdx] ?? null

  const filtered = productos.filter(p => {
    const matchEstado =
      filtroEstado === 'todos'    ||
      (filtroEstado === 'activo'   &&  p.activo) ||
      (filtroEstado === 'inactivo' && !p.activo)
    const q = normalize(query)
    return matchEstado && (!q || normalize(p.nombre).includes(q))
  })

  const handleSaveProd = async (form) => {
    let result
    if (editingProd?.id) {
      result = await actualizar(editingProd.id, form)
    } else {
      result = await crear(form)
    }
    if (!result.error) {
      addToast(editingProd?.id ? 'Producto actualizado.' : 'Producto creado correctamente.')
      setModalProd(false)
      setEditingProd(null)
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

  const handleSaveLista = async (values) => {
    const result = await actualizarLista(lista.id, values)
    if (!result.error) {
      addToast('Lista actualizada.')
      setModalLista(false)
    }
    return result
  }

  const conImpuesto = lista && lista.impuesto_municipal > 0

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lista de Precios</h1>
          <p className="page-subtitle">{productos.filter(p => p.activo).length} productos activos</p>
        </div>
        <div className="lp-header-actions">
          {lista && (
            <Button variant="secondary" onClick={() => setModalLista(true)}>
              Editar lista
            </Button>
          )}
          {lista && (
            <Button variant="secondary" onClick={() => setModalDescargar(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </Button>
          )}
          <Button onClick={() => { setEditingProd(null); setModalProd(true) }}>
            + Nuevo producto
          </Button>
        </div>
      </div>

      {(epd || els) && <div className="error-banner">{epd || els}</div>}

      {/* Tabs de listas */}
      {loading ? null : (
        <div className="filter-tabs" style={{ marginBottom: 'var(--space-2)' }}>
          {listas.map((l, idx) => (
            <button
              key={l.id}
              type="button"
              className={`filter-tab${listaIdx === idx ? ' filter-tab--active' : ''}`}
              onClick={() => setListaIdx(idx)}
            >
              {l.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Info de la lista seleccionada */}
      {lista && (
        <div style={{
          display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}>
          <span>Gtos. flete: <strong>${fmtNum(lista.gtos_flete)}</strong></span>
          {conImpuesto && (
            <span>Imp. municipal: <strong>${fmtNum(lista.impuesto_municipal)}</strong></span>
          )}
          <span>Comisión: <strong>{lista.comision_pct ?? 3}%</strong></span>
        </div>
      )}

      {/* Filtro activo/inactivo */}
      <div className="filter-tabs">
        {FILTROS_ESTADO.map(f => (
          <button
            key={f.id}
            type="button"
            className={`filter-tab${filtroEstado === f.id ? ' filter-tab--active' : ''}`}
            onClick={() => setFiltroEstado(f.id)}
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

      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">Sin productos</p>
          <p className="empty-state__desc">
            {query ? 'No hay productos que coincidan.' : 'No hay productos en este filtro.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Cards mobile ── */}
          <div className="lp-cards">
            {filtered.map(p => {
              const comision    = calcComision(p.precio ?? 0, lista)
              const precioFinal = calcPrecioFinal(p.precio ?? 0, lista)
              const sinIva      = calcSinIva(precioFinal)
              return (
                <div key={p.id} className="lp-card">
                  <div className="lp-card__header">
                    <span className="lp-card__nombre">
                      {p.nombre}
                      {!p.activo && (
                        <Badge variant="inactivo" style={{ marginLeft: 'var(--space-2)', verticalAlign: 'middle' }}>Inactivo</Badge>
                      )}
                    </span>
                  </div>
                  <div className="lp-card__grid">
                    <div className="lp-card__field">
                      <div className="lp-card__label">Precio base</div>
                      <div className="lp-card__value">${fmtNum(p.precio)}</div>
                    </div>
                    <div className="lp-card__field">
                      <div className="lp-card__label">Comisión ({lista?.comision_pct ?? 3}%)</div>
                      <div className="lp-card__value">${fmtNum(comision)}</div>
                    </div>
                    <div className="lp-card__field">
                      <div className="lp-card__label">Gtos. flete</div>
                      <div className="lp-card__value">${fmtNum(lista?.gtos_flete)}</div>
                    </div>
                    {conImpuesto && (
                      <div className="lp-card__field">
                        <div className="lp-card__label">Imp. municipal</div>
                        <div className="lp-card__value">${fmtNum(lista?.impuesto_municipal)}</div>
                      </div>
                    )}
                    <div className="lp-card__field">
                      <div className="lp-card__label">Sin IVA</div>
                      <div className="lp-card__value">${fmtNum(sinIva)}</div>
                    </div>
                  </div>
                  <div className="lp-card__final">
                    <span className="lp-card__final-label">Precio final</span>
                    <span className="lp-card__final-value">${fmtNum(precioFinal)}</span>
                  </div>
                  <div className="lp-card__actions">
                    <Button variant="secondary" size="sm" onClick={() => { setEditingProd(p); setModalProd(true) }}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(p)} style={{ color: p.activo ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    {!p.activo && (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmar(p)} style={{ color: 'var(--color-error)' }} title="Eliminar">
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
              )
            })}
          </div>

          {/* ── Lista tipo card: desktop ── */}
          <div className="lp-table-wrap">
            <div className="lp-row-header">
              <span className="lp-row-header__name">Producto</span>
              <span className="lp-row-header__num">Precio</span>
              <span className="lp-row-header__num">Comisión</span>
              <span className="lp-row-header__num">Gtos. flete</span>
              {conImpuesto && <span className="lp-row-header__num">Imp. mun.</span>}
              <span className="lp-row-header__num lp-row-header__num--primary">Precio final</span>
              <span className="lp-row-header__num">Sin IVA</span>
              <span className="lp-row-header__actions"></span>
            </div>
            <div className="list">
              {filtered.map(p => {
                const comision    = calcComision(p.precio ?? 0, lista)
                const precioFinal = calcPrecioFinal(p.precio ?? 0, lista)
                const sinIva      = calcSinIva(precioFinal)
                return (
                  <div key={p.id} className={`list-item lp-row${!p.activo ? ' lp-row--inactivo' : ''}`}>
                    <span className="lp-row__name">
                      {p.nombre}
                      {!p.activo && <Badge variant="inactivo" style={{ marginLeft: 'var(--space-2)', verticalAlign: 'middle' }}>Inactivo</Badge>}
                    </span>
                    <span className="lp-row__num">${fmtNum(p.precio)}</span>
                    <span className="lp-row__num">${fmtNum(comision)}</span>
                    <span className="lp-row__num">${fmtNum(lista?.gtos_flete)}</span>
                    {conImpuesto && <span className="lp-row__num">${fmtNum(lista?.impuesto_municipal)}</span>}
                    <span className="lp-row__num lp-row__num--primary">${fmtNum(precioFinal)}</span>
                    <span className="lp-row__num lp-row__num--muted">${fmtNum(sinIva)}</span>
                    <div className="lp-row__actions">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingProd(p); setModalProd(true) }}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(p)} style={{ color: p.activo ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      {!p.activo && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmar(p)} style={{ color: 'var(--color-error)' }} title="Eliminar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {modalProd && (
        <ProductoForm
          initial={editingProd}
          onSave={handleSaveProd}
          onClose={() => { setModalProd(false); setEditingProd(null) }}
          lista={lista}
        />
      )}

      {modalLista && lista && (
        <ListaForm
          lista={lista}
          onSave={handleSaveLista}
          onClose={() => setModalLista(false)}
        />
      )}

      {modalDescargar && lista && (
        <DescargarModal
          productos={productos}
          lista={lista}
          onClose={() => setModalDescargar(false)}
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


