import { useState }           from 'react'
import { useNavigate }         from 'react-router-dom'
import AppLayout               from '../templates/AppLayout'
import Button                  from '../atoms/Button'
import Select                  from '../atoms/Select'
import Spinner                 from '../atoms/Spinner'
import PedidoItemRow           from '../organisms/PedidoItemRow'
import { useClientes }         from '../../hooks/useClientes'
import { useProductos }        from '../../hooks/useProductos'
import { usePedido }           from '../../hooks/usePedido'
import { useAuth }             from '../../context/AuthContext'
import { useToast }            from '../../context/ToastContext'
import { calcPrecioFinal, calcTotalPiezas } from '../../lib/precios'
import { useListasPrecios } from '../../hooks/useListasPrecios'

function newItem() {
  return { tempId: crypto.randomUUID(), producto_id: '', nombre: '', un_pallet: 0, un_caja: 0, pallet: 0, cajas: 0, precio: 0 }
}
function newSeccion() {
  return { tempId: crypto.randomUUID(), clienteId: '', listaId: '', items: [newItem()] }
}

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function calcSubtotalSec(sec) {
  return sec.items.reduce((sum, item) => {
    const piezas = calcTotalPiezas(item.pallet, item.cajas, item.un_pallet, item.un_caja)
    return sum + piezas * Number(item.precio)
  }, 0)
}

export default function NuevoPedido() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { guardar }  = usePedido()
  const { addToast } = useToast()

  const { clientes,  loading: lcl } = useClientes()
  const { productos, loading: lpd } = useProductos({ soloActivos: true })
  const { listas } = useListasPrecios()

  const [secciones, setSecciones] = useState([newSeccion()])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  /* ── sección ── */
  const addSeccion    = () => setSecciones(prev => [...prev, newSeccion()])
  const removeSeccion = (secId) => setSecciones(prev => prev.filter(s => s.tempId !== secId))
  const setClienteId  = (secId, val) => {
    const cliente = clientes.find(c => c.id === val)
    const listaId = cliente?.lista_precios_id ?? ''
    setSecciones(prev => prev.map(s => s.tempId === secId ? { ...s, clienteId: val, listaId } : s))
  }
  const setListaId = (secId, listaId) => setSecciones(prev => prev.map(s => {
    if (s.tempId !== secId) return s
    const lista = listas.find(l => l.id === listaId) ?? null
    return {
      ...s,
      listaId,
      items: s.items.map(item => {
        if (!item.producto_id) return item
        const prod = productos.find(p => p.id === item.producto_id)
        if (!prod) return item
        return { ...item, precio: calcPrecioFinal(prod.precio ?? 0, lista) }
      }),
    }
  }))

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
          const lista       = listas.find(l => l.id === s.listaId) ?? null
          const precioFinal = calcPrecioFinal(value.precio ?? 0, lista)
          return { ...item, producto_id: value.id, nombre: value.nombre, precio: precioFinal, un_pallet: value.un_pallet ?? 0, un_caja: value.un_caja ?? 0 }
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
    const { data, error } = await guardar({ secciones, estado, userId: user.id })
    setSaving(false)
    if (error) { setError(error.message); addToast(error.message, 'error'); return }
    addToast(estado === 'enviado' ? 'Pedido marcado como enviado.' : 'Borrador guardado correctamente.')
    navigate(`/pedidos/${data.id}`)
  }

  if (lcl || lpd) return <AppLayout><Spinner size="lg" overlay /></AppLayout>

  return (
    <AppLayout>
      <a className="back-btn" href="/pedidos" onClick={e => { e.preventDefault(); navigate('/pedidos') }}>
        ← Volver a pedidos
      </a>

      <div className="page-header">
        <h1 className="page-title">Nuevo pedido</h1>
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

          <div className="pedido-seccion__zona">
            <span className="pedido-seccion__label">Zona</span>
            <Select
              value={sec.listaId}
              onChange={e => setListaId(sec.tempId, e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">— Seleccionar zona de precios —</option>
              {listas.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </Select>
            {!sec.listaId && (
              <span className="pedido-seccion__zona-warn">
                ⚠ Necesaria para calcular precios
              </span>
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
