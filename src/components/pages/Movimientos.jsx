import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout       from '../templates/AppLayout'
import Badge           from '../atoms/Badge'
import Button          from '../atoms/Button'
import Select          from '../atoms/Select'
import Spinner         from '../atoms/Spinner'
import SearchBar       from '../molecules/SearchBar'
import ConfirmDialog   from '../molecules/ConfirmDialog'
import MovimientoForm  from '../organisms/MovimientoForm'
import { useMovimientosGlobales, registrarMovimientoStandalone, marcarFacturaPagada, verFactura } from '../../hooks/useCuentaCorriente'
import { useToast }     from '../../context/ToastContext'
import { TIPO_LABEL, efectoDe, badgeVariantEfecto, estadoVencimiento, FACTURA_CATEGORIA_LABEL } from '../../lib/movimientos'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}
function restarDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function normalize(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const PRESETS = [
  { id: '7d',     label: '7 días',        desde: () => restarDias(7)  },
  { id: '30d',    label: '30 días',       desde: () => restarDias(30) },
  { id: '90d',    label: '90 días',       desde: () => restarDias(90) },
  { id: 'custom', label: 'Personalizado', desde: null },
]

const FILTROS_EFECTO = [
  { id: 'todos', label: 'Todos' },
  { id: 'debe',  label: 'Debe'  },
  { id: 'haber', label: 'Haber' },
]

const MEDIOS_PAGO = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'ECHEQ',         label: 'ECheq' },
  { value: 'DEPOSITO',      label: 'Depósito' },
  { value: 'COMPRA',        label: 'Compra' },
  { value: 'CANCELADO',     label: 'Cancelado' },
]

export default function Movimientos() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { movimientos, loading, fetchMovimientosGlobales } = useMovimientosGlobales()

  const [preset,        setPreset]        = useState('30d')
  const [desde,         setDesde]         = useState(restarDias(30))
  const [hasta,         setHasta]         = useState(hoy())
  const [query,          setQuery]          = useState('')
  const [tipoFiltro,     setTipoFiltro]     = useState('todos')
  const [efectoFiltro,   setEfectoFiltro]   = useState('todos')
  const [medioPagoFiltro, setMedioPagoFiltro] = useState('todos')
  const [formOpen,       setFormOpen]       = useState(false)
  const [formPrefill,    setFormPrefill]    = useState(null)
  const [confirmarApagarAlerta, setConfirmarApagarAlerta] = useState(null)
  const [apagandoAlerta,        setApagandoAlerta]        = useState(false)

  useEffect(() => {
    fetchMovimientosGlobales({ desde, hasta })
  }, [desde, hasta, fetchMovimientosGlobales])

  const abrirRegistrarPago = (m) => {
    setFormPrefill({ tipo: 'PAGO', monto: m.monto, movimientoRelacionadoId: m.id, _facturaId: m.id, _clienteId: m.cliente_id })
    setFormOpen(true)
  }

  const cerrarForm = () => { setFormOpen(false); setFormPrefill(null) }

  const handleVerFactura = async (m) => {
    const { error } = await verFactura(m.factura_imagen_url)
    if (error) addToast('No se pudo abrir la imagen de la factura.', 'error')
  }

  const handleGuardarPago = async (payload) => {
    const { error } = await registrarMovimientoStandalone(formPrefill._clienteId, payload)
    if (error) return { error }
    await marcarFacturaPagada(formPrefill._facturaId)
    await fetchMovimientosGlobales({ desde, hasta })
    addToast('Pago registrado correctamente.')
    cerrarForm()
    return { error: null }
  }

  const handleConfirmarApagarAlerta = async () => {
    setApagandoAlerta(true)
    const { error } = await marcarFacturaPagada(confirmarApagarAlerta.id)
    setApagandoAlerta(false)
    setConfirmarApagarAlerta(null)
    if (error) { addToast(error.message, 'error'); return }
    await fetchMovimientosGlobales({ desde, hasta })
    addToast('Alerta apagada. No se registró ningún pago.')
  }

  const handlePreset = (p) => {
    setPreset(p.id)
    if (p.id !== 'custom') {
      setDesde(p.desde())
      setHasta(hoy())
    }
  }

  const mostrarMedioPago = tipoFiltro === 'todos' || tipoFiltro === 'PAGO'

  const handleTipoChange = (tipo) => {
    setTipoFiltro(tipo)
    if (tipo !== 'todos' && tipo !== 'PAGO') setMedioPagoFiltro('todos')
  }

  const q = normalize(query)
  const filtered = movimientos.filter(m => {
    if (tipoFiltro !== 'todos' && m.tipo !== tipoFiltro) return false
    if (efectoFiltro !== 'todos' && efectoDe(m) !== efectoFiltro) return false
    if (medioPagoFiltro !== 'todos' && (m.tipo !== 'PAGO' || m.medio_pago !== medioPagoFiltro)) return false
    if (q && !normalize(m.clientes?.razon_social).includes(q)) return false
    return true
  })

  const totalDebe  = filtered.reduce((s, m) => s + (efectoDe(m) === 'debe'  ? Number(m.monto) : 0), 0)
  const totalHaber = filtered.reduce((s, m) => s + (efectoDe(m) === 'haber' ? Number(m.monto) : 0), 0)
  const balance    = totalDebe - totalHaber

  return (
    <AppLayout>
      <button className="back-btn" type="button" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle">Libro de cuenta corriente de todos los clientes</p>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="stats-filters">
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`filter-tab${preset === p.id ? ' filter-tab--active' : ''}`}
              onClick={() => handlePreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="stats-date-range">
            <div className="stats-date-range__field">
              <label className="stats-date-range__label">Desde</label>
              <input
                type="date"
                className="input"
                value={desde}
                max={hasta}
                onChange={e => setDesde(e.target.value)}
              />
            </div>
            <div className="stats-date-range__field">
              <label className="stats-date-range__label">Hasta</label>
              <input
                type="date"
                className="input"
                value={hasta}
                min={desde}
                max={hoy()}
                onChange={e => setHasta(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtros de cliente, tipo y efecto */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <SearchBar
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cliente…"
          />
        </div>
        <div style={{ flex: '0 1 200px', minWidth: 160 }}>
          <Select value={tipoFiltro} onChange={e => handleTipoChange(e.target.value)}>
            <option value="todos">Todos los tipos</option>
            {Object.entries(TIPO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        {mostrarMedioPago && (
          <div style={{ flex: '0 1 200px', minWidth: 160 }}>
            <Select value={medioPagoFiltro} onChange={e => setMedioPagoFiltro(e.target.value)}>
              <option value="todos">Todos los medios de pago</option>
              {MEDIOS_PAGO.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="filter-tabs">
        {FILTROS_EFECTO.map(f => (
          <button
            key={f.id}
            type="button"
            className={`filter-tab${efectoFiltro === f.id ? ' filter-tab--active' : ''}`}
            onClick={() => setEfectoFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner size="lg" overlay />
      ) : (
        <>
          {/* KPIs del período filtrado */}
          <div className="stats-kpis">
            <div className="stats-kpi">
              <p className="stats-kpi__label">Total Debe</p>
              <p className="stats-kpi__value" style={{ color: 'var(--color-error)' }}>${fmt(totalDebe)}</p>
            </div>
            <div className="stats-kpi">
              <p className="stats-kpi__label">Total Haber</p>
              <p className="stats-kpi__value" style={{ color: 'var(--color-success)' }}>${fmt(totalHaber)}</p>
            </div>
            <div className="stats-kpi">
              <p className="stats-kpi__label">Balance del período</p>
              <p className="stats-kpi__value" style={{ color: balance > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                ${fmt(Math.abs(balance))}
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📖</div>
              <p className="empty-state__title">Sin movimientos</p>
              <p className="empty-state__desc">Probá con otro rango de fechas o quitando algún filtro.</p>
            </div>
          ) : (
            <div className="list">
              {filtered.map(m => {
                const efecto     = efectoDe(m)
                const colorMonto = efecto === 'debe' ? 'var(--color-error)' : efecto === 'haber' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                const vencAlerta = estadoVencimiento(m)

                const acciones = vencAlerta ? (
                  <div className="alerta-acciones" onClick={e => e.stopPropagation()}>
                    <Button size="sm" onClick={() => abrirRegistrarPago(m)}>
                      Registrar pago
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmarApagarAlerta(m)}>
                      Apagar alerta
                    </Button>
                    {m.factura_imagen_url && (
                      <Button size="sm" variant="secondary" onClick={() => handleVerFactura(m)}>
                        📄 Ver factura
                      </Button>
                    )}
                  </div>
                ) : m.factura_imagen_url ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={e => { e.stopPropagation(); handleVerFactura(m) }}
                  >
                    📄 Ver factura
                  </Button>
                ) : null

                return (
                  <div
                    key={m.id}
                    className="list-item list-item--clickable mov-item"
                    onClick={() => navigate(`/cuentas/${m.cliente_id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/cuentas/${m.cliente_id}`)}
                  >
                    <div className="mov-item__left">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge variant={badgeVariantEfecto(efecto)}>{TIPO_LABEL[m.tipo] ?? m.tipo}</Badge>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {fmtFecha(m.fecha)}
                        </span>
                        {vencAlerta && (
                          <Badge variant={vencAlerta === 'vencida' ? 'debe' : 'warning'}>
                            {vencAlerta === 'vencida' ? 'Vencida' : 'Por vencer'}
                          </Badge>
                        )}
                      </div>
                      <p style={{ fontWeight: 'var(--font-semibold)', marginTop: 2 }}>
                        {m.clientes?.razon_social}
                      </p>
                      <div className="mov-item__desc-block">
                        {m.numero_comprobante && (
                          <span className="mov-item__desc-line" style={{ fontWeight: 'var(--font-semibold)' }}>
                            Nº {m.numero_comprobante}
                          </span>
                        )}
                        {(FACTURA_CATEGORIA_LABEL[m.factura_categoria] || m.productos?.nombre) && (
                          <span className="mov-item__desc-line">
                            {FACTURA_CATEGORIA_LABEL[m.factura_categoria] || m.productos.nombre}
                          </span>
                        )}
                        {m.fecha_vencimiento && (
                          <span className="mov-item__desc-line">Vto: {fmtFecha(m.fecha_vencimiento)}</span>
                        )}
                        {m.descripcion && (
                          <span className="mov-item__desc-line">{m.descripcion}</span>
                        )}
                      </div>

                      {acciones && (
                        <div className="mov-item__acciones--desktop" style={{ marginTop: 4 }}>
                          {acciones}
                        </div>
                      )}
                    </div>

                    <div className="mov-item__right">
                      <span className="mov-item__monto-valor" style={{ color: colorMonto }}>
                        {efecto === 'debe'  && '+ '}
                        {efecto === 'haber' && '− '}
                        ${fmt(m.monto)}
                      </span>
                    </div>

                    {acciones && (
                      <div className="mov-item__acciones--mobile" style={{ marginTop: 4 }} onClick={e => e.stopPropagation()}>
                        {acciones}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {formOpen && (
        <MovimientoForm
          onSave={handleGuardarPago}
          onClose={cerrarForm}
          clienteId={formPrefill?._clienteId}
          inicial={formPrefill}
          titulo="Registrar pago"
        />
      )}

      {confirmarApagarAlerta && (
        <ConfirmDialog
          title="Apagar alerta"
          message="Esta acción NO registra ningún pago — solo oculta el aviso de vencimiento de esta factura. Usala únicamente si ya cobraste por otro medio y no hace falta registrar el pago acá."
          onConfirm={handleConfirmarApagarAlerta}
          onCancel={() => setConfirmarApagarAlerta(null)}
          loading={apagandoAlerta}
          confirmLabel="Apagar alerta"
          confirmVariant="secondary"
        />
      )}
    </AppLayout>
  )
}
