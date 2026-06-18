export default function Select({ error, size, className = '', children, ...props }) {
  const classes = [
    'select',
    error        ? 'select--error' : '',
    size === 'sm' ? 'select--sm'   : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}
