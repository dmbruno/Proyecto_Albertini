import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'

/* ── Datos del negocio ── editar acá si cambian ── */
const EMPRESA = 'LACTEOS CERUTTI S.R.L.'
const EMAIL   = 'albertini.ventas@gmail.com'
const CELULAR = '387-5032345'

function fmt(n) {
  if (n == null) return '—'
  return '$ ' + Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const amarillo = '#FFD700'
const negro    = '#000000'
const textoOsc = '#1e293b'
const white    = '#ffffff'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: textoOsc,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 38,
    backgroundColor: white,
  },

  headerBlock: {
    marginBottom: 14,
  },
  empresa: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: textoOsc,
    marginBottom: 5,
  },
  pedidosLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  contacto: {
    fontSize: 9,
    color: '#2563eb',
    marginBottom: 2,
  },
  celular: {
    fontSize: 9,
    color: textoOsc,
    marginBottom: 2,
  },

  clienteFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 2,
  },
  clienteTexto: {
    fontSize: 10,
    fontFamily: 'Helvetica-BoldOblique',
    color: textoOsc,
  },
  fechaTexto: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: textoOsc,
  },

  /* tabla */
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: amarillo,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: negro,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  thProducto: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: negro,
    textTransform: 'uppercase',
  },
  thPrecio: {
    width: 110,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: negro,
    textAlign: 'right',
    textTransform: 'uppercase',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: negro,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5',
  },
  tdProducto: {
    flex: 1,
    fontSize: 9,
    color: textoOsc,
  },
  tdPrecio: {
    width: 110,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: textoOsc,
    textAlign: 'right',
  },

  footer: {
    position: 'absolute',
    bottom: 18,
    left: 38,
    right: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

function ListaPrecioPDF({ lista, productos, fecha }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        <View style={s.headerBlock}>
          <Text style={s.empresa}>{EMPRESA}</Text>
          <Text style={s.pedidosLabel}>Pedidos:</Text>
          <Text style={s.contacto}>{EMAIL}</Text>
          <Text style={s.celular}>Cel: {CELULAR}</Text>
        </View>

        <View style={s.clienteFila}>
          <Text style={s.clienteTexto}>CLIENTE: {lista.nombre.toUpperCase()}</Text>
          <Text style={s.fechaTexto}>Fecha: {fecha}</Text>
        </View>

        <View style={s.tableHeaderRow}>
          <Text style={s.thProducto}>PRODUCTOS</Text>
          <Text style={s.thPrecio}>PRECIO FINAL</Text>
        </View>

        {productos.map((p, i) => (
          <View key={p.id} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
            <Text style={s.tdProducto}>{p.nombre}</Text>
            <Text style={s.tdPrecio}>{fmt(p.precioFinal)}</Text>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{EMPRESA}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function exportarListaPDF({ lista, productos, fecha: fechaISO }) {
  const [y, m, d] = (fechaISO || new Date().toISOString().slice(0, 10)).split('-')
  const fecha = `${d}/${m}/${y.slice(2)}`
  const blob = await pdf(
    <ListaPrecioPDF lista={lista} productos={productos} fecha={fecha} />
  ).toBlob()
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `lista_${lista.nombre.toLowerCase().replace(/[\s/]+/g, '_')}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
