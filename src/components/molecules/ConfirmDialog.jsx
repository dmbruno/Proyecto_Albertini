import Button from '../atoms/Button'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading, confirmLabel = 'Eliminar', confirmVariant = 'danger' }) {
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <p className="dialog__title">{title}</p>
        <p className="dialog__body">{message}</p>
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
