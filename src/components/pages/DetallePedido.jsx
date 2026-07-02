import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import AppLayout  from '../templates/AppLayout'
import Badge      from '../atoms/Badge'
import Button     from '../atoms/Button'
import Spinner    from '../atoms/Spinner'
import { usePedido }                  from '../../hooks/usePedido'
import { exportarPedidoPDF }          from '../../lib/exportPdf'
import { calcSinIva, calcKgEstimado } from '../../lib/precios'
import { agruparConZonas }            from '../../lib/zonas'
import { useToast }                   from '../../context/ToastContext'

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(str) {
  if (!str) return ''
  return new Date(str + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const LABEL_ESTADO = {
  borrador: 'Borrador',
  enviado:  'Enviado',
}

function agruparPorCliente(items) {
  const map = {}
  items.forEach(item => {
    const cid = item.cliente_id
    if (!map[cid]) map[cid] = { cliente: item.clientes, items: [] }
    map[cid].items.push(item)
  })
  return Object.values(map)
}

export default function DetallePedido() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const { cargar, marcarEnviado } = usePedido()
  const { addToast } = useToast()

  const [pedido,  setPedido]  = useState(null)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    cargar(id).then(({ pedido, items, error }) => {
      if (error) { setError(error.message); setLoading(false); return }
      setPedido(pedido)
      setItems(items)
      setLoading(false)
    })
  }, [id, location.key])

  const handleMarcarEnviado = async () => {
    setMarking(true)
    const { error } = await marcarEnviado(id)
    setMarking(false)
    if (error) { addToast(error.message, 'error'); return }
    addToast('Pedido marcado como enviado.')
    setPedido(prev => ({ ...prev, estado: 'enviado' }))
  }

  const [exporting, setExporting] = useState(false)

  const handleExportPDF = async () => {
    if (!pedido) return
    setExporting(true)
    try {
      const secciones   = agruparPorCliente(items)
      const totalPiezas = items.reduce((sum, i) => sum + (i.piezas || 0), 0)
      const totalKg     = totalPiezas * 4
      await exportarPedidoPDF(pedido, secciones, { totalPiezas, totalKg })
      addToast('PDF descargado correctamente.', 'info')
    } catch {
      addToast('Error al generar el PDF.', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <AppLayout><Spinner size="lg" overlay /></AppLayout>
  if (error)   return <AppLayout><div className="error-banner">{error}</div></AppLayout>
  if (!pedido) return null

  const secciones   = agruparPorCliente(items)
  const totalPiezas = items.reduce((sum, i) => sum + (i.piezas || 0), 0)
  const totalKg     = totalPiezas * 4

  return (
    <AppLayout>
      <button className="back-btn" type="button" onClick={() => navigate('/pedidos')}>
        ← Volver a pedidos
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Pedido del {fmtFecha(pedido.fecha)}</h1>
          <p className="page-subtitle">
            <Badge variant={pedido.estado}>{LABEL_ESTADO[pedido.estado] ?? pedido.estado}</Badge>
            &nbsp;·&nbsp; {secciones.length} {secciones.length === 1 ? 'cliente' : 'clientes'}
            &nbsp;·&nbsp; {items.length} líneas
          </p>
        </div>
        <div className="detalle-acciones">
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar PDF
          </Button>
          {pedido.estado === 'borrador' && (
            <>
              <Link to={`/pedidos/${id}/editar`} style={{ display: 'contents' }}>
                <Button variant="secondary" size="sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </Button>
              </Link>
              <Button variant="primary" size="sm" loading={marking} onClick={handleMarcarEnviado}>
                ✓ Marcar como enviado
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Secciones por cliente, agrupadas por zona */}
      {agruparConZonas(secciones, sec => sec.cliente?.listas_precios?.nombre).map((entry, idx) => {
        if (entry._esZona) {
          return (
            <div key={`zona-${idx}`} className="detalle-zona-separador">
              {entry.nombre}
            </div>
          )
        }

        const { cliente, items: secItems } = entry
        const kgSeccion = secItems.reduce((sum, i) => sum + calcKgEstimado(i.piezas), 0)
        const zona = cliente?.listas_precios?.nombre ?? 'Sin zona asignada'
        return (
          <div key={idx} className="detalle-seccion">
            <div className="detalle-seccion__header">
              <div>
                <p className="detalle-seccion__nombre">{cliente?.razon_social ?? '—'}</p>
                <p className="detalle-seccion__meta">
                  {[cliente?.cuit, cliente?.tipo_comprobante, cliente?.direccion].filter(Boolean).join(' · ')}
                </p>
                {cliente?.comentario && (
                  <p className="detalle-seccion__comentario">{cliente.comentario}</p>
                )}
              </div>
              <span className="detalle-seccion__zona">{zona}</span>
            </div>

            <div className="detalle-items">
              <div className="detalle-items-scroll">
                <table className="detalle-items__table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num">Pallet</th>
                      <th className="num">Cajas</th>
                      <th className="num">Piezas</th>
                      <th className="num">Precio x Kg</th>
                      <th className="num">Precio s/Iva</th>
                      <th className="num">Kg est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secItems.map(item => (
                      <tr key={item.id}>
                        <td data-label="Producto">{item.productos?.nombre ?? '—'}</td>
                        <td className="num" data-label="Pallet">{item.pallet}</td>
                        <td className="num" data-label="Cajas">{item.cajas}</td>
                        <td className="num" data-label="Piezas">{item.piezas}</td>
                        <td className="num" data-label="Precio x Kg">${fmt(item.precio)}</td>
                        <td className="num" data-label="Precio s/Iva">${fmt(calcSinIva(item.precio))}</td>
                        <td className="num" data-label="Kg est.">{calcKgEstimado(item.piezas).toLocaleString('es-AR')} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detalle-seccion__kg-footer">
              <span className="detalle-seccion__kg-footer-label">Kg estimados</span>
              <span className="detalle-seccion__kg-footer-value">{kgSeccion.toLocaleString('es-AR')} kg</span>
            </div>
          </div>
        )
      })}

      {/* KG del pedido */}
      <div className="detalle-kg-box">
        <div className="detalle-kg-box__info">
          <span className="detalle-kg-box__label">Total KG del pedido</span>
          <span className="detalle-kg-box__formula">
            {totalPiezas.toLocaleString('es-AR')} piezas × 4 kg/pieza
          </span>
        </div>
        <span className="detalle-kg-box__value">
          {totalKg.toLocaleString('es-AR')} KG
        </span>
      </div>
    </AppLayout>
  )
}
