import { useState } from 'react'
import Button    from '../atoms/Button'
import Input     from '../atoms/Input'
import FormField from '../molecules/FormField'
import { calcComision, calcPrecioFinal, calcSinIva } from '../../lib/precios'

const EMPTY = { nombre: '', precio: '', un_pallet: '', un_caja: '', activo: true }

function fmtNum(n) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ReadOnlyField({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{
        fontSize: highlight ? 'var(--text-base)' : 'var(--text-sm)',
        fontWeight: highlight ? 'var(--font-bold)' : 'var(--font-medium)',
        color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
        padding: 'var(--space-2) var(--space-3)',
        background: highlight ? 'var(--color-primary-bg)' : 'var(--color-surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
      }}>
        ${fmtNum(value)}
      </span>
    </div>
  )
}

export default function ProductoForm({ initial, onSave, onClose, lista }) {
  const [form,    setForm]    = useState({ ...EMPTY, ...initial })
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const precioBase  = Number(form.precio) || 0
  const comision    = calcComision(precioBase, lista)
  const precioFinal = calcPrecioFinal(precioBase, lista)
  const sinIva      = calcSinIva(precioFinal)
  const conImpuesto = lista && (lista.impuesto_municipal ?? 0) > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setLoading(true)
    setError(null)
    const payload = {
      nombre:    form.nombre.trim(),
      precio:    form.precio    === '' ? null : Number(form.precio),
      un_pallet: form.un_pallet === '' ? null : Number(form.un_pallet),
      un_caja:   form.un_caja   === '' ? null : Number(form.un_caja),
      activo:    form.activo,
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
              placeholder="Ej: Cremoso LC"
              required
            />
          </FormField>

          <FormField label="Precio base ($)" htmlFor="precio">
            <Input
              id="precio"
              type="number"
              step="0.01"
              min="0"
              value={form.precio}
              onChange={e => set('precio', e.target.value)}
              placeholder="0.00"
            />
          </FormField>

          {lista && (
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              background: 'var(--color-surface)',
            }}>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-3)',
              }}>
                Cálculo — {lista.nombre}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <ReadOnlyField label={`Comisión (${lista.comision_pct ?? 3}%)`} value={comision} />
                <ReadOnlyField label="Gtos. flete" value={lista.gtos_flete} />
                {conImpuesto && <ReadOnlyField label="Imp. municipal" value={lista.impuesto_municipal} />}
                <ReadOnlyField label="Sin IVA (21%)" value={sinIva} />
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <ReadOnlyField label="Precio final" value={precioFinal} highlight />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Cajas por pallet" htmlFor="un_pallet">
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
