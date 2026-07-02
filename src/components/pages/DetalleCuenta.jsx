import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout                from '../templates/AppLayout'
import Button                   from '../atoms/Button'
import Badge                    from '../atoms/Badge'
import Spinner                  from '../atoms/Spinner'
import ConfirmDialog            from '../molecules/ConfirmDialog'
import MovimientoForm           from '../organisms/MovimientoForm'
import { useCuentaCorriente, eliminarMovimientos, verFactura } from '../../hooks/useCuentaCorriente'
import { supabase }             from '../../lib/supabaseClient'
import { useToast }             from '../../context/ToastContext'
import { TIPO_LABEL, efectoDe, badgeVariantEfecto, estadoVencimiento, FACTURA_CATEGORIA_LABEL } from '../../lib/movimientos'
import { exportarMovimientosClientePDF } from '../../lib/exportMovimientosClientePdf'

const LABEL_CONDICION = {
  'RESPONSABLE INSCRIPTO': 'RI',
  'MONOTRIBUTISTA':        'Monotrib',
  'CONSUMIDOR FINAL':      'Cons. Final',
  'EXENTO':                'Exento',
}

const CHEQUE_ESTADO_LABEL = {
  CARTERA:    'En cartera',
  DEPOSITADO: 'Depositado',
  ACREDITADO: 'Acreditado',
  RECHAZADO:  'Rechazado',
  ENDOSADO:   'Endosado',
}

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'debe',  label: 'Debe'  },
  { id: 'haber', label: 'Haber' },
]

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function restarDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const PRESETS_FECHA = [
  { id: 'todo',   label: 'Todo',          desde: null },
  { id: '30d',    label: '30 días',       desde: () => restarDias(30) },
  { id: '90d',    label: '90 días',       desde: () => restarDias(90) },
  { id: 'custom', label: 'Personalizado', desde: null },
]

export default function DetalleCuenta() {
  const { clienteId } = useParams()
  const navigate      = useNavigate()
  const { addToast }  = useToast()

  const {
    movimientos, loading, fetchMovimientos,
    registrarMovimiento, actualizarMovimiento, eliminarMovimiento,
    marcarComoPagada, actualizarEstadoCheque,
  } = useCuentaCorriente(clienteId)

  const [cliente,        setCliente]        = useState(null)
  const [loadingCli,     setLoadingCli]     = useState(true)
  const [filtro,         setFiltro]         = useState('todos')
  const [presetFecha,    setPresetFecha]    = useState('todo')
  const [desde,          setDesde]          = useState('')
  const [hasta,          setHasta]          = useState(hoy())
  const [exportingPdf,   setExportingPdf]   = useState(false)
  const [formOpen,       setFormOpen]       = useState(false)
  const [formInicial,    setFormInicial]    = useState(null)
  const [formPrefill,    setFormPrefill]    = useState(null)
  const [confirmarElim,  setConfirmarElim]  = useState(null)
  const [deletingId,     setDeletingId]     = useState(null)
  const [confirmarChRech, setConfirmarChRech] = useState(null)
  const [creandoChRech,  setCreandoChRech]  = useState(false)
  const [confirmarRevertirChRech, setConfirmarRevertirChRech] = useState(null)
  const [revirtiendoChRech,       setRevirtiendoChRech]       = useState(false)
  const [confirmarEndoso, setConfirmarEndoso] = useState(null)
  const [endosadoA,       setEndosadoA]       = useState('')
  const [endosadoFecha,   setEndosadoFecha]   = useState('')
  const [guardandoEndoso, setGuardandoEndoso] = useState(false)
  const [confirmarApagarAlerta, setConfirmarApagarAlerta] = useState(null)
  const [apagandoAlerta,        setApagandoAlerta]        = useState(false)

  useEffect(() => {
    fetchMovimientos()
    supabase
      .from('saldos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .single()
      .then(({ data }) => { setCliente(data); setLoadingCli(false) })
  }, [clienteId, fetchMovimientos])

  const refrescarSaldo = async () => {
    const { data } = await supabase
      .from('saldos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .single()
    setCliente(data)
  }

  const saldo   = Number(cliente?.saldo ?? 0)
  const enDeuda = saldo > 0
  const aFavor  = saldo < 0

  const rangoActivo = presetFecha !== 'todo'

  const filtered = movimientos.filter(m =>
    (filtro === 'todos' || efectoDe(m) === filtro) &&
    (!rangoActivo || (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta))
  )

  const handlePresetFecha = (p) => {
    setPresetFecha(p.id)
    if (p.id === 'todo') {
      setDesde('')
      setHasta(hoy())
    } else if (p.id !== 'custom') {
      setDesde(p.desde())
      setHasta(hoy())
    }
  }

  const handleDescargarPDF = async () => {
    setExportingPdf(true)
    try {
      await exportarMovimientosClientePDF({
        cliente,
        movimientos,
        desde: rangoActivo ? (desde || null) : null,
        hasta: rangoActivo ? (hasta || null) : null,
      })
    } finally {
      setExportingPdf(false)
    }
  }

  const tieneCheques = movimientos.some(m =>
    m.tipo === 'PAGO' && (m.medio_pago === 'CHEQUE' || m.medio_pago === 'ECHEQ')
  )

  const abrirForm = (mov = null) => { setFormInicial(mov); setFormPrefill(null); setFormOpen(true) }

  // "Registrar pago" de una factura puntual: abre el formulario ya con
  // tipo Pago e importe precargados. Al guardar, además de crear el pago,
  // marca esa factura como pagada — así el saldo baja y la alerta se apaga
  // en un solo paso.
  const abrirRegistrarPago = (mov) => {
    setFormInicial(null)
    setFormPrefill({ tipo: 'PAGO', monto: mov.monto, movimientoRelacionadoId: mov.id, _facturaId: mov.id })
    setFormOpen(true)
  }

  const cerrarForm = () => { setFormOpen(false); setFormInicial(null); setFormPrefill(null) }

  const handleGuardar = async (payload) => {
    const { error } = formInicial
      ? await actualizarMovimiento(formInicial.id, payload)
      : await registrarMovimiento(payload)
    if (error) return { error }

    if (!formInicial && formPrefill?._facturaId) {
      await marcarComoPagada(formPrefill._facturaId)
    }

    await refrescarSaldo()
    addToast(formInicial ? 'Movimiento actualizado correctamente.' : 'Movimiento registrado correctamente.')
    cerrarForm()
    return { error: null }
  }

  const handleEliminar = async () => {
    setDeletingId(confirmarElim.id)
    const { error } = await eliminarMovimiento(confirmarElim.id)
    if (error) {
      addToast(error.message, 'error')
    } else {
      await refrescarSaldo()
      addToast('Movimiento eliminado.')
    }
    setDeletingId(null)
    setConfirmarElim(null)
  }

  const handleVerFactura = async (mov) => {
    const { error } = await verFactura(mov.factura_imagen_url)
    if (error) addToast('No se pudo abrir la imagen de la factura.', 'error')
  }

  const handleConfirmarApagarAlerta = async () => {
    setApagandoAlerta(true)
    const { error } = await marcarComoPagada(confirmarApagarAlerta.id)
    setApagandoAlerta(false)
    setConfirmarApagarAlerta(null)
    if (error) addToast(error.message, 'error')
    else addToast('Alerta apagada. No se registró ningún pago.')
  }

  const handleCambiarEstadoCheque = async (mov, nuevoEstado) => {
    if (nuevoEstado === 'ENDOSADO') {
      setEndosadoA(mov.cheque_endosado_a || '')
      setEndosadoFecha(mov.cheque_endosado_fecha || hoy())
      setConfirmarEndoso(mov)
      return
    }
    const { error, esRechazo, chRechRelacionados } = await actualizarEstadoCheque(mov.id, nuevoEstado)
    if (error) { addToast(error.message, 'error'); return }
    if (esRechazo) {
      setConfirmarChRech(mov)
    } else if (chRechRelacionados?.length > 0) {
      setConfirmarRevertirChRech({ mov, chRechRelacionados })
    } else {
      addToast('Estado del cheque actualizado.')
    }
  }

  const handleConfirmarEndoso = async () => {
    setGuardandoEndoso(true)
    const { error } = await actualizarEstadoCheque(confirmarEndoso.id, 'ENDOSADO', {
      cheque_endosado_a:     endosadoA.trim() || null,
      cheque_endosado_fecha: endosadoFecha || null,
    })
    setGuardandoEndoso(false)
    setConfirmarEndoso(null)
    if (error) { addToast(error.message, 'error'); return }
    addToast('Cheque marcado como endosado.')
  }

  const handleCrearChRech = async () => {
    const mov = confirmarChRech
    setCreandoChRech(true)
    const { error } = await registrarMovimiento({
      tipo:                   'CH-RECH',
      monto:                  mov.monto,
      fecha:                  hoy(),
      descripcion:            `Cheque rechazado — ${mov.cheque_banco || ''} Nº ${mov.cheque_numero || ''}`.trim(),
      movimientoRelacionadoId: mov.id,
    })
    setCreandoChRech(false)
    setConfirmarChRech(null)
    if (error) { addToast(error.message, 'error'); return }
    await refrescarSaldo()
    addToast('Se registró el cheque rechazado y se actualizó el saldo.')
  }

  const handleRevertirChRech = async () => {
    const { chRechRelacionados } = confirmarRevertirChRech
    setRevirtiendoChRech(true)
    const { error } = await eliminarMovimientos(chRechRelacionados.map(m => m.id))
    setRevirtiendoChRech(false)
    setConfirmarRevertirChRech(null)
    if (error) { addToast(error.message, 'error'); return }
    await fetchMovimientos()
    await refrescarSaldo()
    addToast('Se eliminó el movimiento de Cheque rechazado y se actualizó el saldo.')
  }

  if (loadingCli) return <AppLayout><Spinner size="lg" overlay /></AppLayout>

  return (
    <AppLayout>
      <button className="back-btn" type="button" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {/* Encabezado del cliente */}
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{cliente?.razon_social}</h1>
            {LABEL_CONDICION[cliente?.condicion_iva] && (
              <Badge>{LABEL_CONDICION[cliente.condicion_iva]}</Badge>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: 'var(--space-1)' }}>
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Saldo total */}
        <div className="cuenta-saldo-header" style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 2 }}>
            Saldo actual
          </p>
          <p style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: enDeuda ? 'var(--color-error)' : 'var(--color-success)',
            lineHeight: 1.1,
          }}>
            {aFavor && <span style={{ fontSize: 'var(--text-xs)', display: 'block', fontWeight: 'normal' }}>A favor</span>}
            ${fmt(Math.abs(saldo))}
          </p>
          {saldo === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 'var(--font-semibold)' }}>
              Al día
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="cuenta-acciones" style={{ marginBottom: 'var(--space-4)' }}>
        {tieneCheques && (
          <Button variant="secondary" onClick={() => navigate(`/cuentas/cheques?clienteId=${clienteId}`)}>
            🧾 Ver cheques
          </Button>
        )}
        <Button variant="secondary" loading={exportingPdf} onClick={handleDescargarPDF}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar PDF
        </Button>
        <Button onClick={() => abrirForm()}>+ Nuevo movimiento</Button>
      </div>

      {/* Filtro de fechas */}
      <div className="stats-filters">
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {PRESETS_FECHA.map(p => (
            <button
              key={p.id}
              type="button"
              className={`filter-tab${presetFecha === p.id ? ' filter-tab--active' : ''}`}
              onClick={() => handlePresetFecha(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {presetFecha === 'custom' && (
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

      {/* Filtros de debe/haber */}
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

      {/* Lista de movimientos */}
      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <p className="empty-state__title">Sin movimientos</p>
          <p className="empty-state__desc">
            {filtro === 'todos'
              ? 'Aún no hay movimientos en esta cuenta.'
              : `No hay movimientos que ${filtro === 'debe' ? 'sumen' : 'resten'} el saldo.`}
          </p>
        </div>
      ) : (
        <div className="list">
          {filtered.map(mov => {
            const efecto      = efectoDe(mov)
            const colorMonto  = efecto === 'debe' ? 'var(--color-error)' : efecto === 'haber' ? 'var(--color-success)' : 'var(--color-text-secondary)'
            const vencAlerta  = estadoVencimiento(mov)
            const esChequePago = mov.tipo === 'PAGO' && (mov.medio_pago === 'CHEQUE' || mov.medio_pago === 'ECHEQ')

            const acciones = vencAlerta ? (
              <div className="alerta-acciones">
                <Button size="sm" onClick={() => abrirRegistrarPago(mov)}>
                  Registrar pago
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmarApagarAlerta(mov)}>
                  Apagar alerta
                </Button>
                {mov.factura_imagen_url && (
                  <Button size="sm" variant="secondary" onClick={() => handleVerFactura(mov)}>
                    📄 Ver factura
                  </Button>
                )}
              </div>
            ) : mov.factura_imagen_url ? (
              <Button size="sm" variant="secondary" onClick={() => handleVerFactura(mov)}>
                📄 Ver factura
              </Button>
            ) : null

            return (
              <div key={mov.id} className="list-item mov-item">

                {/* Izquierda: badge + detalle */}
                <div className="mov-item__left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge variant={badgeVariantEfecto(efecto)}>{TIPO_LABEL[mov.tipo] ?? mov.tipo}</Badge>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {fmtFecha(mov.fecha)}
                    </span>
                    {vencAlerta && (
                      <Badge variant={vencAlerta === 'vencida' ? 'debe' : 'warning'}>
                        {vencAlerta === 'vencida' ? 'Vencida' : 'Por vencer'}
                      </Badge>
                    )}
                  </div>

                  <div className="mov-item__desc-block">
                    {mov.numero_comprobante && (
                      <span className="mov-item__desc-line" style={{ fontWeight: 'var(--font-semibold)' }}>
                        Nº {mov.numero_comprobante}
                      </span>
                    )}
                    {(FACTURA_CATEGORIA_LABEL[mov.factura_categoria] || mov.productos?.nombre) && (
                      <span className="mov-item__desc-line">
                        {FACTURA_CATEGORIA_LABEL[mov.factura_categoria] || mov.productos.nombre}
                      </span>
                    )}
                    {mov.fecha_vencimiento && (
                      <span className="mov-item__desc-line">Vto: {fmtFecha(mov.fecha_vencimiento)}</span>
                    )}
                    {mov.descripcion && (
                      <span className="mov-item__desc-line">{mov.descripcion}</span>
                    )}
                  </div>

                  {mov.tipo === 'PAGO' && mov.medio_pago && (
                    <span className="mov-item__neto">
                      {mov.medio_pago}
                      {esChequePago && ` · Nº ${mov.cheque_numero || '—'} · ${mov.cheque_banco || '—'}`}
                    </span>
                  )}

                  {esChequePago && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        Estado del cheque:
                      </span>
                      <select
                        className="select select--sm"
                        style={{ width: 'auto', minWidth: 130, flex: '0 1 auto' }}
                        value={mov.cheque_estado || 'CARTERA'}
                        onChange={e => handleCambiarEstadoCheque(mov, e.target.value)}
                      >
                        {Object.entries(CHEQUE_ESTADO_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {esChequePago && mov.cheque_estado === 'ENDOSADO' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        Endosado a: <strong>{mov.cheque_endosado_a || '—'}</strong>
                        {mov.cheque_endosado_fecha && ` (${fmtFecha(mov.cheque_endosado_fecha)})`}
                      </span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setEndosadoA(mov.cheque_endosado_a || '')
                          setEndosadoFecha(mov.cheque_endosado_fecha || hoy())
                          setConfirmarEndoso(mov)
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  )}

                  {acciones && (
                    <div className="mov-item__acciones--desktop" style={{ marginTop: 4 }}>
                      {acciones}
                    </div>
                  )}
                </div>

                {/* Derecha: importe + acciones */}
                <div className="mov-item__right">
                  <span className="mov-item__monto-valor" style={{ color: colorMonto }}>
                    {efecto === 'debe'  && '+ '}
                    {efecto === 'haber' && '− '}
                    ${fmt(mov.monto)}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => abrirForm(mov)}
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="Editar"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setConfirmarElim(mov)}
                      style={{ color: 'var(--color-error)' }}
                      title="Eliminar"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {acciones && (
                  <div className="mov-item__acciones--mobile" style={{ marginTop: 4 }}>
                    {acciones}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <MovimientoForm
          onSave={handleGuardar}
          onClose={cerrarForm}
          clienteId={clienteId}
          inicial={formInicial ?? formPrefill}
          titulo={formPrefill ? 'Registrar pago' : null}
        />
      )}

      {confirmarElim && (
        <ConfirmDialog
          title="Eliminar movimiento"
          message={`¿Eliminás ${TIPO_LABEL[confirmarElim.tipo]?.toLowerCase()} de $${fmt(confirmarElim.monto)} del ${fmtFecha(confirmarElim.fecha)}?`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmarElim(null)}
          loading={!!deletingId}
        />
      )}

      {confirmarChRech && (
        <ConfirmDialog
          title="Registrar cheque rechazado"
          message={`El cheque Nº ${confirmarChRech.cheque_numero || '—'} se marcó como rechazado. ¿Registramos un movimiento de Cheque rechazado por $${fmt(confirmarChRech.monto)} para que el saldo vuelva a reflejar la deuda?`}
          onConfirm={handleCrearChRech}
          onCancel={() => setConfirmarChRech(null)}
          loading={creandoChRech}
          confirmLabel="Registrar"
          confirmVariant="primary"
        />
      )}

      {confirmarRevertirChRech && (
        <ConfirmDialog
          title="Revertir cheque rechazado"
          message={`Este cheque Nº ${confirmarRevertirChRech.mov.cheque_numero || '—'} tenía ${confirmarRevertirChRech.chRechRelacionados.length === 1 ? 'un movimiento de Cheque rechazado registrado' : `${confirmarRevertirChRech.chRechRelacionados.length} movimientos de Cheque rechazado registrados`}. ¿Lo eliminamos para que el saldo vuelva a como estaba antes del rechazo?`}
          onConfirm={handleRevertirChRech}
          onCancel={() => setConfirmarRevertirChRech(null)}
          loading={revirtiendoChRech}
          confirmLabel="Eliminar"
          confirmVariant="danger"
        />
      )}

      {confirmarEndoso && (
        <ConfirmDialog
          title="Marcar cheque como endosado"
          message={`¿A quién se endosó el cheque Nº ${confirmarEndoso.cheque_numero || '—'}? (a qué proveedor o tercero se lo entregaste)`}
          inputLabel="Endosado a"
          inputValue={endosadoA}
          onInputChange={setEndosadoA}
          dateLabel="Fecha del endoso"
          dateValue={endosadoFecha}
          onDateChange={setEndosadoFecha}
          onConfirm={handleConfirmarEndoso}
          onCancel={() => setConfirmarEndoso(null)}
          loading={guardandoEndoso}
          confirmLabel="Guardar"
          confirmVariant="primary"
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
