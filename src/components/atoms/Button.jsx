export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  full    = false,
  type    = 'button',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading ? 'btn--loading' : '',
    full    ? 'btn--full'    : '',
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} disabled={loading || props.disabled} {...props}>
      {loading
        ? <><span className="spinner spinner--sm" aria-hidden="true" /> Cargando…</>
        : children
      }
    </button>
  )
}
