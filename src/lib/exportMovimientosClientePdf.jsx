import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'
import { TIPO_LABEL, efectoDe, FACTURA_CATEGORIA_LABEL } from './movimientos'

const C = {
  primary:      '#1a4b8b',
  primaryLight: '#e8f0fb',
  text:         '#1e293b',
  muted:        '#64748b',
  subtle:       '#94a3b8',
  border:       '#e2e8f0',
  stripe:       '#f8fafc',
  white:        '#ffffff',
  success:      '#16a34a',
  error:        '#dc2626',
}

const COL = {
  fecha:    { width: 55 },
  cbte:     { width: 55 },
  vto:      { width: 60 },
  numero:   { width: 70 },
  producto: { flex: 1 },
  debe:     { width: 80,  textAlign: 'right' },
  haber:    { width: 80,  textAlign: 'right' },
  saldo:    { width: 95,  textAlign: 'right' },
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: C.text,
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 36,
    backgroundColor: C.white,
  },

  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
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
    fontSize: 11,
    color: C.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  docFecha: {
    fontSize: 8,
    color: C.muted,
    marginTop: 3,
  },

  clienteBlock: { marginBottom: 12 },
  clienteNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.text,
  },
  rango: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 2,
  },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.stripe },
  tableRowAnterior: { backgroundColor: C.primaryLight },
  td: { fontSize: 8, color: C.text },
  tdMuted: { fontSize: 8, color: C.subtle },
  tdBold: { fontFamily: 'Helvetica-Bold' },

  totalGeneral: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.white,
  },

  pageFooter: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: C.subtle },
})

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function signedMonto(mov) {
  const efecto = efectoDe(mov)
  if (efecto === 'debe')  return Number(mov.monto)
  if (efecto === 'haber') return -Number(mov.monto)
  return 0
}

function ordenAsc(movs) {
  return [...movs].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1
    return (a.created_at || '') < (b.created_at || '') ? -1 : 1
  })
}

function MovimientosClientePDF({ cliente, filas, saldoAnterior, mostrarSaldoAnterior, desde, hasta, fecha }) {
  const saldoFinal = filas.length > 0 ? filas[filas.length - 1].saldo : saldoAnterior

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>

        <View style={s.docHeader} fixed>
          <View>
            <Text style={s.brandName}>ALBERTINI</Text>
            <Text style={s.brandSub}>Gestión de pedidos</Text>
          </View>
          <View style={s.docMetaBlock}>
            <Text style={s.docLabel}>Estado de cuenta</Text>
            <Text style={s.docFecha}>Generado: {fecha}</Text>
          </View>
        </View>

        <View style={s.clienteBlock}>
          <Text style={s.clienteNombre}>{cliente.razon_social}</Text>
          <Text style={s.rango}>
            {desde || hasta
              ? `Movimientos desde ${desde ? fmtFecha(desde) : 'el inicio'} hasta ${hasta ? fmtFecha(hasta) : 'hoy'}`
              : 'Todos los movimientos'}
          </Text>
        </View>

        <View style={s.tableHead} fixed>
          <Text style={[s.th, COL.fecha]}>Fecha</Text>
          <Text style={[s.th, COL.cbte]}>Cbte</Text>
          <Text style={[s.th, COL.vto]}>Vto. Fact</Text>
          <Text style={[s.th, COL.numero]}>Número</Text>
          <Text style={[s.th, COL.producto]}>Producto</Text>
          <Text style={[s.th, COL.debe]}>Debe</Text>
          <Text style={[s.th, COL.haber]}>Haber</Text>
          <Text style={[s.th, COL.saldo]}>Saldo</Text>
        </View>

        {mostrarSaldoAnterior && (
          <View style={[s.tableRow, s.tableRowAnterior]} wrap={false}>
            <Text style={[s.td, s.tdBold, COL.fecha]}></Text>
            <Text style={[s.td, s.tdBold, COL.cbte]}></Text>
            <Text style={[s.td, COL.vto]}></Text>
            <Text style={[s.td, COL.numero]}></Text>
            <Text style={[s.td, s.tdBold, COL.producto]}>Saldo anterior</Text>
            <Text style={[s.td, COL.debe]}></Text>
            <Text style={[s.td, COL.haber]}></Text>
            <Text style={[s.td, s.tdBold, COL.saldo]}>{fmt(saldoAnterior)}</Text>
          </View>
        )}

        {filas.map(({ mov, saldo }, i) => {
          const efecto   = efectoDe(mov)
          const producto = FACTURA_CATEGORIA_LABEL[mov.factura_categoria] || mov.productos?.nombre || ''
          return (
            <View key={mov.id} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]} wrap={false}>
              <Text style={[s.td, COL.fecha]}>{fmtFecha(mov.fecha)}</Text>
              <Text style={[s.td, COL.cbte]}>{TIPO_LABEL[mov.tipo] ?? mov.tipo}</Text>
              <Text style={[s.tdMuted, COL.vto]}>{fmtFecha(mov.fecha_vencimiento)}</Text>
              <Text style={[s.td, COL.numero]}>{mov.numero_comprobante || ''}</Text>
              <Text style={[s.td, COL.producto]}>{producto}</Text>
              <Text style={[s.td, COL.debe]}>{efecto === 'debe' ? fmt(mov.monto) : ''}</Text>
              <Text style={[s.td, COL.haber]}>{efecto === 'haber' ? fmt(mov.monto) : ''}</Text>
              <Text style={[s.td, s.tdBold, COL.saldo]}>{fmt(saldo)}</Text>
            </View>
          )
        })}

        <View style={s.totalGeneral}>
          <Text style={s.totalLabel}>Saldo final</Text>
          <Text style={s.totalValue}>{fmt(saldoFinal)}</Text>
        </View>

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

export async function exportarMovimientosClientePDF({ cliente, movimientos, desde, hasta }) {
  const todosAsc = ordenAsc(movimientos)
  const previos   = desde ? todosAsc.filter(m => m.fecha < desde) : []
  const enRango   = todosAsc.filter(m => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta))

  const saldoAnterior = previos.reduce((acc, m) => acc + signedMonto(m), 0)

  let saldoCorrida = saldoAnterior
  const filas = enRango.map(mov => {
    saldoCorrida += signedMonto(mov)
    return { mov, saldo: saldoCorrida }
  })

  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const blob = await pdf(
    <MovimientosClientePDF
      cliente={cliente}
      filas={filas}
      saldoAnterior={saldoAnterior}
      mostrarSaldoAnterior={!!desde && previos.length > 0}
      desde={desde}
      hasta={hasta}
      fecha={fecha}
    />
  ).toBlob()

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `movimientos_${cliente.razon_social.toLowerCase().replace(/[\s/,]+/g, '_')}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
