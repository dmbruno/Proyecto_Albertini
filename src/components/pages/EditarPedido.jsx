import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout        from '../templates/AppLayout'
import Button           from '../atoms/Button'
import Select           from '../atoms/Select'
import Spinner          from '../atoms/Spinner'
import PedidoItemRow    from '../organisms/PedidoItemRow'
import { useClientes }  from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'
import { usePedido }    from '../../hooks/usePedido'
import { useToast }     from '../../context/ToastContext'

function newItem() {
  return { tempId: crypto.randomUUID(), producto_id: '', nombre: '', un_pallet: 0, un_caja: 0, pallet: 0, cajas: 0, piezas: 0, precio: 0 }
}

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function calcSubtotalSec(sec) {
  return sec.items.reduce((sum, item) => {
    const tp = (Number(item.pallet) * (Number(item.un_pallet) || 0))
             + (Number(item.cajas)  * (Number(item.un_caja)   || 0))
             + Number(item.piezas)
    return sum + tp * Number(item.precio)
  }, 0)
}

export default function EditarPedido() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { cargar, actualizar } = usePedido()
  const { addToast } = useToast()

  const { clientes,  loading: lcl } = useClientes()
  const { productos, loading: lpd } = useProductos({ soloActivos: true })

  const [secciones,   setSecciones]   = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    cargar(id).then(({ pedido, items, error }) => {
      if (error) { setError(error.message); setLoadingData(false); return }
      if (pedido.estado !== 'borrador') {
        navigate(`/pedidos/${id}`, { replace: true })
        return
      }
      // Agrupar items por cliente_id para reconstruir secciones
      const byCliente = {}
      items.forEach(item => {
        const cid = item.cliente_id
        if (!byCliente[cid]) {
          byCliente[cid] = { tempId: crypto.randomUUID(), clienteId: cid, items: [] }
        }
        byCliente[cid].items.push({
          tempId:      crypto.randomUUID(),
          producto_id: item.producto_id,
          nombre:      item.productos?.nombre    ?? '',
          un_pallet:   item.productos?.un_pallet ?? 0,
          un_caja:     item.productos?.un_caja   ?? 0,
          pallet:      item.pallet,
          cajas:       item.cajas,
          piezas:      item.piezas,
          precio:      item.precio,
        })
      })
      const loaded = Object.values(byCliente)
      setSecciones(loaded.length > 0 ? loaded : [{ tempId: crypto.randomUUID(), clienteId: '', items: [newItem()] }])
      setLoadingData(false)
    })
  }, [id])

  /* ── sección ── */
  const addSeccion    = () => setSecciones(prev => [...prev, { tempId: crypto.randomUUID(), clienteId: '', items: [newItem()] }])
  const removeSeccion = (secId) => setSecciones(prev => prev.filter(s => s.tempId !== secId))
  const setClienteId  = (secId, val) =>
    setSecciones(prev => prev.map(s => s.tempId === secId ? { ...s, clienteId: val } : s))

  /* ── items ── */
  const addItem    = (secId) => setSecciones(prev => prev.map(s =>
    s.tempId === secId ? { ...s, items: [...s.items, newItem()] } : s
  ))
  const removeItem = (secId, itemId) => setSecciones(prev => prev.map(s =>
    s.tempId === secId ? { ...s, items: s.items.filter(i => i.tempId !== itemId) } : s
  ))
  const handleItemChange = (secId, itemId, field, value) => setSecciones(prev => prev.map(s => {
    if (s.tempId !== secId) return s
    return {
      ...s,
      items: s.items.map(item => {
        if (item.tempId !== itemId) return item
        if (field === '_select_producto') {
          return { ...item, producto_id: value.id, nombre: value.nombre, precio: value.precio_final ?? 0, un_pallet: value.un_pallet ?? 0, un_caja: value.un_caja ?? 0 }
        }
        return { ...item, [field]: value }
      }),
    }
  }))

  const total = secciones.reduce((sum, s) => sum + calcSubtotalSec(s), 0)

  const handleGuardar = async (estado) => {
    const sinCliente = secciones.some(s => !s.clienteId)
    if (sinCliente) { setError('Seleccioná un cliente en cada sección.'); return }
    const sinProductos = secciones.every(s => s.items.filter(i => i.producto_id).length === 0)
    if (sinProductos) { setError('Agregá al menos un producto.'); return }

    setSaving(true)
    setError(null)
    const { error } = await actualizar({ pedidoId: id, secciones, estado })
    setSaving(false)
    if (error) { setError(error.message); addToast(error.message, 'error'); return }
    addToast(estado === 'enviado' ? 'Pedido marcado como enviado.' : 'Cambios guardados correctamente.')
    navigate(`/pedidos/${id}`, { state: { refresh: true } })
  }

  if (loadingData || lcl || lpd) return <AppLayout><Spinner size="lg" overlay /></AppLayout>

  return (
    <AppLayout>
      <button className="back-btn" type="button" onClick={() => navigate(`/pedidos/${id}`)}>
        ← Volver al pedido
      </button>

      <div className="page-header">
        <h1 className="page-title">Editar pedido</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {secciones.map((sec, idx) => (
        <div key={sec.tempId} className="pedido-seccion">
          <div className="pedido-seccion__header">
            <span className="pedido-seccion__label">Cliente {idx + 1}</span>
            <Select
              value={sec.clienteId}
              onChange={e => setClienteId(sec.tempId, e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">— Seleccionar cliente —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </Select>
            {secciones.length > 1 && (
              <button
                type="button"
                className="pedido-seccion__remove"
                onClick={() => removeSeccion(sec.tempId)}
                title="Quitar cliente"
              >×</button>
            )}
          </div>

          <div className="items-table-header">
            <span>Producto</span>
            <span style={{ textAlign: 'center' }}>Pallet</span>
            <span style={{ textAlign: 'center' }}>Cajas</span>
            <span style={{ textAlign: 'center' }}>Piezas</span>
            <span>Precio</span>
            <span>Subtotal</span>
            <span></span>
          </div>

          {sec.items.map(item => (
            <PedidoItemRow
              key={item.tempId}
              item={item}
              productos={productos}
              onChange={(iId, f, v) => handleItemChange(sec.tempId, iId, f, v)}
              onRemove={(iId) => removeItem(sec.tempId, iId)}
            />
          ))}

          <div className="pedido-seccion__footer">
            <Button variant="secondary" size="sm" onClick={() => addItem(sec.tempId)}>
              + Agregar producto
            </Button>
            <span className="pedido-seccion__subtotal">
              Subtotal: <strong>${fmt(calcSubtotalSec(sec))}</strong>
            </span>
          </div>
        </div>
      ))}

      <Button variant="secondary" onClick={addSeccion} style={{ marginBottom: 'var(--space-6)' }}>
        + Agregar cliente
      </Button>

      <div className="pedido-total">
        <span className="pedido-total__label">Total del pedido</span>
        <span className="pedido-total__amount">${fmt(total)}</span>
      </div>

      <div className="pedido-actions">
        <Button variant="secondary" size="lg" loading={saving} onClick={() => handleGuardar('borrador')}>
          💾 Guardar borrador
        </Button>
        <Button variant="primary" size="lg" loading={saving} onClick={() => handleGuardar('enviado')}>
          ✓ Marcar como enviado
        </Button>
      </div>
    </AppLayout>
  )
}
