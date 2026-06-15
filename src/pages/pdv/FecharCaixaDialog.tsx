import { useState } from 'react'
import { X, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useFecharCaixa, useVendasDoCaixa } from '@/hooks/useCaixa'
import { formatCurrency } from '@/lib/utils'
import type { Caixa } from '@/types/database.types'

const LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  debito: 'Cartão Débito',
  credito: 'Cartão Crédito',
  outro: 'Outro',
}

interface Props {
  caixa: Caixa
  open: boolean
  onClose: () => void
}

export function FecharCaixaDialog({ caixa, open, onClose }: Props) {
  const [valorContado, setValorContado] = useState('')
  const fecharCaixa = useFecharCaixa()
  const { data } = useVendasDoCaixa(caixa.id)

  const totais = data?.totaisPorFormaPagamento ?? {}
  const totalGeral = data?.totalGeral ?? 0
  const dinheiro = totais['dinheiro'] ?? 0
  const esperadoCaixa = caixa.valor_abertura + dinheiro

  const valorContadoNum = parseFloat(valorContado.replace(',', '.')) || 0
  const diferenca = valorContado !== '' ? valorContadoNum - esperadoCaixa : null

  function handleFechar() {
    fecharCaixa.mutate(
      { caixaId: caixa.id, valorInformado: valorContadoNum },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-ilunna-cream border-ilunna-light">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ilunna-dark flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-ilunna-terracotta" />
            Fechar Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Resumo por forma de pagamento */}
          <div className="bg-white rounded-xl border border-ilunna-light p-4 space-y-2">
            <p className="text-sm font-medium text-ilunna-brown mb-3">Vendas por forma de pagamento</p>
            {Object.entries(LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-ilunna-muted">{label}</span>
                <span className={`font-medium ${totais[key] ? 'text-ilunna-dark' : 'text-ilunna-muted/50'}`}>
                  {formatCurrency(totais[key] ?? 0)}
                </span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span className="text-ilunna-brown">Total de vendas</span>
              <span className="text-ilunna-terracotta text-lg">{formatCurrency(totalGeral)}</span>
            </div>
          </div>

          {/* Conferência do dinheiro */}
          <div className="bg-white rounded-xl border border-ilunna-light p-4 space-y-3">
            <p className="text-sm font-medium text-ilunna-brown">Conferência do caixa físico</p>
            <div className="flex justify-between text-sm">
              <span className="text-ilunna-muted">Abertura (troco)</span>
              <span>{formatCurrency(caixa.valor_abertura)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ilunna-muted">Vendas em dinheiro</span>
              <span>{formatCurrency(dinheiro)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span className="text-ilunna-brown">Esperado no caixa</span>
              <span className="text-ilunna-dark">{formatCurrency(esperadoCaixa)}</span>
            </div>
          </div>

          {/* Valor contado */}
          <div className="space-y-2">
            <Label className="text-ilunna-brown font-medium">Valor contado no caixa (dinheiro físico)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ilunna-muted font-medium text-sm">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valorContado}
                onChange={e => setValorContado(e.target.value)}
                className="pl-10 h-11 border-ilunna-light focus:border-ilunna-terracotta"
                autoFocus
              />
            </div>
          </div>

          {/* Diferença */}
          {diferenca !== null && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
              Math.abs(diferenca) < 0.01
                ? 'bg-green-50 text-green-700 border border-green-200'
                : diferenca > 0
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {Math.abs(diferenca) < 0.01
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span>
                Diferença: <strong>{formatCurrency(diferenca)}</strong>
                {Math.abs(diferenca) < 0.01 && ' (caixa conferido)'}
                {diferenca > 0.01 && ' (sobra)'}
                {diferenca < -0.01 && ' (falta)'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-ilunna-light" onClick={onClose}>
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button
              className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
              onClick={handleFechar}
              disabled={fecharCaixa.isPending || valorContado === ''}
            >
              {fecharCaixa.isPending ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
