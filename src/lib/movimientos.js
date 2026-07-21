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

export const MEDIO_PAGO_LABEL = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CHEQUE:        'Cheque',
  ECHEQ:         'ECheq',
  DEPOSITO:      'Depósito',
  COMPRA:        'Compra',
  CANCELADO:     'Cancelado',
}

// Producto o categoría del comprobante (vacío para pagos).
export function detalleDe(mov) {
  return FACTURA_CATEGORIA_LABEL[mov.factura_categoria] || mov.productos?.nombre || ''
}

// Forma de pago (+ datos del cheque si corresponde). Vacío si no es un pago.
export function formaPagoDe(mov) {
  if (mov.tipo !== 'PAGO' || !mov.medio_pago) return ''
  const medio = MEDIO_PAGO_LABEL[mov.medio_pago] ?? mov.medio_pago
  const esCheque = mov.medio_pago === 'CHEQUE' || mov.medio_pago === 'ECHEQ'
  return esCheque ? `${medio} · Nº ${mov.cheque_numero || '—'} · ${mov.cheque_banco || '—'}` : medio
}

// Mismo criterio que la vista saldos_clientes en Supabase: qué tipos suman
// deuda (debe), cuáles la bajan (haber), y cuáles no afectan el saldo.
// REMITO suma deuda igual que FAC: a los clientes que venden "sin factura"
// se les carga un remito como comprobante de venta real.
export function efectoDe(mov) {
  if (['FAC', 'REMITO', 'ND', 'INTERES', 'CH-RECH'].includes(mov.tipo)) return 'debe'
  if (['NC', 'DEVOLUCION', 'PAGO'].includes(mov.tipo)) return 'haber'
  if (mov.tipo === 'AJUSTE') return mov.ajuste_efecto === 'HABER' ? 'haber' : 'debe'
  return 'neutral'
}

export function badgeVariantEfecto(efecto) {
  return efecto === 'debe' ? 'debe' : efecto === 'haber' ? 'activo' : 'inactivo'
}

// null si la factura no está en alerta; 'vencida' o 'por_vencer' si corresponde.
// Aplica a facturas y remitos (tipo FAC o REMITO) sin marcar como pagados.
export function estadoVencimiento(mov) {
  if (!['FAC', 'REMITO'].includes(mov.tipo) || mov.pagada || !mov.fecha_vencimiento) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(mov.fecha_vencimiento + 'T00:00:00')
  const diffDias = Math.round((venc - hoy) / 86400000)
  if (diffDias < 0) return 'vencida'
  if (diffDias <= 7) return 'por_vencer'
  return null
}
