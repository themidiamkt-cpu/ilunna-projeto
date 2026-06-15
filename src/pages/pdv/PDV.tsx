import { useCaixaAtual } from '@/hooks/useCaixa'
import { AbrirCaixaScreen } from './AbrirCaixaScreen'
import { CaixaAberto } from './CaixaAberto'
import { Loader2 } from 'lucide-react'

export function PDV() {
  const { data: caixa, isLoading } = useCaixaAtual()

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-ilunna-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-ilunna-terracotta animate-spin" />
          <p className="font-display text-ilunna-brown text-lg">Carregando PDV...</p>
        </div>
      </div>
    )
  }

  if (!caixa) {
    return <AbrirCaixaScreen />
  }

  return <CaixaAberto caixa={caixa} />
}
