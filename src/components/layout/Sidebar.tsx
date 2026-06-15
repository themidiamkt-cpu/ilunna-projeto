import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FlaskConical,
  Factory,
  BarChart3,
  Receipt,
  Users,
  Settings,
  LogOut,
  Flame,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/pdv', icon: ShoppingCart, label: 'Frente de Caixa' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/insumos', icon: FlaskConical, label: 'Insumos' },
  { to: '/producao', icon: Factory, label: 'Produção' },
  { to: '/estoque', icon: BarChart3, label: 'Estoque' },
  { to: '/vendas', icon: Receipt, label: 'Vendas' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
]

export function Sidebar() {
  const { perfil, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-ilunna-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ilunna-terracotta rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ilunna-dark leading-none">
              Ilunna
            </h1>
            <p className="text-[10px] text-ilunna-muted uppercase tracking-widest mt-0.5">
              Gestão
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-ilunna-terracotta text-white shadow-sm'
                  : 'text-ilunna-brown hover:bg-ilunna-light hover:text-ilunna-dark'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest text-ilunna-muted font-medium">
                Admin
              </p>
            </div>
            <NavLink
              to="/configuracoes"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-ilunna-terracotta text-white shadow-sm'
                    : 'text-ilunna-brown hover:bg-ilunna-light hover:text-ilunna-dark'
                )
              }
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Configurações
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-ilunna-light">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ilunna-light">
          <div className="w-8 h-8 rounded-full bg-ilunna-terracotta/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-ilunna-terracotta">
              {perfil?.nome?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ilunna-dark truncate">
              {perfil?.nome ?? 'Usuário'}
            </p>
            <p className="text-[10px] text-ilunna-muted capitalize">
              {perfil?.papel ?? 'operador'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-ilunna-muted hover:text-ilunna-dark hover:bg-ilunna-terracotta/10"
            onClick={handleSignOut}
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-white border-r border-ilunna-light flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-white border border-ilunna-light rounded-lg flex items-center justify-center shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X className="w-4 h-4 text-ilunna-dark" />
        ) : (
          <Menu className="w-4 h-4 text-ilunna-dark" />
        )}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-40 w-60 h-screen bg-white border-r border-ilunna-light transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
