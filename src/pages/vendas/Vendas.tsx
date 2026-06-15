import { useState } from 'react'
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const FORMA_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro', pix: 'PIX', debito: 'Débito', credito: 'Crédito', outro: 'Outro',
}
const FORMA_COLORS: Record<string, string> = {
  dinheiro: 'bg-green-100 text-green-700', pix: 'bg-blue-100 text-blue-700',
  debito: 'bg-purple-100 text-purple-700', credito: 'bg-orange-100 text-orange-700', outro: 'bg-gray-100 text-gray-600',
}

function useVendasHistorico(busca: string, forma: string) {
  return useQuery({
    queryKey: ['vendas', 'historico', busca, forma],
    queryFn: async () => {
      let q = supabase
        .from('vendas')
        .select('*, clientes(nome), venda_itens(id, quantidade, preco_unitario, subtotal, produto_id, produtos(nome))')
        .order('data', { ascending: false })
        .limit(100)
      if (busca) q = q.ilike('numero', `%${busca}%`)
      if (forma !== 'todos') q = q.eq('forma_pagamento', forma as 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro')
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export default function Vendas() {
  const [busca, setBusca] = useState('')
  const [forma, setForma] = useState('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: vendas = [], isLoading } = useVendasHistorico(busca, forma)

  const totalFat = vendas.reduce((s: number, v: any) => s + (v.total ?? 0), 0)
  const totalDesc = vendas.reduce((s: number, v: any) => s + (v.desconto ?? 0), 0)

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      <div>
        <h1 className="font-display text-2xl text-ilunna-dark">Vendas</h1>
        <p className="text-ilunna-muted text-sm mt-0.5">Histórico completo de vendas</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-ilunna-light p-4">
          <p className="text-xs text-ilunna-muted">Total de vendas</p>
          <p className="text-2xl font-bold text-ilunna-dark">{vendas.length}</p>
        </Card>
        <Card className="bg-white border-ilunna-light p-4">
          <p className="text-xs text-ilunna-muted">Faturamento</p>
          <p className="text-2xl font-bold text-ilunna-terracotta">{formatCurrency(totalFat)}</p>
        </Card>
        <Card className="bg-white border-ilunna-light p-4">
          <p className="text-xs text-ilunna-muted">Descontos concedidos</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDesc)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar por número..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs border-ilunna-light" />
        <Select value={forma} onValueChange={setForma}>
          <SelectTrigger className="w-44 border-ilunna-light bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as formas</SelectItem>
            {Object.entries(FORMA_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-ilunna-light shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-ilunna-light hover:bg-transparent">
              <TableHead className="text-ilunna-muted font-medium w-8" />
              <TableHead className="text-ilunna-muted font-medium">Nº Venda</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Data</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Cliente</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Forma Pgto</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Desconto</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Total</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
            ) : vendas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-ilunna-muted">
                    <Receipt className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Nenhuma venda encontrada</p>
                    <p className="text-sm">As vendas registradas na Frente de Caixa aparecerão aqui</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : vendas.map((v: any) => {
              const expanded = expandedId === v.id
              return (
                <>
                  <TableRow
                    key={v.id}
                    className="border-ilunna-light hover:bg-ilunna-light/30 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : v.id)}
                  >
                    <TableCell>
                      {expanded ? <ChevronUp className="w-4 h-4 text-ilunna-muted" /> : <ChevronDown className="w-4 h-4 text-ilunna-muted" />}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-ilunna-dark">#{v.numero}</TableCell>
                    <TableCell className="text-sm text-ilunna-muted">{formatDateTime(v.data)}</TableCell>
                    <TableCell className="text-sm text-ilunna-dark">{v.clientes?.nome ?? <span className="text-ilunna-muted/50">Sem cadastro</span>}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${FORMA_COLORS[v.forma_pagamento] ?? 'bg-gray-100 text-gray-600'}`}>
                        {FORMA_LABELS[v.forma_pagamento] ?? v.forma_pagamento}
                      </span>
                    </TableCell>
                    <TableCell className={v.desconto > 0 ? 'text-red-500 font-medium' : 'text-ilunna-muted/50'}>
                      {v.desconto > 0 ? `- ${formatCurrency(v.desconto)}` : '-'}
                    </TableCell>
                    <TableCell className="font-bold text-ilunna-terracotta">{formatCurrency(v.total)}</TableCell>
                    <TableCell>
                      <Badge className={v.status === 'concluida' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-600'}>
                        {v.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {expanded && v.venda_itens?.length > 0 && (
                    <TableRow key={`${v.id}-detail`} className="bg-ilunna-light/30 border-ilunna-light">
                      <TableCell colSpan={8} className="py-2 px-6">
                        <div className="text-xs space-y-1">
                          {v.venda_itens.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-ilunna-muted">
                              <span>{item.produtos?.nome ?? item.produto_id}</span>
                              <span>{item.quantidade}x {formatCurrency(item.preco_unitario)} = <strong className="text-ilunna-dark">{formatCurrency(item.subtotal)}</strong></span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
