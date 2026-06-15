import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import Produtos from '@/pages/produtos/Produtos'
import Insumos from '@/pages/insumos/Insumos'
import { Producao } from '@/pages/producao/Producao'
import Estoque from '@/pages/estoque/Estoque'
import Vendas from '@/pages/vendas/Vendas'
import Clientes from '@/pages/clientes/Clientes'
import { Configuracoes } from '@/pages/configuracoes/Configuracoes'
import { PDV } from '@/pages/pdv/PDV'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ilunna-cream flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-ilunna-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-display text-ilunna-brown text-lg">Ilunna Gestão</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pdv" element={<PDV />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="insumos" element={<Insumos />} />
        <Route path="producao" element={<Producao />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="vendas" element={<Vendas />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
