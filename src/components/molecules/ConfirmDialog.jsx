import Button from '../atoms/Button'
import Input  from '../atoms/Input'

export default function ConfirmDialog({
  title, message, onConfirm, onCancel, loading, confirmLabel = 'Eliminar', confirmVariant = 'danger',
  inputLabel, inputValue, onInputChange,
  dateLabel, dateValue, onDateChange,
}) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <p className="dialog__title">{title}</p>
        <p className="dialog__body">{message}</p>

        {inputLabel && (
          <div className="form-field" style={{ marginTop: 'var(--space-3)' }}>
            <label className="label">{inputLabel}</label>
            <Input value={inputValue} onChange={e => onInputChange(e.target.value)} autoFocus />
          </div>
        )}

        {dateLabel && (
          <div className="form-field" style={{ marginTop: 'var(--space-3)' }}>
            <label className="label">{dateLabel}</label>
            <Input type="date" value={dateValue} onChange={e => onDateChange(e.target.value)} />
          </div>
        )}

        <div className="dialog__actions">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
