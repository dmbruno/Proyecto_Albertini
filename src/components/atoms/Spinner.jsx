export default function Spinner({ size = 'md', overlay = false }) {
  const spinner = <span className={`spinner spinner--${size}`} role="status" aria-label="Cargando" />
  if (overlay) {
    return <div className="spinner-overlay">{spinner}</div>
  }
  return spinner
}
