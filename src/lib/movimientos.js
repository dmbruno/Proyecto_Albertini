export const FACTURA_CATEGORIA_LABEL = {
  MANTEQUERA: 'Mantequera',
  CERUTTI:    'Cerutti',
}

export const FACTURA_CATEGORIAS = [
  { value: 'MANTEQUERA', label: 'Mantequera' },
  { value: 'CERUTTI',    label: 'Cerutti' },
]

export const TIPO_LABEL = {
  FAC:        'Factura',
  NC:         'Nota de Crédito',
  ND:         'Nota de Débito',
  REMITO:     'Remito',
  AJUSTE:     'Ajuste',
  DEVOLUCION: 'Devolución',
  INTERES:    'Interés',
  'CH-RECH':  'Cheque rechazado',
  PAGO:       'Pago',
}

// Mismo criterio que la vista saldos_clientes en Supabase: qué tipos suman
// deuda (debe), cuáles la bajan (haber), y cuáles no afectan el saldo.
export function efectoDe(mov) {
  if (['FAC', 'ND', 'INTERES', 'CH-RECH'].includes(mov.tipo)) return 'debe'
  if (['NC', 'DEVOLUCION', 'PAGO'].includes(mov.tipo)) return 'haber'
  if (mov.tipo === 'AJUSTE') return mov.ajuste_efecto === 'HABER' ? 'haber' : 'debe'
  return 'neutral' // REMITO
}

export function badgeVariantEfecto(efecto) {
  return efecto === 'debe' ? 'debe' : efecto === 'haber' ? 'activo' : 'inactivo'
}

// null si la factura no está en alerta; 'vencida' o 'por_vencer' si corresponde.
// Solo aplica a facturas (tipo FAC) sin marcar como pagadas.
export function estadoVencimiento(mov) {
  if (mov.tipo !== 'FAC' || mov.pagada || !mov.fecha_vencimiento) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(mov.fecha_vencimiento + 'T00:00:00')
  const diffDias = Math.round((venc - hoy) / 86400000)
  if (diffDias < 0) return 'vencida'
  if (diffDias <= 7) return 'por_vencer'
  return null
}
