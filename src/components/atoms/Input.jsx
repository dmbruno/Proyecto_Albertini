export default function Input({ error, size, className = '', ...props }) {
  const classes = [
    'input',
    error        ? 'input--error' : '',
    size === 'sm' ? 'input--sm'   : '',
    className,
  ].filter(Boolean).join(' ')

  return <input className={classes} {...props} />
}
