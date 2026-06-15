import { Printer, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export interface VendaComprovante {
  numero: string
  data: string
  itens: { nome: string; quantidade: number; preco_unitario: number; subtotal: number }[]
  subtotal: number
  desconto: number
  total: number
  forma_pagamento: string
  valor_recebido?: number
  troco?: number
  cliente?: string
}

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  debito: 'Cartão Débito',
  credito: 'Cartão Crédito',
  outro: 'Outro',
}

interface Props {
  venda: VendaComprovante | null
  open: boolean
  onNovaVenda: () => void
}

export function ComprovanteVenda({ venda, open, onNovaVenda }: Props) {
  if (!venda) return null

  return (
    <Dialog open={open} onOpenChange={v => !v && onNovaVenda()}>
      <DialogContent className="max-w-sm p-0 bg-white border-ilunna-light overflow-hidden">
        {/* Printable receipt */}
        <div id="comprovante" className="p-6 space-y-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="font-display text-2xl text-ilunna-dark not-italic font-bold tracking-wide">Ilunna</p>
            <p className="text-xs text-ilunna-muted">Produtos Aromáticos Artesanais</p>
            <div className="border-t border-dashed border-ilunna-light pt-2 mt-2">
              <p className="text-xs">Venda Nº {venda.numero}</p>
              <p className="text-xs text-ilunna-muted">{formatDateTime(venda.data)}</p>
              {venda.cliente && <p className="text-xs">Cliente: {venda.cliente}</p>}
            </div>
          </div>

          <Separator className="border-dashed" />

          {/* Items */}
          <div className="space-y-1.5">
            {venda.itens.map((item, i) => (
              <div key={i}>
                <p className="text-xs font-medium truncate">{item.nome}</p>
                <div className="flex justify-between text-xs text-ilunna-muted">
                  <span>{item.quantidade}x {formatCurrency(item.preco_unitario)}</span>
                  <span className="font-medium text-ilunna-dark">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="border-dashed" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-ilunna-muted">Subtotal</span>
              <span>{formatCurrency(venda.subtotal)}</span>
            </div>
            {venda.desconto > 0 && (
              <div className="flex justify-between">
                <span className="text-ilunna-muted">Desconto</span>
                <span className="text-red-500">- {formatCurrency(venda.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-dashed border-ilunna-light">
              <span>TOTAL</span>
              <span className="text-ilunna-terracotta">{formatCurrency(venda.total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="text-xs space-y-1 bg-ilunna-light/50 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="text-ilunna-muted">Pagamento</span>
              <span className="font-medium">{FORMA_LABELS[venda.forma_pagamento] ?? venda.forma_pagamento}</span>
            </div>
            {venda.valor_recebido !== undefined && (
              <div className="flex justify-between">
                <span className="text-ilunna-muted">Recebido</span>
                <span>{formatCurrency(venda.valor_recebido)}</span>
              </div>
            )}
            {venda.troco !== undefined && venda.troco > 0 && (
              <div className="flex justify-between font-bold">
                <span>Troco</span>
                <span className="text-green-600">{formatCurrency(venda.troco)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-ilunna-muted pt-1">
            <p>Obrigada pela sua compra!</p>
            <p className="mt-0.5">ilunna.com.br</p>
          </div>
        </div>

        {/* Actions — hidden on print */}
        <div className="print:hidden flex gap-3 p-4 bg-ilunna-cream border-t border-ilunna-light">
          <Button
            variant="outline"
            className="flex-1 border-ilunna-light"
            onClick={() => {
              window.setTimeout(() => window.print(), 0)
            }}
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
            onClick={onNovaVenda}
          >
            <ShoppingBag className="w-4 h-4 mr-2" /> Nova Venda
          </Button>
        </div>

        <style>{`
          @media print {
            @page {
              margin: 8mm;
            }

            html,
            body {
              background: white !important;
              height: auto !important;
              overflow: visible !important;
            }

            body * {
              visibility: hidden !important;
            }

            #comprovante,
            #comprovante * {
              visibility: visible !important;
            }

            #comprovante {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              background: white !important;
              color: #2b1b14 !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
