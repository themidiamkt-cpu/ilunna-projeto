import { Settings } from 'lucide-react'

export function Configuracoes() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-ilunna-terracotta/10 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-ilunna-terracotta" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ilunna-dark">Configurações</h1>
          <p className="text-sm text-ilunna-muted">Administração do sistema</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-ilunna-light bg-ilunna-cream/50 p-12 text-center">
        <p className="text-ilunna-muted text-sm">Em construção...</p>
      </div>
    </div>
  )
}
