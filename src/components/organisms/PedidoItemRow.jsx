import Select from '../atoms/Select'
import Input  from '../atoms/Input'

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PedidoItemRow({ item, productos, onChange, onRemove }) {
  const set = (field, value) => onChange(item.tempId, field, value)

  const up = Number(item.un_pallet) || 0
  const uc = Number(item.un_caja)   || 0
  const tp = (Number(item.pallet) * up) + (Number(item.cajas) * uc) + Number(item.piezas)
  const subtotal = tp * Number(item.precio)

  const handleProductoChange = (e) => {
    const prod = productos.find(p => p.id === e.target.value)
    if (!prod) { onChange(item.tempId, 'producto_id', ''); return }
    onChange(item.tempId, '_select_producto', prod)
  }

  return (
    <div className="item-row">
      {/* Producto */}
      <div className="item-row__producto">
        <div className="item-row__qty-label">Producto</div>
        <Select
          value={item.producto_id || ''}
          onChange={handleProductoChange}
          aria-label="Seleccionar producto"
        >
          <option value="">— Seleccionar producto —</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </Select>
      </div>

      {/* Cantidades */}
      <div className="item-row__quantities">
        <div>
          <div className="item-row__qty-label">Pallet</div>
          <Input
            type="number"
            min="0"
            value={item.pallet}
            onChange={e => set('pallet', e.target.value)}
            className="input-number-compact"
            aria-label="Pallets"
          />
        </div>
        <div>
          <div className="item-row__qty-label">Cajas</div>
          <Input
            type="number"
            min="0"
            value={item.cajas}
            onChange={e => set('cajas', e.target.value)}
            className="input-number-compact"
            aria-label="Cajas"
          />
        </div>
        <div>
          <div className="item-row__qty-label">Piezas</div>
          <Input
            type="number"
            min="0"
            value={item.piezas}
            onChange={e => set('piezas', e.target.value)}
            className="input-number-compact"
            aria-label="Piezas sueltas"
          />
        </div>
      </div>

      {/* Precio + Subtotal */}
      <div className="item-row__prices">
        <div>
          <div className="item-row__qty-label">Precio</div>
          <div className="input-prefix-group">
            <span className="input-prefix-group__symbol">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={item.precio}
              onChange={e => set('precio', e.target.value)}
              className="input-number-compact"
              style={{ width: '100%' }}
              aria-label="Precio unitario"
            />
          </div>
        </div>
        <div>
          <div className="item-row__qty-label">Subtotal</div>
          <div className="item-row__subtotal-value">${fmt(subtotal)}</div>
        </div>
      </div>

      {/* Eliminar */}
      <button
        type="button"
        className="item-row__delete"
        onClick={() => onRemove(item.tempId)}
        aria-label="Eliminar línea"
        title="Eliminar"
      >
        ×
      </button>
    </div>
  )
}
