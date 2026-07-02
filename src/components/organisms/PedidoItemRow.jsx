import Select from '../atoms/Select'
import Input  from '../atoms/Input'
import { calcTotalPiezas, calcSinIva, calcKgEstimado } from '../../lib/precios'

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PedidoItemRow({ item, productos, onChange, onRemove }) {
  const set = (field, value) => onChange(item.tempId, field, value)

  const cajasPerPallet = Number(item.un_pallet) || 0
  const piezasPerCaja  = Number(item.un_caja)   || 0
  const totalCajas  = (Number(item.pallet) * cajasPerPallet) + Number(item.cajas)
  const totalPiezas = calcTotalPiezas(item.pallet, item.cajas, item.un_pallet, item.un_caja)
  const sinIva      = calcSinIva(Number(item.precio) || 0)
  const kgEstimado  = calcKgEstimado(totalPiezas)

  const handleProductoChange = (e) => {
    const prod = productos.find(p => p.id === e.target.value)
    if (!prod) { onChange(item.tempId, 'producto_id', ''); return }
    onChange(item.tempId, '_select_producto', prod)
  }

  const piezasLabel = totalPiezas > 0
    ? totalPiezas.toLocaleString('es-AR')
    : '—'

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
            aria-label="Cajas adicionales"
          />
        </div>
        <div>
          <div className="item-row__qty-label">Piezas</div>
          <div className="input input-number-compact item-row__piezas-display">{piezasLabel}</div>
        </div>

        {/* Info de desglose — solo mobile */}
        {item.producto_id && cajasPerPallet > 0 && (
          <div className="item-row__piezas-info">
            {Number(item.pallet) > 0
              ? `${item.pallet} pallet × ${cajasPerPallet} = ${totalCajas} cajas`
              : `${item.cajas} cajas`}
            {' '}→ {totalPiezas > 0 ? `${totalPiezas.toLocaleString('es-AR')} piezas` : '0 piezas'}
          </div>
        )}
      </div>

      {/* Precio + Sin IVA + Kg estimado */}
      <div className="item-row__prices">
        <div>
          <div className="item-row__qty-label">Precio x Kg</div>
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
          <div className="item-row__qty-label">Precio s/Iva</div>
          <div className="item-row__readonly-value">${fmt(sinIva)}</div>
        </div>
        <div>
          <div className="item-row__qty-label">Kg est.</div>
          <div className="item-row__readonly-value">{kgEstimado.toLocaleString('es-AR')} kg</div>
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
