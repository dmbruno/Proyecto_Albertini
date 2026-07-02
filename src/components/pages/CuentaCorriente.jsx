import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import AppLayout               from '../templates/AppLayout'
import Badge                   from '../atoms/Badge'
import Button                  from '../atoms/Button'
import Spinner                 from '../atoms/Spinner'
import SearchBar               from '../molecules/SearchBar'
import ConfirmDialog           from '../molecules/ConfirmDialog'
import MovimientoForm          from '../organisms/MovimientoForm'
import { useSaldos, useFacturasPorVencer, useCarteraCheques, registrarMovimientoStandalone, marcarFacturaPagada, verFactura } from '../../hooks/useCuentaCorriente'
import { useToast }            from '../../context/ToastContext'
import { exportarCuentasPDF }  from '../../lib/exportCuentasPdf'

const FILTROS = [
  { id: 'todos',   label: 'Todos'     },
  { id: 'deuda',   label: 'Con deuda' },
  { id: 'al_dia',  label: 'Al día'    },
]

const LABEL_CONDICION = {
  'RESPONSABLE INSCRIPTO': 'RI',
  'MONOTRIBUTISTA':        'Monotrib',
  'CONSUMIDOR FINAL':      'Cons. Final',
  'EXENTO':                'Exento',
}

function fmtMonto(n) {
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

function diasHasta(fechaStr) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  return Math.round((fecha - hoy) / 86400000)
}

export default function CuentaCorriente() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { saldos, loading, error, fetchSaldos } = useSaldos()
  const { facturas, fetchFacturasPorVencer } = useFacturasPorVencer()
  const { cheques,  fetchCarteraCheques }    = useCarteraCheques()

  const [filtro,    setFiltro]    = useState('todos')
  const [query,     setQuery]     = useState('')
  const [exporting, setExporting] = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [formPrefill, setFormPrefill] = useState(null)
  const [confirmarApagarAlerta, setConfirmarApagarAlerta] = useState(null)
  const [apagandoAlerta,        setApagandoAlerta]        = useState(false)

  useEffect(() => { fetchSaldos() }, [fetchSaldos])
  useEffect(() => { fetchFacturasPorVencer() }, [fetchFacturasPorVencer])
  useEffect(() => { fetchCarteraCheques() }, [fetchCarteraCheques])

  const facturasAlerta   = facturas.filter(f => f.fecha_vencimiento && diasHasta(f.fecha_vencimiento) <= 7)
  const chequesEnCartera = cheques.filter(c => c.cheque_estado === 'CARTERA').length

  const abrirRegistrarPago = (f) => {
    setFormPrefill({ tipo: 'PAGO', monto: f.monto, movimientoRelacionadoId: f.id, _facturaId: f.id, _clienteId: f.cliente_id })
    setFormOpen(true)
  }

  const cerrarForm = () => { setFormOpen(false); setFormPrefill(null) }

  const handleVerFactura = async (f) => {
    const { error } = await verFactura(f.factura_imagen_url)
    if (error) addToast('No se pudo abrir la imagen de la factura.', 'error')
  }

  const handleGuardarPago = async (payload) => {
    const { error } = await registrarMovimientoStandalone(formPrefill._clienteId, payload)
    if (error) return { error }
    await marcarFacturaPagada(formPrefill._facturaId)
    await fetchFacturasPorVencer()
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
    addToast('Alerta apagada. No se registró ningún pago.')
    fetchFacturasPorVencer()
  }

  const filtered = saldos.filter(s => {
    const matchFiltro =
      filtro === 'todos'  ||
      (filtro === 'deuda'  && Number(s.saldo) > 0) ||
      (filtro === 'al_dia' && Number(s.saldo) <= 0)
    const q = normalize(query)
    return matchFiltro && (!q || normalize(s.razon_social).includes(q))
  })

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await exportarCuentasPDF(filtered)
      addToast('PDF descargado correctamente.', 'info')
    } catch {
      addToast('Error al generar el PDF.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cuentas corrientes</h1>
          <p className="page-subtitle">{saldos.length} clientes</p>
        </div>
        <div className="cuentas-acciones">
          <Button variant="secondary" size="sm" onClick={() => navigate('/cuentas/movimientos')}>
            📖 Ver movimientos
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/cuentas/cheques')}>
            🧾 Ver cheques{chequesEnCartera > 0 ? ` (${chequesEnCartera})` : ''}
          </Button>
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </Button>
        </div>
      </div>

      {facturasAlerta.length > 0 && (
        <div className="stats-card" style={{ marginBottom: 'var(--space-4)' }}>
          <p className="stats-card__title">⚠ Facturas por vencer</p>
          <p className="stats-card__sub">Vencidas o que vencen dentro de los próximos 7 días</p>
          <div className="list">
            {facturasAlerta.map(f => {
              const vencida = diasHasta(f.fecha_vencimiento) < 0
              return (
                <div
                  key={f.id}
                  className="list-item list-item--clickable"
                  style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-2)' }}
                  onClick={() => navigate(`/cuentas/${f.cliente_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/cuentas/${f.cliente_id}`)}
                >
                  <div>
                    <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', fontSize: 'var(--text-base)' }}>
                      {f.clientes?.razon_social}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge variant={vencida ? 'debe' : 'warning'}>
                          {vencida ? 'Vencida' : 'Por vencer'}
                        </Badge>
                        <span className="list-item__meta" style={{ margin: 0 }}>
                          Nº {f.numero_comprobante || '—'} · Vto: {fmtFecha(f.fecha_vencimiento)}
                        </span>
                      </div>
                      <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-error)', flexShrink: 0 }}>
                        ${fmtMonto(f.monto)}
                      </span>
                    </div>
                  </div>
                  <div className="alerta-acciones" onClick={e => e.stopPropagation()}>
                    <Button size="sm" onClick={() => abrirRegistrarPago(f)}>
                      Registrar pago
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmarApagarAlerta(f)}>
                      Apagar alerta
                    </Button>
                    {f.factura_imagen_url && (
                      <Button size="sm" variant="secondary" onClick={() => handleVerFactura(f)}>
                        📄 Ver factura
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="filter-tabs">
        {FILTROS.map(f => (
          <button
            key={f.id}
            type="button"
            className={`filter-tab${filtro === f.id ? ' filter-tab--active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <SearchBar
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar cliente…"
        style={{ marginBottom: 'var(--space-4)' }}
      />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📒</div>
          <p className="empty-state__title">Sin resultados</p>
          <p className="empty-state__desc">
            {query ? 'No hay clientes que coincidan.' : 'No hay clientes en este filtro.'}
          </p>
        </div>
      ) : (
        <div className="list">
          {filtered.map(s => {
            const saldo     = Number(s.saldo)
            const enDeuda   = saldo > 0
            const aFavor    = saldo < 0
            const labelCond = LABEL_CONDICION[s.condicion_iva] ?? null

            return (
              <div
                key={s.cliente_id}
                className="list-item list-item--clickable"
                onClick={() => navigate(`/cuentas/${s.cliente_id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/cuentas/${s.cliente_id}`)}
              >
                <div className="list-item__body">
                  <p className="list-item__title" style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{s.razon_social}</span>
                    {labelCond && <Badge style={{ flexShrink: 0 }}>{labelCond}</Badge>}
                  </p>
                  <p className="list-item__meta">
                    Cargos: ${fmtMonto(s.total_cargos)} · Pagos: ${fmtMonto(s.total_pagos)}
                  </p>
                </div>
                <div className="cuenta-saldo" style={{
                  color: enDeuda ? 'var(--color-error)' : 'var(--color-success)',
                  fontWeight: 'var(--font-bold)',
                  fontSize: 'var(--text-base)',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {enDeuda && `$${fmtMonto(saldo)}`}
                  {aFavor  && <span>A favor<br />${fmtMonto(Math.abs(saldo))}</span>}
                  {saldo === 0 && 'Al día'}
                </div>
              </div>
            )
          })}
        </div>
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
