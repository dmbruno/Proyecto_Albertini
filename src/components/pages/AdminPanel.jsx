import { useState }           from 'react'
import AppLayout               from '../templates/AppLayout'
import Button                  from '../atoms/Button'
import Spinner                 from '../atoms/Spinner'
import PasswordInput           from '../atoms/PasswordInput'
import ConfirmDialog           from '../molecules/ConfirmDialog'
import { useAdminUsuarios }    from '../../hooks/useAdminUsuarios'
import { useAuth }             from '../../context/AuthContext'
import { useToast }            from '../../context/ToastContext'

function fmtFecha(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function NuevoUsuarioModal({ onSave, onClose }) {
  const [form,    setForm]    = useState({ email: '', password: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState(null)

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (form.password !== form.confirmar) { setErr('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6)         { setErr('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    const result = await onSave({ email: form.email.trim(), password: form.password })
    if (result?.error) setErr(result.error.message ?? 'Error al crear el usuario.')
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Nuevo usuario</h2>
          <button className="modal__close" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-field">
            <label className="label">Correo electrónico</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              placeholder="usuario@ejemplo.com"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="label">Contraseña</label>
            <PasswordInput
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="form-field">
            <label className="label">Confirmar contraseña</label>
            <PasswordInput
              value={form.confirmar}
              onChange={set('confirmar')}
              required
              autoComplete="new-password"
            />
          </div>
          {err && <p className="form-field__error">{err}</p>}
          <div className="modal__footer">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>Crear usuario</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditarUsuarioModal({ usuario, onSave, onClose }) {
  const [form,    setForm]    = useState({ email: usuario.email ?? '', password: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState(null)

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    if (form.password && form.password !== form.confirmar) { setErr('Las contraseñas no coinciden.'); return }
    if (form.password && form.password.length < 6)         { setErr('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    const result = await onSave({
      id:       usuario.id,
      email:    form.email.trim(),
      password: form.password || undefined,
    })
    if (result?.error) setErr(result.error.message ?? 'Error al actualizar.')
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Editar usuario</h2>
          <button className="modal__close" onClick={onClose} type="button">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-field">
            <label className="label">Correo electrónico</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>
          <div className="admin-section-divider">
            Nueva contraseña <span>(opcional — dejá en blanco para no cambiarla)</span>
          </div>
          <div className="form-field">
            <label className="label">Nueva contraseña</label>
            <PasswordInput
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>
          <div className="form-field">
            <label className="label">Confirmar nueva contraseña</label>
            <PasswordInput
              value={form.confirmar}
              onChange={set('confirmar')}
              autoComplete="new-password"
            />
          </div>
          {err && <p className="form-field__error">{err}</p>}
          <div className="modal__footer">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { usuarios, loading, error, crearUsuario, editarUsuario, eliminarUsuario } = useAdminUsuarios()
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()

  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [confirmar, setConfirmar] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const handleCrear = async ({ email, password }) => {
    const result = await crearUsuario({ email, password })
    if (!result.error) {
      addToast(`Usuario ${email} creado correctamente.`)
      setNuevoOpen(false)
    }
    return result
  }

  const handleEditar = async ({ id, email, password }) => {
    const result = await editarUsuario({ id, email, password })
    if (!result.error) {
      addToast('Usuario actualizado correctamente.')
      setEditando(null)
    }
    return result
  }

  const handleEliminar = async () => {
    setDeleting(true)
    const { error } = await eliminarUsuario(confirmar.id)
    if (error) addToast('Error al eliminar: ' + error.message, 'error')
    else       addToast('Usuario eliminado.')
    setDeleting(false)
    setConfirmar(null)
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel admin</h1>
          <p className="page-subtitle">
            {loading
              ? '…'
              : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} registrado${usuarios.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setNuevoOpen(true)}>+ Nuevo usuario</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Spinner size="lg" overlay />
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👤</div>
          <p className="empty-state__title">Sin usuarios</p>
        </div>
      ) : (
        <div className="list">
          {usuarios.map(u => {
            const esSelf = u.id === currentUser?.id
            return (
              <div key={u.id} className="list-item">
                <div className="user-avatar" aria-hidden="true">
                  {(u.email?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="list-item__body">
                  <p className="list-item__title">
                    {u.email}
                    {esSelf && <span className="badge-self">Vos</span>}
                  </p>
                  <p className="list-item__meta">
                    Creado: {fmtFecha(u.created_at)}
                    {u.last_sign_in_at && ` · Último acceso: ${fmtFecha(u.last_sign_in_at)}`}
                  </p>
                </div>
                <div className="list-item__actions">
                  <Button variant="secondary" size="sm" onClick={() => setEditando(u)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (esSelf) { addToast('No podés eliminar tu propio usuario.', 'error'); return }
                      setConfirmar(u)
                    }}
                    title={esSelf ? 'No podés eliminarte a vos mismo' : 'Eliminar usuario'}
                    style={{ color: esSelf ? 'var(--color-text-subtle)' : 'var(--color-error)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {nuevoOpen && (
        <NuevoUsuarioModal
          onSave={handleCrear}
          onClose={() => setNuevoOpen(false)}
        />
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onSave={handleEditar}
          onClose={() => setEditando(null)}
        />
      )}

      {confirmar && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Eliminás el usuario "${confirmar.email}"? Esta acción no se puede deshacer.`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmar(null)}
          loading={deleting}
        />
      )}
    </AppLayout>
  )
}
