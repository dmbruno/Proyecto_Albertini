import { useState, useEffect } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import AppLayout            from '../templates/AppLayout'
import Spinner              from '../atoms/Spinner'
import { useEstadisticas }  from '../../hooks/useEstadisticas'

/* ── helpers ── */
function hoy() {
  return new Date().toISOString().slice(0, 10)
}
function restarDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtFecha(str) {
  if (!str) return ''
  const [, m, d] = str.split('-')
  return `${d}/${m}`
}
function truncar(str, max = 22) {
  return str?.length > max ? str.slice(0, max) + '…' : str
}

const PRESETS = [
  { id: '7d',  label: '7 días',   desde: () => restarDias(7)  },
  { id: '30d', label: '30 días',  desde: () => restarDias(30) },
  { id: '90d', label: '90 días',  desde: () => restarDias(90) },
  { id: 'custom', label: 'Personalizado', desde: null },
]

/* ── tooltip personalizado para el area chart ── */
function TooltipPedido({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip__fecha">{fmtFecha(label)}</p>
      <p className="stats-tooltip__valor">{fmt(payload[0].value)}</p>
    </div>
  )
}
function TooltipBar({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip__fecha">{label}</p>
      <p className="stats-tooltip__valor">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function Estadisticas() {
  const [preset,  setPreset]  = useState('30d')
  const [desde,   setDesde]   = useState(restarDias(30))
  const [hasta,   setHasta]   = useState(hoy())

  const {
    loading, error,
    ventasPorPedido, topProductos, topClientes,
    totalFacturado, cantidadPedidos, mejorProducto, mejorCliente,
    fetchEstadisticas,
  } = useEstadisticas()

  useEffect(() => {
    fetchEstadisticas({ desde, hasta })
  }, [desde, hasta])

  const handlePreset = (p) => {
    setPreset(p.id)
    if (p.id !== 'custom') {
      setDesde(p.desde())
      setHasta(hoy())
    }
  }

  const barHeightProductos = Math.max(180, topProductos.length * 44)
  const barHeightClientes  = Math.max(180, topClientes.length  * 44)

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-subtitle">Análisis de ventas por período</p>
        </div>
      </div>

      {/* ── filtro de fechas ── */}
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

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="stats-kpis">
            <div className="stats-kpi">
              <p className="stats-kpi__label">Total facturado</p>
              <p className="stats-kpi__value">{fmt(totalFacturado)}</p>
            </div>
            <div className="stats-kpi">
              <p className="stats-kpi__label">Pedidos</p>
              <p className="stats-kpi__value">{cantidadPedidos}</p>
            </div>
            <div className="stats-kpi">
              <p className="stats-kpi__label">Producto estrella</p>
              <p className="stats-kpi__value stats-kpi__value--sm">{mejorProducto}</p>
            </div>
            <div className="stats-kpi">
              <p className="stats-kpi__label">Cliente top</p>
              <p className="stats-kpi__value stats-kpi__value--sm">{mejorCliente}</p>
            </div>
          </div>

          {ventasPorPedido.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📊</div>
              <p className="empty-state__title">Sin datos en este período</p>
              <p className="empty-state__desc">Probá con un rango de fechas más amplio.</p>
            </div>
          ) : (
            <>
              {/* ── Gráfico 1: ventas por pedido ── */}
              <div className="stats-card">
                <p className="stats-card__title">Ventas por pedido</p>
                <p className="stats-card__sub">Total facturado en cada pedido del período</p>
                <div className="stats-chart-wrap">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={ventasPorPedido.map(p => ({ ...p, fecha: fmtFecha(p.fecha) }))}
                      margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#1a4b8b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1a4b8b" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={v => '$' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'k' : v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        width={52}
                      />
                      <Tooltip content={<TooltipPedido />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#1a4b8b"
                        strokeWidth={2.5}
                        fill="url(#gradTotal)"
                        dot={{ r: 4, fill: '#1a4b8b', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#ea580c', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Gráficos 2 y 3 ── */}
              <div className="stats-row">

                {/* Top productos */}
                <div className="stats-card">
                  <p className="stats-card__title">Productos más vendidos</p>
                  <p className="stats-card__sub">Por monto total acumulado</p>
                  <div className="stats-chart-wrap">
                    <ResponsiveContainer width="100%" height={barHeightProductos}>
                      <BarChart
                        data={topProductos.map(p => ({ ...p, nombre: truncar(p.nombre, 20) }))}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'k' : v}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          tick={{ fontSize: 10, fill: '#1e293b' }}
                          tickLine={false}
                          axisLine={false}
                          width={130}
                        />
                        <Tooltip content={<TooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar
                          dataKey="total"
                          fill="#1a4b8b"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top clientes */}
                <div className="stats-card">
                  <p className="stats-card__title">Clientes que más compran</p>
                  <p className="stats-card__sub">Por monto total acumulado</p>
                  <div className="stats-chart-wrap">
                    <ResponsiveContainer width="100%" height={barHeightClientes}>
                      <BarChart
                        data={topClientes.map(c => ({ ...c, nombre: truncar(c.nombre, 20) }))}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'k' : v}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          tick={{ fontSize: 10, fill: '#1e293b' }}
                          tickLine={false}
                          axisLine={false}
                          width={130}
                        />
                        <Tooltip content={<TooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar
                          dataKey="total"
                          fill="#ea580c"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}
