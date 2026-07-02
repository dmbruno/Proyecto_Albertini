import { useState } from 'react'
import Button    from '../atoms/Button'
import Input     from '../atoms/Input'
import Select    from '../atoms/Select'
import FormField from '../molecules/FormField'
import FileDropzone from '../molecules/FileDropzone'
import { subirImagenFactura } from '../../hooks/useCuentaCorriente'
import { FACTURA_CATEGORIAS } from '../../lib/movimientos'

const hoy = () => new Date().toISOString().slice(0, 10)

function sumarDias(fechaStr, dias) {
  const d = new Date((fechaStr || hoy()) + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const TIPOS_COMPROBANTE = [
  { value: 'FAC',        label: 'Factura' },
  { value: 'NC',         label: 'Nota de Crédito' },
  { value: 'ND',         label: 'Nota de Débito' },
  { value: 'REMITO',     label: 'Remito' },
  { value: 'AJUSTE',     label: 'Ajuste' },
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'INTERES',    label: 'Interés' },
  { value: 'CH-RECH',    label: 'Cheque rechazado' },
]

const MEDIOS_PAGO = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'ECHEQ',         label: 'ECheq' },
  { value: 'DEPOSITO',      label: 'Depósito' },
  { value: 'COMPRA',        label: 'Compra' },
  { value: 'CANCELADO',     label: 'Cancelado' },
]

function esComprobante(tipo) {
  return tipo !== 'PAGO'
}
function esCheque(medioPago) {
  return medioPago === 'CHEQUE' || medioPago === 'ECHEQ'
}

export default function MovimientoForm({ onSave, onClose, clienteId, inicial = null, titulo = null }) {
  // inicial puede ser un movimiento real (edición, siempre tiene id) o solo
  // datos precargados para uno nuevo (ej: "Registrar pago" de una factura).
  const editando = !!inicial?.id

  const [form, setForm] = useState({
    tipo:               inicial?.tipo               ?? 'FAC',
    monto:              inicial?.monto               ?? '',
    fecha:              inicial?.fecha               ?? hoy(),
    numeroComprobante:  inicial?.numero_comprobante  ?? '',
    fechaVencimiento:   inicial?.fecha_vencimiento    ?? '',
    facturaCategoria:   inicial?.factura_categoria    ?? '',
    ajusteEfecto:       inicial?.ajuste_efecto        ?? '',
    medioPago:          inicial?.medio_pago           ?? 'EFECTIVO',
    chequeNumero:       inicial?.cheque_numero        ?? '',
    chequeBanco:        inicial?.cheque_banco         ?? '',
    chequeTitular:      inicial?.cheque_titular       ?? '',
    chequeFechaEmision: inicial?.cheque_fecha_emision ?? '',
    chequeVencimiento:  inicial?.cheque_vencimiento   ?? '',
    descripcion:        inicial?.descripcion          ?? '',
  })
  const [vencimientoTocado, setVencimientoTocado] = useState(!!inicial?.fecha_vencimiento)
  const [imagenFile, setImagenFile] = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleTipoChange = (tipo) => {
    setForm(prev => ({
      ...prev,
      tipo,
      fechaVencimiento: (tipo === 'FAC' && !vencimientoTocado)
        ? sumarDias(prev.fecha, 15)
        : prev.fechaVencimiento,
    }))
  }

  const handleFechaChange = (fecha) => {
    setForm(prev => ({
      ...prev,
      fecha,
      fechaVencimiento: (prev.tipo === 'FAC' && !vencimientoTocado)
        ? sumarDias(fecha, 15)
        : prev.fechaVencimiento,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const monto = Number(form.monto)
    if (!monto || monto <= 0) { setError('El importe debe ser mayor a cero.'); return }
    if (!form.fecha)          { setError('La fecha es requerida.'); return }
    if (form.tipo === 'AJUSTE' && !form.ajusteEfecto) {
      setError('Elegí si el ajuste suma o resta del saldo.'); return
    }
    if (form.tipo === 'PAGO' && esCheque(form.medioPago)) {
      if (!form.chequeNumero || !form.chequeBanco || !form.chequeVencimiento) {
        setError('Completá número de cheque, banco y fecha de vencimiento del cheque.'); return
      }
    }

    setLoading(true)
    setError(null)

    let facturaImagenUrl = inicial?.factura_imagen_url ?? null
    if (imagenFile) {
      const { path, error: uploadError } = await subirImagenFactura(clienteId, imagenFile)
      if (uploadError) {
        setError('No se pudo subir la imagen de la factura: ' + uploadError.message)
        setLoading(false)
        return
      }
      facturaImagenUrl = path
    }

    const { error } = await onSave({
      tipo:               form.tipo,
      monto,
      fecha:              form.fecha,
      descripcion:        form.descripcion.trim() || null,
      numeroComprobante:  esComprobante(form.tipo) ? (form.numeroComprobante || null) : null,
      fechaVencimiento:   esComprobante(form.tipo) ? (form.fechaVencimiento  || null) : null,
      facturaCategoria:   esComprobante(form.tipo) ? (form.facturaCategoria || null) : null,
      facturaImagenUrl:   esComprobante(form.tipo) ? facturaImagenUrl : null,
      ajusteEfecto:       form.tipo === 'AJUSTE' ? form.ajusteEfecto : null,
      medioPago:          form.tipo === 'PAGO' ? form.medioPago : null,
      chequeNumero:       form.tipo === 'PAGO' && esCheque(form.medioPago) ? form.chequeNumero       : null,
      chequeBanco:        form.tipo === 'PAGO' && esCheque(form.medioPago) ? form.chequeBanco         : null,
      chequeTitular:      form.tipo === 'PAGO' && esCheque(form.medioPago) ? (form.chequeTitular || null) : null,
      chequeFechaEmision: form.tipo === 'PAGO' && esCheque(form.medioPago) ? (form.chequeFechaEmision || null) : null,
      chequeVencimiento:  form.tipo === 'PAGO' && esCheque(form.medioPago) ? form.chequeVencimiento   : null,
      movimientoRelacionadoId: inicial?.movimiento_relacionado_id ?? inicial?.movimientoRelacionadoId ?? null,
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{titulo ?? (editando ? 'Editar movimiento' : 'Nuevo movimiento')}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <FormField label="Tipo" required htmlFor="tipo">
            <Select id="tipo" value={form.tipo} onChange={e => handleTipoChange(e.target.value)}>
              <optgroup label="Comprobante">
                {TIPOS_COMPROBANTE.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
              <optgroup label="Pago">
                <option value="PAGO">Pago</option>
              </optgroup>
            </Select>
          </FormField>

          <FormField label="Importe" required htmlFor="monto">
            <div className="input-prefix-group">
              <span className="input-prefix-group__symbol">$</span>
              <Input
                id="monto"
                type="number"
                min="0.01"
                step="0.01"
                value={form.monto}
                onChange={e => set('monto', e.target.value)}
                placeholder="0,00"
                required
                style={{ width: '100%' }}
              />
            </div>
          </FormField>

          <FormField label={form.tipo === 'PAGO' ? 'Fecha de pago' : 'Fecha'} required htmlFor="fecha">
            <Input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={e => handleFechaChange(e.target.value)}
              required
            />
          </FormField>

          {esComprobante(form.tipo) && (
            <>
              <FormField label="Número de comprobante" htmlFor="numeroComprobante">
                <Input
                  id="numeroComprobante"
                  value={form.numeroComprobante}
                  onChange={e => set('numeroComprobante', e.target.value)}
                  placeholder="Ej: 0001-00018409"
                />
              </FormField>

              <FormField label="Fecha de vencimiento" htmlFor="fechaVencimiento">
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={e => { setVencimientoTocado(true); set('fechaVencimiento', e.target.value) }}
                />
              </FormField>

              <FormField label="Producto" htmlFor="facturaCategoria">
                <Select id="facturaCategoria" value={form.facturaCategoria} onChange={e => set('facturaCategoria', e.target.value)}>
                  <option value="">— Sin especificar —</option>
                  {FACTURA_CATEGORIAS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Imagen de la factura (opcional)" htmlFor="facturaImagen">
                <FileDropzone
                  id="facturaImagen"
                  accept="image/*,application/pdf"
                  value={imagenFile}
                  onChange={setImagenFile}
                  hint={inicial?.factura_imagen_url ? 'Ya hay una imagen cargada — subí otra solo si querés reemplazarla.' : null}
                />
              </FormField>
            </>
          )}

          {form.tipo === 'AJUSTE' && (
            <FormField label="¿Suma o resta del saldo?" required htmlFor="ajusteEfecto">
              <Select id="ajusteEfecto" value={form.ajusteEfecto} onChange={e => set('ajusteEfecto', e.target.value)}>
                <option value="">— Elegir —</option>
                <option value="DEBE">Suma a la deuda (Debe)</option>
                <option value="HABER">Resta de la deuda (Haber)</option>
              </Select>
            </FormField>
          )}

          {form.tipo === 'PAGO' && (
            <>
              <FormField label="Medio de pago" required htmlFor="medioPago">
                <Select id="medioPago" value={form.medioPago} onChange={e => set('medioPago', e.target.value)}>
                  {MEDIOS_PAGO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              </FormField>

              {esCheque(form.medioPago) && (
                <>
                  <FormField label="Número de cheque" required htmlFor="chequeNumero">
                    <Input
                      id="chequeNumero"
                      value={form.chequeNumero}
                      onChange={e => set('chequeNumero', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Banco" required htmlFor="chequeBanco">
                    <Input
                      id="chequeBanco"
                      value={form.chequeBanco}
                      onChange={e => set('chequeBanco', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Titular (si es de un tercero)" htmlFor="chequeTitular">
                    <Input
                      id="chequeTitular"
                      value={form.chequeTitular}
                      onChange={e => set('chequeTitular', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Fecha de emisión" htmlFor="chequeFechaEmision">
                    <Input
                      id="chequeFechaEmision"
                      type="date"
                      value={form.chequeFechaEmision}
                      onChange={e => set('chequeFechaEmision', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Fecha de vencimiento del cheque" required htmlFor="chequeVencimiento">
                    <Input
                      id="chequeVencimiento"
                      type="date"
                      value={form.chequeVencimiento}
                      onChange={e => set('chequeVencimiento', e.target.value)}
                      required
                    />
                  </FormField>
                </>
              )}
            </>
          )}

          <FormField label="Descripción" htmlFor="descripcion">
            <textarea
              id="descripcion"
              className="input"
              rows={2}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Notas adicionales (opcional)"
              style={{ resize: 'vertical', minHeight: 56, fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}
            />
          </FormField>

          <div className="modal__footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {editando ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
