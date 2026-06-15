import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Minus, Plus, Trash2, X, ChevronRight, Lock, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FecharCaixaDialog } from './FecharCaixaDialog'
import { FinalizarVendaDialog } from './FinalizarVendaDialog'
import { useProdutos } from '@/hooks/useProdutos'
import { useCategorias } from '@/hooks/useCategorias'
import { useClientesBusca } from '@/hooks/useClientes'
import { formatCurrency } from '@/lib/utils'
import type { Caixa } from '@/types/database.types'

export type CartItem = {
  produto_id: string
  nome: string
  preco_unitario: number
  quantidade: number
  estoque_disponivel: number
}

type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro'
const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'outro', label: 'Outro' },
]

interface Props { caixa: Caixa }

export function CaixaAberto({ caixa }: Props) {
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [cart, setCart] = useState<CartItem[]>([])
  const [desconto, setDesconto] = useState('')
  const [descontoTipo, setDescontoTipo] = useState<'valor' | 'percentual'>('valor')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState<string>('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteDropdown, setClienteDropdown] = useState(false)
  const [clienteErro, setClienteErro] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)
  const [showFinalizar, setShowFinalizar] = useState(false)
  const [showFechar, setShowFechar] = useState(false)

  const { data: produtos = [] } = useProdutos()
  const { data: categorias = [] } = useCategorias()
  const { data: clientesSugeridos = [] } = useClientesBusca(clienteBusca)

  // Close cliente dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) {
        setClienteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      if (!p.ativo) return false
      const matchBusca = busca === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(busca.toLowerCase())
      const matchCat = categoriaFiltro === 'todos' || p.categoria_id === categoriaFiltro
      return matchBusca && matchCat
    })
  }, [produtos, busca, categoriaFiltro])

  function addToCart(produto: typeof produtos[0]) {
    if ((produto.estoque_atual ?? 0) <= 0) return
    setCart(prev => {
      const existing = prev.find(i => i.produto_id === produto.id)
      if (existing) {
        if (existing.quantidade >= existing.estoque_disponivel) return prev
        return prev.map(i => i.produto_id === produto.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i)
      }
      return [...prev, {
        produto_id: produto.id,
        nome: produto.nome,
        preco_unitario: produto.preco_venda,
        quantidade: 1,
        estoque_disponivel: produto.estoque_atual,
      }]
    })
  }

  function updateQty(produtoId: string, delta: number) {
    setCart(prev => prev
      .map(i => i.produto_id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i)
      .filter(i => i.quantidade > 0)
    )
  }

  function removeFromCart(produtoId: string) {
    setCart(prev => prev.filter(i => i.produto_id !== produtoId))
  }

  const subtotal = cart.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0)
  const descontoNum = parseFloat(desconto.replace(',', '.')) || 0
  const descontoValor = descontoTipo === 'percentual' ? subtotal * descontoNum / 100 : descontoNum
  const total = Math.max(0, subtotal - descontoValor)
  const trocoNum = formaPagamento === 'dinheiro'
    ? Math.max(0, (parseFloat(valorRecebido.replace(',', '.')) || 0) - total)
    : 0

  function abrirFinalizacao() {
    if (!clienteId) {
      setClienteErro(true)
      setClienteDropdown(true)
      return
    }
    setShowFinalizar(true)
  }

  function onVendaFinalizada() {
    setCart([])
    setDesconto('')
    setValorRecebido('')
    setClienteId(null)
    setClienteNome('')
    setClienteBusca('')
    setFormaPagamento('dinheiro')
    setShowFinalizar(false)
  }

  return (
    <div className="flex h-screen bg-ilunna-cream overflow-hidden">
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-ilunna-light">
        {/* Header */}
        <div className="bg-white border-b border-ilunna-light px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="font-display text-lg text-ilunna-dark whitespace-nowrap">Ilunna PDV</h1>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ilunna-muted" />
            <Input
              placeholder="Buscar produto ou SKU..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9 h-9 border-ilunna-light bg-ilunna-cream focus:border-ilunna-terracotta"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-ilunna-light text-ilunna-muted hover:text-ilunna-brown gap-1.5"
            onClick={() => setShowFechar(true)}
          >
            <Lock className="w-3.5 h-3.5" /> Fechar Caixa
          </Button>
        </div>

        {/* Category tabs */}
        <div className="bg-white border-b border-ilunna-light px-4 overflow-x-auto">
          <div className="flex gap-1 py-2 min-w-max">
            <button
              onClick={() => setCategoriaFiltro('todos')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoriaFiltro === 'todos'
                  ? 'bg-ilunna-terracotta text-white'
                  : 'text-ilunna-muted hover:text-ilunna-brown hover:bg-ilunna-light'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  categoriaFiltro === cat.id
                    ? 'bg-ilunna-terracotta text-white'
                    : 'text-ilunna-muted hover:text-ilunna-brown hover:bg-ilunna-light'
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-ilunna-muted">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {produtosFiltrados.map(produto => {
                const inCart = cart.find(i => i.produto_id === produto.id)
                const semEstoque = (produto.estoque_atual ?? 0) <= 0
                return (
                  <button
                    key={produto.id}
                    onClick={() => addToCart(produto)}
                    disabled={semEstoque}
                    className={`relative text-left rounded-xl border p-3 transition-all min-h-[88px] ${
                      semEstoque
                        ? 'border-ilunna-light bg-ilunna-light/30 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'border-ilunna-terracotta bg-orange-50 shadow-sm'
                        : 'border-ilunna-light bg-white hover:border-ilunna-terracotta hover:shadow-sm'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-ilunna-terracotta text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {inCart.quantidade}
                      </span>
                    )}
                    {semEstoque && (
                      <span className="absolute top-2 right-2 bg-gray-400 text-white text-xs px-1.5 py-0.5 rounded-md">
                        Esgotado
                      </span>
                    )}
                    <p className="text-sm font-medium text-ilunna-dark leading-tight pr-6">{produto.nome}</p>
                    {produto.sku && <p className="text-xs text-ilunna-muted mt-0.5">{produto.sku}</p>}
                    <p className="text-base font-bold text-ilunna-terracotta mt-1">{formatCurrency(produto.preco_venda)}</p>
                    <p className="text-xs text-ilunna-muted">Estoque: {produto.estoque_atual ?? 0}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-80 lg:w-96 flex flex-col bg-white">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-ilunna-light space-y-2">
          <h2 className="font-medium text-ilunna-dark">
            Carrinho{cart.length > 0 && <span className="ml-2 text-ilunna-terracotta">({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>}
          </h2>

          {/* Cliente selector */}
          <div ref={clienteRef} className="relative">
            <div className="flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-ilunna-muted flex-shrink-0" />
              {clienteId ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-sm font-medium text-ilunna-dark truncate">{clienteNome}</span>
                  <button
                    className="ml-auto text-ilunna-muted hover:text-red-500 flex-shrink-0"
                    onClick={() => { setClienteId(null); setClienteNome(''); setClienteBusca(''); setClienteErro(true) }}
                    title="Remover cliente"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <input
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-ilunna-muted/60 text-ilunna-dark"
                  placeholder="Buscar cliente..."
                  value={clienteBusca}
                  onChange={e => { setClienteBusca(e.target.value); setClienteDropdown(true); setClienteErro(false) }}
                  onFocus={() => setClienteDropdown(true)}
                  aria-invalid={clienteErro}
                />
              )}
            </div>
            {!clienteId && (
              <p className={`mt-1 pl-5 text-xs ${clienteErro ? 'text-red-600' : 'text-ilunna-muted'}`}>
                Selecione um cliente para registrar a venda.
              </p>
            )}

            {/* Dropdown */}
            {clienteDropdown && !clienteId && clientesSugeridos.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ilunna-light rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {clientesSugeridos.map(c => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-ilunna-light transition-colors"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      setClienteId(c.id)
                      setClienteNome(c.nome)
                      setClienteBusca('')
                      setClienteErro(false)
                      setClienteDropdown(false)
                    }}
                  >
                    <span className="font-medium text-ilunna-dark">{c.nome}</span>
                    {c.telefone && <span className="ml-2 text-ilunna-muted text-xs">{c.telefone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-ilunna-muted px-4 text-center">
              <ChevronRight className="w-6 h-6 mb-1 opacity-40" />
              <p className="text-sm">Toque nos produtos para adicionar</p>
            </div>
          ) : (
            <div className="divide-y divide-ilunna-light">
              {cart.map(item => (
                <div key={item.produto_id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ilunna-dark truncate">{item.nome}</p>
                    <p className="text-xs text-ilunna-muted">{formatCurrency(item.preco_unitario)} cada</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="w-7 h-7 rounded-lg border border-ilunna-light flex items-center justify-center hover:border-ilunna-terracotta text-ilunna-muted hover:text-ilunna-terracotta"
                      onClick={() => updateQty(item.produto_id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-ilunna-dark">{item.quantidade}</span>
                    <button
                      className="w-7 h-7 rounded-lg border border-ilunna-light flex items-center justify-center hover:border-ilunna-terracotta text-ilunna-muted hover:text-ilunna-terracotta"
                      onClick={() => updateQty(item.produto_id, 1)}
                      disabled={item.quantidade >= item.estoque_disponivel}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-semibold text-ilunna-dark">{formatCurrency(item.preco_unitario * item.quantidade)}</p>
                    <button onClick={() => removeFromCart(item.produto_id)} className="text-ilunna-muted hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: discount, payment, totals */}
        <div className="border-t border-ilunna-light p-4 space-y-4">
          {/* Discount */}
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-ilunna-light overflow-hidden text-xs">
              <button
                className={`px-2 py-1.5 font-medium ${descontoTipo === 'valor' ? 'bg-ilunna-terracotta text-white' : 'text-ilunna-muted'}`}
                onClick={() => setDescontoTipo('valor')}
              >R$</button>
              <button
                className={`px-2 py-1.5 font-medium ${descontoTipo === 'percentual' ? 'bg-ilunna-terracotta text-white' : 'text-ilunna-muted'}`}
                onClick={() => setDescontoTipo('percentual')}
              >%</button>
            </div>
            <Input
              placeholder="Desconto"
              value={desconto}
              onChange={e => setDesconto(e.target.value)}
              className="h-8 text-sm border-ilunna-light"
            />
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-5 gap-1">
            {FORMAS.map(f => (
              <button
                key={f.value}
                onClick={() => setFormaPagamento(f.value)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  formaPagamento === f.value
                    ? 'bg-ilunna-terracotta text-white'
                    : 'bg-ilunna-light text-ilunna-muted hover:text-ilunna-brown'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Troco */}
          {formaPagamento === 'dinheiro' && (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-ilunna-muted whitespace-nowrap">Valor recebido</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ilunna-muted">R$</span>
                <Input
                  placeholder="0,00"
                  value={valorRecebido}
                  onChange={e => setValorRecebido(e.target.value)}
                  className="pl-7 h-8 text-sm border-ilunna-light"
                />
              </div>
              {trocoNum > 0 && (
                <span className="text-xs font-bold text-green-600 whitespace-nowrap">
                  Troco: {formatCurrency(trocoNum)}
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-ilunna-muted">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {descontoValor > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Desconto</span><span>- {formatCurrency(descontoValor)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl">
              <span className="text-ilunna-brown">Total</span>
              <span className="text-ilunna-terracotta">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full h-14 text-base font-bold bg-ilunna-terracotta hover:bg-ilunna-brown text-white shadow-lg"
            disabled={cart.length === 0}
            onClick={abrirFinalizacao}
          >
            FINALIZAR VENDA
          </Button>
        </div>
      </div>

      <FecharCaixaDialog caixa={caixa} open={showFechar} onClose={() => setShowFechar(false)} />
      {showFinalizar && clienteId && (
        <FinalizarVendaDialog
          open={showFinalizar}
          onClose={() => setShowFinalizar(false)}
          cart={cart}
          subtotal={subtotal}
          descontoValor={descontoValor}
          total={total}
          formaPagamento={formaPagamento}
          valorRecebido={formaPagamento === 'dinheiro' ? parseFloat(valorRecebido.replace(',', '.')) || 0 : undefined}
          troco={formaPagamento === 'dinheiro' ? trocoNum : undefined}
          caixaId={caixa.id}
          clienteId={clienteId}
          onSuccess={onVendaFinalizada}
        />
      )}
    </div>
  )
}
