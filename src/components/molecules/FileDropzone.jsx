import { useRef, useState } from 'react'

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileDropzone({ id, accept, value, onChange, hint }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const abrirSelector = () => inputRef.current?.click()

  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onChange(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="dropzone__input"
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />

      {value ? (
        <div className="dropzone dropzone--selected">
          <span className="dropzone__file-icon" aria-hidden="true">📄</span>
          <div className="dropzone__file-info">
            <span className="dropzone__file-name">{value.name}</span>
            <span className="dropzone__file-size">{fmtSize(value.size)}</span>
          </div>
          <button
            type="button"
            className="dropzone__remove"
            onClick={() => onChange(null)}
            aria-label="Quitar archivo"
            title="Quitar archivo"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className={`dropzone${dragOver ? ' dropzone--drag' : ''}`}
          role="button"
          tabIndex={0}
          onClick={abrirSelector}
          onKeyDown={e => e.key === 'Enter' && abrirSelector()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="dropzone__icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <span className="dropzone__text">
            <strong>Hacé clic para subir</strong> o arrastrá el archivo acá
          </span>
          <span className="dropzone__sub">PDF o imagen</span>
        </div>
      )}

      {hint && !value && <span className="form-field__hint">{hint}</span>}
    </div>
  )
}
