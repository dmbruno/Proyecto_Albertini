import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

function ToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="region" aria-label="Notificaciones">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.variant}`} role="alert">
          <span className="toast__message">{t.message}</span>
          <button className="toast__close" onClick={() => onClose(t.id)} aria-label="Cerrar">×</button>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, variant = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => removeToast(id), 3500)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
