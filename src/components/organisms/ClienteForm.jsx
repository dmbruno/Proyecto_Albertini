import { useState } from 'react'
import Button    from '../atoms/Button'
import Input     from '../atoms/Input'
import Select    from '../atoms/Select'
import FormField from '../molecules/FormField'

const EMPTY = {
  razon_social:     '',
  cuit:             '',
  direccion:        '',
  entrega:          '',
  comentario:       '',
  tipo_comprobante: 'FACTURA',
  condicion_iva:    '',
  lista_precios_id: '',
}

export default function ClienteForm({ initial, onSave, onClose, listas = [] }) {
  const [form,    setForm]    = useState({
    ...EMPTY,
    ...initial,
    lista_precios_id: initial?.lista_precios_id ?? '',
    condicion_iva:    initial?.condicion_iva    ?? '',
    comentario:       initial?.comentario       ?? '',
  })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.razon_social.trim()) { setError('La razón social es requerida.'); return }
    setLoading(true)
    setError(null)
    const payload = {
      razon_social:     form.razon_social.trim(),
      cuit:             form.cuit             || null,
      direccion:        form.direccion        || null,
      entrega:          form.entrega          || null,
      comentario:       form.comentario       || null,
      tipo_comprobante: form.tipo_comprobante || null,
      condicion_iva:    form.condicion_iva    || null,
      lista_precios_id: form.lista_precios_id || null,
    }
    const { error } = await onSave(payload)
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

          <FormField label="Comentarios / Horario de entrega" htmlFor="comentario">
            <textarea
              id="comentario"
              className="input"
              rows={2}
              value={form.comentario}
              onChange={e => set('comentario', e.target.value)}
              placeholder="Ej: Entrega martes y jueves 8-12hs · Avisar al llegar"
              style={{ resize: 'vertical', minHeight: 60, fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}
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

          <FormField label="Condición frente al IVA" htmlFor="condicion_iva">
            <Select
              id="condicion_iva"
              value={form.condicion_iva}
              onChange={e => set('condicion_iva', e.target.value)}
            >
              <option value="">— Sin especificar —</option>
              <option value="RESPONSABLE INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTISTA">Monotributista</option>
              <option value="EXENTO">Exento</option>
              <option value="CONSUMIDOR FINAL">Consumidor Final</option>
            </Select>
          </FormField>

          <FormField label="Lista de precios (zona)" htmlFor="lista_precios_id">
            <Select
              id="lista_precios_id"
              value={form.lista_precios_id}
              onChange={e => set('lista_precios_id', e.target.value)}
            >
              <option value="">— Sin asignar —</option>
              {listas.map(l => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
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
