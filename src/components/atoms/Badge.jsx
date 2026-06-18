const VARIANT_MAP = {
  borrador: 'borrador',
  enviado:  'enviado',
  activo:   'activo',
  inactivo: 'inactivo',
  warning:  'warning',
}

export default function Badge({ children, variant }) {
  const v = VARIANT_MAP[variant] ?? variant ?? 'inactivo'
  return <span className={`badge badge--${v}`}>{children}</span>
}
