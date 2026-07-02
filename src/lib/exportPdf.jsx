import {
  Document, Page, View, Text,
  StyleSheet, pdf,
} from '@react-pdf/renderer'
import { calcSinIva, calcKgEstimado } from './precios'
import { agruparConZonas } from './zonas'

/* ── palette ── */
const C = {
  primary:       '#1a4b8b',
  primaryMid:    '#2563b0',
  primaryLight:  '#e8f0fb',
  accent:        '#ea580c',
  text:          '#1e293b',
  muted:         '#64748b',
  subtle:        '#94a3b8',
  border:        '#e2e8f0',
  stripe:        '#f8fafc',
  white:         '#ffffff',
}

const COL = {
  producto:    { flex: 1 },
  num:         { width: 38, textAlign: 'center' },
  precio:      { width: 76, textAlign: 'right' },
  precioSinIva:{ width: 76, textAlign: 'right' },
  kg:          { width: 60, textAlign: 'right' },
}

const s = StyleSheet.create({
  /* página */
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  /* ── cabecera del documento ── */
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: C.primary,
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  docMetaBlock: {
    alignItems: 'flex-end',
  },
  docLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: C.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  docFecha: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 3,
  },
  estadoPill: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  estadoText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* separador de zona */
  zonaRow: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 2,
  },
  zonaTexto: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  /* ── bloque por cliente ── */
  seccion: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },

  /* cabecera azul del cliente */
  clienteBar: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clienteNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.white,
  },
  clienteTipo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* fila de datos fiscales */
  clienteDatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dato: {
    flexDirection: 'row',
    marginRight: 20,
    marginBottom: 2,
  },
  datoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    marginRight: 3,
  },
  datoValue: {
    fontSize: 7.5,
    color: C.text,
  },
  comentarioBand: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  comentario: {
    fontSize: 8,
    color: '#1e3a5f',
    fontFamily: 'Helvetica-Oblique',
  },

  /* tabla de productos */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.stripe,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.stripe,
  },
  td: {
    fontSize: 8.5,
    color: C.text,
  },
  tdBold: {
    fontFamily: 'Helvetica-Bold',
  },

  /* kg estimados por cliente */
  secKgRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  secKgLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginRight: 12,
  },
  secKgValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: C.primary,
    width: 80,
    textAlign: 'right',
  },

  /* bloque KG */
  kgBox: {
    marginTop: 10,
    backgroundColor: C.primaryLight,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kgLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  kgFormula: {
    fontSize: 7.5,
    color: C.muted,
  },
  kgValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.primary,
  },

  /* pie de página */
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: C.subtle,
  },
})

/* ── helpers ── */
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
/* ── componente PDF ── */
function PedidoPDF({ pedido, secciones, totalPiezas, totalKg }) {
  const fecha = pedido.fecha
    ? new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : ''

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* cabecera del documento */}
        <View style={s.docHeader} fixed>
          <View>
            <Text style={s.brandName}>ALBERTINI</Text>
            <Text style={s.brandSub}>Gestión de pedidos</Text>
          </View>
          <View style={s.docMetaBlock}>
            <Text style={s.docLabel}>Pedido a fábrica</Text>
            <Text style={s.docFecha}>Fecha: {fecha}</Text>
          </View>
        </View>

        {/* secciones por cliente, ordenadas por zona */}
        {agruparConZonas(secciones, sec => sec.cliente?.listas_precios?.nombre).map((entry, idx) => {
          if (entry._esZona) {
            return (
              <View key={`zona-${idx}`} style={s.zonaRow}>
                <Text style={s.zonaTexto}>{entry.nombre}</Text>
              </View>
            )
          }

          const { cliente, items } = entry
          const kgSeccion = items.reduce((sum, i) => sum + calcKgEstimado(i.piezas), 0)
          return (
            <View key={idx} style={s.seccion} wrap={false}>

              {/* barra del cliente */}
              <View style={s.clienteBar}>
                <Text style={s.clienteNombre}>{cliente?.razon_social ?? '—'}</Text>
                {cliente?.tipo_comprobante
                  ? <Text style={s.clienteTipo}>{cliente.tipo_comprobante}</Text>
                  : null}
              </View>

              {/* datos fiscales */}
              <View style={s.clienteDatos}>
                {cliente?.cuit && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>CUIT:</Text>
                    <Text style={s.datoValue}>{cliente.cuit}</Text>
                  </View>
                )}
                {cliente?.direccion && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>Dirección:</Text>
                    <Text style={s.datoValue}>{cliente.direccion}</Text>
                  </View>
                )}
                {cliente?.entrega && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>Entrega:</Text>
                    <Text style={s.datoValue}>{cliente.entrega}</Text>
                  </View>
                )}
              </View>

              {/* encabezado de tabla */}
              <View style={s.tableHead}>
                <Text style={[s.th, COL.producto]}>Producto</Text>
                <Text style={[s.th, COL.num]}>Pallet</Text>
                <Text style={[s.th, COL.num]}>Cajas</Text>
                <Text style={[s.th, COL.num]}>Piezas</Text>
                <Text style={[s.th, COL.precio]}>Precio x Kg</Text>
                <Text style={[s.th, COL.precioSinIva]}>Precio s/Iva</Text>
                <Text style={[s.th, COL.kg]}>Kg est.</Text>
              </View>

              {/* filas */}
              {items.map((item, i) => (
                <View
                  key={item.id ?? i}
                  style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}
                >
                  <Text style={[s.td, COL.producto]}>{item.productos?.nombre ?? '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.pallet || '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.cajas  || '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.piezas || '—'}</Text>
                  <Text style={[s.td, COL.precio]}>{fmt(item.precio)}</Text>
                  <Text style={[s.td, COL.precioSinIva]}>{fmt(item.precio_sin_iva ?? calcSinIva(item.precio))}</Text>
                  <Text style={[s.td, s.tdBold, COL.kg]}>{calcKgEstimado(item.piezas).toLocaleString('es-AR')} kg</Text>
                </View>
              ))}

              {/* kg estimados del cliente */}
              <View style={s.secKgRow}>
                <Text style={s.secKgLabel}>Kg estimados {cliente?.razon_social ?? ''}</Text>
                <Text style={s.secKgValue}>{kgSeccion.toLocaleString('es-AR')} kg</Text>
              </View>

              {/* comentario: cierre visual del bloque */}
              {cliente?.comentario && (
                <View style={s.comentarioBand}>
                  <Text style={s.comentario}>{cliente.comentario}</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* KG */}
        {totalKg != null && (
          <View style={s.kgBox}>
            <View>
              <Text style={s.kgLabel}>Total KG del pedido</Text>
              <Text style={s.kgFormula}>
                {(totalPiezas ?? 0).toLocaleString('es-AR')} piezas × 4 kg/pieza
              </Text>
            </View>
            <Text style={s.kgValue}>{(totalKg ?? 0).toLocaleString('es-AR')} KG</Text>
          </View>
        )}

        {/* pie de página */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>Albertini — Gestión de pedidos</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function exportarPedidoPDF(pedido, secciones, { totalPiezas, totalKg } = {}) {
  const blob = await pdf(
    <PedidoPDF
      pedido={pedido}
      secciones={secciones}
      totalPiezas={totalPiezas}
      totalKg={totalKg}
    />
  ).toBlob()
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `pedido_${pedido.fecha ?? Date.now()}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
