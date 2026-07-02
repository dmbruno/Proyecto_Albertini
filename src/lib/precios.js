export function calcComision(precio, lista) {
  const pct = lista?.comision_pct ?? 3
  return (precio ?? 0) * (pct / 100)
}

export function calcPrecioFinal(precio, lista) {
  if (precio == null || !lista) return 0
  const comision = calcComision(precio, lista)
  return precio + comision + (lista.gtos_flete ?? 0) + (lista.impuesto_municipal ?? 0)
}

export function calcSinIva(precioFinal) {
  return precioFinal / 1.21
}

export function calcTotalPiezas(pallet, cajas, unPallet, unCaja) {
  const totalCajas = (Number(pallet) * (Number(unPallet) || 0)) + Number(cajas)
  return totalCajas * (Number(unCaja) || 0)
}

// La fábrica factura según el peso real pesado en planta, no según este estimado.
export const KG_POR_PIEZA = 4

export function calcKgEstimado(piezas) {
  return (Number(piezas) || 0) * KG_POR_PIEZA
}
