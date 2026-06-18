import { useState } from 'react'
import Button    from '../atoms/Button'
import Input     from '../atoms/Input'
import FormField from '../molecules/FormField'

const EMPTY = { nombre: '', precio_final: '', precio_sin_iva: '', un_pallet: '', un_caja: '', activo: true }

export default function ProductoForm({ initial, onSave, onClose }) {
  const [form,    setForm]    = useState({ ...EMPTY, ...initial })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setLoading(true)
    setError(null)
    const payload = {
      nombre:        form.nombre.trim(),
      precio_final:  form.precio_final  === '' ? null : Number(form.precio_final),
      precio_sin_iva:form.precio_sin_iva === '' ? null : Number(form.precio_sin_iva),
      un_pallet:     form.un_pallet      === '' ? null : Number(form.un_pallet),
      un_caja:       form.un_caja        === '' ? null : Number(form.un_caja),
      activo:        form.activo,
    }
    const { error } = await onSave(payload)
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{initial?.id ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <FormField label="Nombre del producto" required htmlFor="nombre">
            <Input
              id="nombre"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: Agua mineral 500ml x24"
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Precio final ($)" htmlFor="precio_final">
              <Input
                id="precio_final"
                type="number"
                step="0.01"
                min="0"
                value={form.precio_final}
                onChange={e => set('precio_final', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Precio sin IVA ($)" htmlFor="precio_sin_iva">
              <Input
                id="precio_sin_iva"
                type="number"
                step="0.01"
                min="0"
                value={form.precio_sin_iva}
                onChange={e => set('precio_sin_iva', e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Unidades por pallet" htmlFor="un_pallet">
              <Input
                id="un_pallet"
                type="number"
                min="0"
                value={form.un_pallet}
                onChange={e => set('un_pallet', e.target.value)}
                placeholder="0"
              />
            </FormField>

            <FormField label="Unidades por caja" htmlFor="un_caja">
              <Input
                id="un_caja"
                type="number"
                min="0"
                value={form.un_caja}
                onChange={e => set('un_caja', e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => set('activo', e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
              Producto activo
            </span>
          </label>

          <div className="modal__footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {initial?.id ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
