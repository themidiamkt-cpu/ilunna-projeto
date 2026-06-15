import { useState } from 'react'
import { ShoppingBag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ComprovanteVenda, type VendaComprovante } from './ComprovanteVenda'
import { useProcessarVenda } from '@/hooks/useVendas'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from './CaixaAberto'

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', debito: 'Cartão Débito', credito: 'Cartão Crédito', outro: 'Outro',
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  cart: CartItem[]
  subtotal: number
  descontoValor: number
  total: number
  formaPagamento: string
  valorRecebido?: number
  troco?: number
  caixaId: string
  clienteId: string
}

export function FinalizarVendaDialog({
  open, onClose, onSuccess, cart, subtotal, descontoValor, total,
  formaPagamento, valorRecebido, troco, caixaId, clienteId
}: Props) {
  const [comprovante, setComprovante] = useState<VendaComprovante | null>(null)
  const [showComprovante, setShowComprovante] = useState(false)
  const [erro, setErro] = useState('')
  const processar = useProcessarVenda()

  function handleConfirmar() {
    setErro('')
    if (!clienteId) {
      setErro('Selecione um cliente para registrar a venda.')
      return
    }
    processar.mutate(
      {
        caixa_id: caixaId,
        cliente_id: clienteId,
        forma_pagamento: formaPagamento as any,
        desconto: descontoValor,
        itens: cart.map(i => ({
          produto_id: i.produto_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
      },
      {
        onSuccess: (data: any) => {
          setComprovante({
            numero: data.numero,
            data: new Date().toISOString(),
            itens: cart.map(i => ({
              nome: i.nome,
              quantidade: i.quantidade,
              preco_unitario: i.preco_unitario,
              subtotal: i.preco_unitario * i.quantidade,
            })),
            subtotal, desconto: descontoValor, total,
            forma_pagamento: formaPagamento,
            valor_recebido: valorRecebido,
            troco,
          })
          setShowComprovante(true)
        },
        onError: (e: Error) => setErro(e.message),
      }
    )
  }

  if (showComprovante && comprovante) {
    return (
      <ComprovanteVenda
        venda={comprovante}
        open={showComprovante}
        onNovaVenda={() => { setShowComprovante(false); onSuccess(); }}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm bg-ilunna-cream border-ilunna-light">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ilunna-dark flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-ilunna-terracotta" />
            Confirmar Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items summary */}
          <div className="bg-white rounded-xl border border-ilunna-light divide-y divide-ilunna-light max-h-52 overflow-y-auto">
            {cart.map(item => (
              <div key={item.produto_id} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-ilunna-dark truncate flex-1 pr-2">{item.quantidade}x {item.nome}</span>
                <span className="font-medium text-ilunna-dark shrink-0">{formatCurrency(item.preco_unitario * item.quantidade)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl border border-ilunna-light p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-ilunna-muted">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {descontoValor > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Desconto</span><span>- {formatCurrency(descontoValor)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span className="text-ilunna-brown">Total</span>
              <span className="text-ilunna-terracotta">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-ilunna-light/60 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-ilunna-muted">Pagamento</span>
              <span className="font-medium text-ilunna-dark">{FORMA_LABELS[formaPagamento] ?? formaPagamento}</span>
            </div>
            {valorRecebido !== undefined && (
              <div className="flex justify-between">
                <span className="text-ilunna-muted">Recebido</span>
                <span>{formatCurrency(valorRecebido)}</span>
              </div>
            )}
            {troco !== undefined && troco > 0 && (
              <div className="flex justify-between font-bold text-green-600">
                <span>Troco</span><span>{formatCurrency(troco)}</span>
              </div>
            )}
          </div>

          {erro && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-ilunna-light" onClick={onClose} disabled={processar.isPending}>
              Voltar
            </Button>
            <Button
              className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white font-bold h-11"
              onClick={handleConfirmar}
              disabled={processar.isPending}
            >
              {processar.isPending ? 'Processando...' : 'Confirmar Venda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
