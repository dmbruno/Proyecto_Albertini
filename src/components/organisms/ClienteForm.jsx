import { useState } from 'react'
import Button   from '../atoms/Button'
import Input    from '../atoms/Input'
import Select   from '../atoms/Select'
import FormField from '../molecules/FormField'

const EMPTY = { razon_social: '', cuit: '', direccion: '', entrega: '', tipo_comprobante: 'FACTURA' }

export default function ClienteForm({ initial, onSave, onClose }) {
  const [form,    setForm]    = useState({ ...EMPTY, ...initial })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.razon_social.trim()) { setError('La razón social es requerida.'); return }
    setLoading(true)
    setError(null)
    const { error } = await onSave(form)
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{initial?.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <FormField label="Razón Social" required htmlFor="razon_social">
            <Input
              id="razon_social"
              value={form.razon_social}
              onChange={e => set('razon_social', e.target.value)}
              placeholder="Ej: Distribuidora Norte S.A."
              required
            />
          </FormField>

          <FormField label="CUIT" htmlFor="cuit">
            <Input
              id="cuit"
              value={form.cuit}
              onChange={e => set('cuit', e.target.value)}
              placeholder="20-12345678-9"
            />
          </FormField>

          <FormField label="Dirección" htmlFor="direccion">
            <Input
              id="direccion"
              value={form.direccion}
              onChange={e => set('direccion', e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </FormField>

          <FormField label="Dirección de entrega" htmlFor="entrega">
            <Input
              id="entrega"
              value={form.entrega}
              onChange={e => set('entrega', e.target.value)}
              placeholder="(dejar vacío si es igual a la dirección)"
            />
          </FormField>

          <FormField label="Tipo de comprobante" htmlFor="tipo_comprobante">
            <Select
              id="tipo_comprobante"
              value={form.tipo_comprobante}
              onChange={e => set('tipo_comprobante', e.target.value)}
            >
              <option value="FACTURA">FACTURA</option>
              <option value="REMITO">REMITO</option>
            </Select>
          </FormField>

          <div className="modal__footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {initial?.id ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
