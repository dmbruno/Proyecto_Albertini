import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }      from './context/AuthContext'
import Spinner          from './components/atoms/Spinner'
import Login            from './components/pages/Login'
import Pedidos          from './components/pages/Pedidos'
import NuevoPedido      from './components/pages/NuevoPedido'
import DetallePedido    from './components/pages/DetallePedido'
import EditarPedido     from './components/pages/EditarPedido'
import Clientes         from './components/pages/Clientes'
import ListaPrecios     from './components/pages/ListaPrecios'
import Estadisticas     from './components/pages/Estadisticas'
import AdminPanel       from './components/pages/AdminPanel'
import CuentaCorriente from './components/pages/CuentaCorriente'
import DetalleCuenta   from './components/pages/DetalleCuenta'
import Cheques         from './components/pages/Cheques'
import Movimientos     from './components/pages/Movimientos'

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
          path="/lista-precios"
          element={<PrivateRoute><ListaPrecios /></PrivateRoute>}
        />
        <Route
          path="/cuentas"
          element={<PrivateRoute><CuentaCorriente /></PrivateRoute>}
        />
        <Route
          path="/cuentas/cheques"
          element={<PrivateRoute><Cheques /></PrivateRoute>}
        />
        <Route
          path="/cuentas/movimientos"
          element={<PrivateRoute><Movimientos /></PrivateRoute>}
        />
        <Route
          path="/cuentas/:clienteId"
          element={<PrivateRoute><DetalleCuenta /></PrivateRoute>}
        />
        <Route
          path="/estadisticas"
          element={<PrivateRoute><Estadisticas /></PrivateRoute>}
        />
        <Route
          path="/admin"
          element={<PrivateRoute><AdminPanel /></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/pedidos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
