import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }      from './context/AuthContext'
import Spinner          from './components/atoms/Spinner'
import Login            from './components/pages/Login'
import Pedidos          from './components/pages/Pedidos'
import NuevoPedido      from './components/pages/NuevoPedido'
import DetallePedido    from './components/pages/DetallePedido'
import EditarPedido     from './components/pages/EditarPedido'
import Clientes         from './components/pages/Clientes'
import Productos        from './components/pages/Productos'
import Estadisticas     from './components/pages/Estadisticas'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner size="lg" overlay />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner size="lg" overlay />
  if (user)    return <Navigate to="/pedidos" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route
          path="/pedidos"
          element={<PrivateRoute><Pedidos /></PrivateRoute>}
        />
        <Route
          path="/pedidos/nuevo"
          element={<PrivateRoute><NuevoPedido /></PrivateRoute>}
        />
        <Route
          path="/pedidos/:id"
          element={<PrivateRoute><DetallePedido /></PrivateRoute>}
        />
        <Route
          path="/pedidos/:id/editar"
          element={<PrivateRoute><EditarPedido /></PrivateRoute>}
        />
        <Route
          path="/clientes"
          element={<PrivateRoute><Clientes /></PrivateRoute>}
        />
        <Route
          path="/productos"
          element={<PrivateRoute><Productos /></PrivateRoute>}
        />
        <Route
          path="/estadisticas"
          element={<PrivateRoute><Estadisticas /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/pedidos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
