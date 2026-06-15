import { useState } from 'react'
import { Landmark, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAbrirCaixa, useUltimoCaixaFechado } from '@/hooks/useCaixa'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export function AbrirCaixaScreen() {
  const [valorAbertura, setValorAbertura] = useState('')
  const abrirCaixa = useAbrirCaixa()
  const { data: ultimoCaixa } = useUltimoCaixaFechado()

  function handleAbrir() {
    const valor = parseFloat(valorAbertura.replace(',', '.')) || 0
    abrirCaixa.mutate(valor)
  }

  return (
    <div className="min-h-screen bg-ilunna-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-ilunna-terracotta rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl text-ilunna-dark">Ilunna Gestão</h1>
          <p className="text-ilunna-muted">Frente de Caixa</p>
        </div>

        {/* Ultimo caixa info */}
        {ultimoCaixa && (
          <Card className="border-ilunna-light bg-ilunna-light/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-ilunna-muted mt-0.5 shrink-0" />
                <div className="text-sm space-y-0.5">
                  <p className="text-ilunna-brown font-medium">Último caixa fechado</p>
                  <p className="text-ilunna-muted">{formatDateTime(ultimoCaixa.data_fechamento)}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-ilunna-dark">
                      Total: <strong>{formatCurrency(ultimoCaixa.valor_esperado)}</strong>
                    </span>
                    {ultimoCaixa.diferenca !== null && (
                      <span className={ultimoCaixa.diferenca >= 0 ? 'text-green-600' : 'text-red-500'}>
                        Diferença: <strong>{formatCurrency(ultimoCaixa.diferenca)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Abertura form */}
        <Card className="shadow-xl border-ilunna-light">
          <CardContent className="pt-6 pb-6 space-y-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-ilunna-terracotta mx-auto mb-2" />
              <h2 className="font-display text-xl text-ilunna-dark">Abrir Caixa</h2>
              <p className="text-sm text-ilunna-muted mt-1">Informe o valor inicial em dinheiro para começar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-ilunna-brown font-medium">
                Valor inicial em dinheiro
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ilunna-muted font-medium text-sm">R$</span>
                <Input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valorAbertura}
                  onChange={e => setValorAbertura(e.target.value)}
                  className="pl-10 text-lg h-12 border-ilunna-light focus:border-ilunna-terracotta"
                  onKeyDown={e => e.key === 'Enter' && handleAbrir()}
                  autoFocus
                />
              </div>
              <p className="text-xs text-ilunna-muted">Pode ser R$ 0,00 caso não haja troco inicial</p>
            </div>

            <Button
              className="w-full h-12 text-base bg-ilunna-terracotta hover:bg-ilunna-brown text-white font-medium"
              onClick={handleAbrir}
              disabled={abrirCaixa.isPending}
            >
              {abrirCaixa.isPending ? 'Abrindo...' : 'Abrir Caixa e Começar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
