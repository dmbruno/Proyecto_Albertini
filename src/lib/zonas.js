export const ZONA_ORDER = [
  'Jujuy',
  'Salta sin redespacho',
  'Salta con redespacho',
  'San Pedro',
  'Güemes / Metán',
]

// Agrupa secciones ordenadas por zona, insertando un separador `_esZona`
// antes de cada grupo. `getZona(seccion)` debe devolver el nombre de la
// zona (o null/undefined si el cliente no tiene una asignada).
export function agruparConZonas(secciones, getZona) {
  const sorted = [...secciones].sort((a, b) => {
    const zA = ZONA_ORDER.indexOf(getZona(a) ?? '')
    const zB = ZONA_ORDER.indexOf(getZona(b) ?? '')
    return (zA < 0 ? 999 : zA) - (zB < 0 ? 999 : zB)
  })
  const result = []
  let zonaActual = null
  for (const sec of sorted) {
    const zona = getZona(sec) ?? null
    if (zona !== zonaActual) {
      result.push({ _esZona: true, nombre: zona ?? 'Sin zona asignada' })
      zonaActual = zona
    }
    result.push(sec)
  }
  return result
}
