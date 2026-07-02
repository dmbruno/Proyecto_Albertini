import {
  Document, Page, View, Text,
  StyleSheet, pdf,
} from '@react-pdf/renderer'

/* ── palette (igual que exportPdf.jsx) ── */
const C = {
  primary:       '#1a4b8b',
  primaryLight:  '#e8f0fb',
  text:          '#1e293b',
  muted:         '#64748b',
  subtle:        '#94a3b8',
  border:        '#e2e8f0',
  stripe:        '#f8fafc',
  white:         '#ffffff',
  success:       '#16a34a',
  successBg:     '#dcfce7',
  error:         '#dc2626',
  errorBg:       '#fee2e2',
}

const COL = {
  cliente:  { flex: 1 },
  cargos:   { width: 78, textAlign: 'right' },
  pagos:    { width: 78, textAlign: 'right' },
  saldo:    { width: 92, textAlign: 'right' },
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

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

  /* KPIs */
  kpisRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: C.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  kpiBoxLast: {
    marginRight: 0,
  },
  kpiLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  kpiValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: C.primary,
  },

  /* tabla */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  tdMuted: {
    fontSize: 7.5,
    color: C.muted,
  },
  tdBold: {
    fontFamily: 'Helvetica-Bold',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillTextDeuda: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.error,
  },
  pillTextAlDia: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.success,
  },
  pillDeuda: {
    backgroundColor: C.errorBg,
  },
  pillAlDia: {
    backgroundColor: C.successBg,
  },

  /* total general */
  totalGeneral: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 4,
    marginTop: 10,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: C.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: C.white,
  },

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

function CuentasPDF({ saldos, fecha }) {
  const totalDeuda  = saldos.reduce((sum, s) => sum + Math.max(Number(s.saldo), 0), 0)
  const clientesConDeuda = saldos.filter(s => Number(s.saldo) > 0).length

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
            <Text style={s.docLabel}>Cuentas corrientes</Text>
            <Text style={s.docFecha}>Fecha: {fecha}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpisRow}>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Clientes</Text>
            <Text style={s.kpiValue}>{saldos.length}</Text>
          </View>
          <View style={s.kpiBox}>
            <Text style={s.kpiLabel}>Con deuda</Text>
            <Text style={s.kpiValue}>{clientesConDeuda}</Text>
          </View>
          <View style={[s.kpiBox, s.kpiBoxLast]}>
            <Text style={s.kpiLabel}>Total adeudado</Text>
            <Text style={s.kpiValue}>{fmt(totalDeuda)}</Text>
          </View>
        </View>

        {/* tabla */}
        <View style={s.tableHead} fixed>
          <Text style={[s.th, COL.cliente]}>Cliente</Text>
          <Text style={[s.th, COL.cargos]}>Cargos</Text>
          <Text style={[s.th, COL.pagos]}>Pagos</Text>
          <Text style={[s.th, COL.saldo]}>Saldo</Text>
        </View>

        {saldos.map((c, i) => {
          const saldo   = Number(c.saldo)
          const enDeuda = saldo > 0
          const aFavor  = saldo < 0
          return (
            <View
              key={c.cliente_id}
              style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}
              wrap={false}
            >
              <View style={COL.cliente}>
                <Text style={[s.td, s.tdBold]}>{c.razon_social}</Text>
              </View>
              <Text style={[s.td, COL.cargos]}>{fmt(c.total_cargos)}</Text>
              <Text style={[s.td, COL.pagos]}>{fmt(c.total_pagos)}</Text>
              <View style={COL.saldo}>
                {saldo === 0 ? (
                  <View style={[s.pill, s.pillAlDia, { alignSelf: 'flex-end' }]}>
                    <Text style={s.pillTextAlDia}>Al día</Text>
                  </View>
                ) : (
                  <Text style={[s.td, s.tdBold, { color: enDeuda ? C.error : C.success }]}>
                    {aFavor ? '+ ' : ''}{fmt(Math.abs(saldo))}
                  </Text>
                )}
              </View>
            </View>
          )
        })}

        {/* total general */}
        <View style={s.totalGeneral}>
          <Text style={s.totalLabel}>Total adeudado</Text>
          <Text style={s.totalValue}>{fmt(totalDeuda)}</Text>
        </View>

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

export async function exportarCuentasPDF(saldos) {
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const blob = await pdf(<CuentasPDF saldos={saldos} fecha={fecha} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `cuentas_corrientes_${new Date().toISOString().slice(0, 10)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
