import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout       from '../templates/AppLayout'
import Badge           from '../atoms/Badge'
import Spinner         from '../atoms/Spinner'
import ConfirmDialog   from '../molecules/ConfirmDialog'
import { useCarteraCheques, cambiarEstadoCheque, eliminarMovimientos } from '../../hooks/useCuentaCorriente'
import { supabase }    from '../../lib/supabaseClient'
import { useToast }    from '../../context/ToastContext'

const CHEQUE_ESTADO_LABEL = {
  CARTERA:    'En cartera',
  DEPOSITADO: 'Depositado',
  ACREDITADO: 'Acreditado',
  RECHAZADO:  'Rechazado',
  ENDOSADO:   'Endosado',
}

const FILTROS = [
  { id: 'todos',      label: 'Todos'       },
  { id: 'CARTERA',    label: 'En cartera'  },
  { id: 'DEPOSITADO', label: 'Depositado'  },
  { id: 'ACREDITADO', label: 'Acreditado'  },
  { id: 'RECHAZADO',  label: 'Rechazado'   },
  { id: 'ENDOSADO',   label: 'Endosado'    },
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

function diasHasta(fechaStr) {
  const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaStr + 'T00:00:00')
  return Math.round((fecha - hoyD) / 86400000)
}

export default function Cheques() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToast()
  const { cheques, loading, fetchCarteraCheques } = useCarteraCheques()

  const clienteIdFiltro = searchParams.get('clienteId')

  const [filtro,          setFiltro]          = useState('todos')
  const [confirmarChRech, setConfirmarChRech] = useState(null)
  const [creandoChRech,   setCreandoChRech]   = useState(false)
  const [confirmarRevertirChRech, setConfirmarRevertirChRech] = useState(null)
  const [revirtiendoChRech,       setRevirtiendoChRech]       = useState(false)
  const [confirmarEndoso, setConfirmarEndoso] = useState(null)
  const [endosadoA,       setEndosadoA]       = useState('')
  const [endosadoFecha,   setEndosadoFecha]   = useState('')
  const [guardandoEndoso, setGuardandoEndoso] = useState(false)

  useEffect(() => { fetchCarteraCheques() }, [fetchCarteraCheques])

  const filtered = cheques
    .filter(c => filtro === 'todos' || c.cheque_estado === filtro)
    .filter(c => !clienteIdFiltro || c.cliente_id === clienteIdFiltro)

  const nombreClienteFiltro = clienteIdFiltro
    ? cheques.find(c => c.cliente_id === clienteIdFiltro)?.clientes?.razon_social
    : null

  const handleCambiarEstado = async (cheque, nuevoEstado) => {
    if (nuevoEstado === 'ENDOSADO') {
      setEndosadoA(cheque.cheque_endosado_a || '')
      setEndosadoFecha(cheque.cheque_endosado_fecha || hoy())
      setConfirmarEndoso(cheque)
      return
    }
    const { error, esRechazo, chRechRelacionados } = await cambiarEstadoCheque(cheque.id, nuevoEstado, cheque.cheque_estado)
    if (error) { addToast(error.message, 'error'); return }
    if (esRechazo) {
      setConfirmarChRech(cheque)
    } else if (chRechRelacionados?.length > 0) {
      setConfirmarRevertirChRech({ cheque, chRechRelacionados })
    } else {
      addToast('Estado del cheque actualizado.')
    }
    fetchCarteraCheques()
  }

  const handleConfirmarEndoso = async () => {
    setGuardandoEndoso(true)
    const { error } = await cambiarEstadoCheque(confirmarEndoso.id, 'ENDOSADO', confirmarEndoso.cheque_estado, {
      cheque_endosado_a:     endosadoA.trim() || null,
      cheque_endosado_fecha: endosadoFecha || null,
    })
    setGuardandoEndoso(false)
    setConfirmarEndoso(null)
    if (error) { addToast(error.message, 'error'); return }
    addToast('Cheque marcado como endosado.')
    fetchCarteraCheques()
  }

  const handleCrearChRech = async () => {
    const cheque = confirmarChRech
    setCreandoChRech(true)
    const { error } = await supabase.from('movimientos_cuenta').insert({
      cliente_id:                cheque.cliente_id,
      tipo:                      'CH-RECH',
      monto:                     cheque.monto,
      fecha:                     hoy(),
      descripcion:               `Cheque rechazado — ${cheque.cheque_banco || ''} Nº ${cheque.cheque_numero || ''}`.trim(),
      movimiento_relacionado_id: cheque.id,
    })
    setCreandoChRech(false)
    setConfirmarChRech(null)
    if (error) { addToast(error.message, 'error'); return }
    addToast('Se registró el cheque rechazado y se actualizó el saldo.')
    fetchCarteraCheques()
  }

  const handleRevertirChRech = async () => {
    const { chRechRelacionados } = confirmarRevertirChRech
    setRevirtiendoChRech(true)
    const { error } = await eliminarMovimientos(chRechRelacionados.map(m => m.id))
    setRevirtiendoChRech(false)
    setConfirmarRevertirChRech(null)
    if (error) { addToast(error.message, 'error'); return }
    addToast('Se eliminó el movimiento de Cheque rechazado y se actualizó el saldo.')
    fetchCarteraCheques()
  }

  return (
    <AppLayout>
      <button className="back-btn" type="button" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Cheques</h1>
          <p className="page-subtitle">
            {clienteIdFiltro
              ? `Mostrando solo los cheques de ${nombreClienteFiltro ?? 'este cliente'}`
              : `${cheques.length} cheque${cheques.length !== 1 ? 's' : ''} en total, de todos los clientes`}
          </p>
        </div>
        {clienteIdFiltro && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSearchParams({})}
          >
            Ver de todos los clientes
          </button>
        )}
      </div>

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

      {loading ? (
        <Spinner size="lg" overlay />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🧾</div>
          <p className="empty-state__title">Sin cheques</p>
          <p className="empty-state__desc">
            {filtro === 'todos'
              ? 'Todavía no se cargó ningún pago con cheque o echeq.'
              : `No hay cheques en estado "${CHEQUE_ESTADO_LABEL[filtro]}".`}
          </p>
        </div>
      ) : (
        <div className="list">
          {filtered.map(c => {
            const vencido = c.cheque_vencimiento
              && diasHasta(c.cheque_vencimiento) < 0
              && (c.cheque_estado === 'CARTERA' || c.cheque_estado === 'DEPOSITADO')

            return (
              <div
                key={c.id}
                className="list-item list-item--clickable"
                onClick={() => navigate(`/cuentas/${c.cliente_id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/cuentas/${c.cliente_id}`)}
              >
                <div className="list-item__body">
                  <p className="list-item__title" style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {c.clientes?.razon_social}
                    </span>
                    {vencido && <Badge variant="warning" style={{ flexShrink: 0 }}>Vencido sin depositar</Badge>}
                  </p>
                  <p className="list-item__meta">
                    {c.medio_pago} · Nº {c.cheque_numero || '—'} · {c.cheque_banco || '—'}
                    {c.cheque_titular && ` · Titular: ${c.cheque_titular}`}
                    {' · Vto: '}{fmtFecha(c.cheque_vencimiento)}
                  </p>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      Estado:
                    </span>
                    <select
                      className="select select--sm"
                      style={{ width: 'auto', minWidth: 130, flex: '0 1 auto' }}
                      value={c.cheque_estado || 'CARTERA'}
                      onChange={e => handleCambiarEstado(c, e.target.value)}
                    >
                      {Object.entries(CHEQUE_ESTADO_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {c.cheque_estado === 'ENDOSADO' && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        Endosado a: <strong>{c.cheque_endosado_a || '—'}</strong>
                        {c.cheque_endosado_fecha && ` (${fmtFecha(c.cheque_endosado_fecha)})`}
                      </span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setEndosadoA(c.cheque_endosado_a || '')
                          setEndosadoFecha(c.cheque_endosado_fecha || hoy())
                          setConfirmarEndoso(c)
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: 'var(--font-bold)', flexShrink: 0 }}>
                  ${fmt(c.monto)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {confirmarChRech && (
        <ConfirmDialog
          title="Registrar cheque rechazado"
          message={`El cheque Nº ${confirmarChRech.cheque_numero || '—'} se marcó como rechazado. ¿Registramos un movimiento de Cheque rechazado por $${fmt(confirmarChRech.monto)} para que el saldo de ${confirmarChRech.clientes?.razon_social ?? 'el cliente'} vuelva a reflejar la deuda?`}
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
          message={`Este cheque Nº ${confirmarRevertirChRech.cheque.cheque_numero || '—'} tenía ${confirmarRevertirChRech.chRechRelacionados.length === 1 ? 'un movimiento de Cheque rechazado registrado' : `${confirmarRevertirChRech.chRechRelacionados.length} movimientos de Cheque rechazado registrados`}. ¿Lo eliminamos para que el saldo de ${confirmarRevertirChRech.cheque.clientes?.razon_social ?? 'el cliente'} vuelva a como estaba antes del rechazo?`}
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
          message={`¿A quién se endosó el cheque Nº ${confirmarEndoso.cheque_numero || '—'} de ${confirmarEndoso.clientes?.razon_social ?? 'este cliente'}? (a qué proveedor o tercero se lo entregaste)`}
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
    </AppLayout>
  )
}
