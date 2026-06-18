export default function FormField({ label, required, error, hint, children, htmlFor }) {
  return (
    <div className="form-field">
      {label && (
        <label
          className={`label${required ? ' label--required' : ''}`}
          htmlFor={htmlFor}
        >
          {label}
        </label>
      )}
      {children}
      {error && <span className="form-field__error">{error}</span>}
      {hint && !error && <span className="form-field__hint">{hint}</span>}
    </div>
  )
}
