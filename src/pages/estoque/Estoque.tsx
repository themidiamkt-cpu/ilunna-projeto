import { useState } from 'react'
import { AlertTriangle, Package, FlaskConical, History, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils'

function useEstoqueValorizacao() {
  return useQuery({
    queryKey: ['estoque', 'valorizacao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vw_valorizacao_estoque').select('*')
      if (error) throw error
      return data
    },
  })
}

function useEstoqueBaixo() {
  return useQuery({
    queryKey: ['estoque', 'baixo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vw_estoque_baixo').select('*').order('falta', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function useMovimentacoes(tipo: string) {
  return useQuery({
    queryKey: ['movimentacoes', tipo],
    queryFn: async () => {
      let q = supabase.from('movimentacoes_estoque').select('*').order('data', { ascending: false }).limit(50)
      if (tipo !== 'todos') q = q.eq('tipo', tipo as 'entrada_insumo' | 'producao' | 'venda' | 'ajuste' | 'perda')
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

const TIPO_MOV_LABELS: Record<string, string> = {
  entrada_insumo: 'Entrada', producao: 'Produção', venda: 'Venda', ajuste: 'Ajuste', perda: 'Perda',
}
const TIPO_MOV_COLORS: Record<string, string> = {
  entrada_insumo: 'bg-green-100 text-green-700', producao: 'bg-blue-100 text-blue-700',
  venda: 'bg-orange-100 text-orange-700', ajuste: 'bg-gray-100 text-gray-600', perda: 'bg-red-100 text-red-600',
}

export default function Estoque() {
  const [tipoMov, setTipoMov] = useState('todos')
  const { data: valorizacao = [], isLoading: loadingVal } = useEstoqueValorizacao()
  const { data: alertas = [], isLoading: loadingAlertas } = useEstoqueBaixo()
  const { data: movs = [], isLoading: loadingMovs } = useMovimentacoes(tipoMov)

  const produtos = valorizacao.filter((v: any) => v.tipo === 'produto')
  const insumos = valorizacao.filter((v: any) => v.tipo === 'insumo')
  const totalProdutosCusto = produtos.reduce((s: number, p: any) => s + (p.valor_custo ?? 0), 0)
  const totalProdutosVenda = produtos.reduce((s: number, p: any) => s + (p.valor_venda ?? 0), 0)
  const totalInsumosCusto = insumos.reduce((s: number, i: any) => s + (i.valor_custo ?? 0), 0)

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      <div>
        <h1 className="font-display text-2xl text-ilunna-dark">Estoque</h1>
        <p className="text-ilunna-muted text-sm mt-0.5">Visão geral do estoque e movimentações</p>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList className="bg-white border border-ilunna-light">
          <TabsTrigger value="produtos" className="gap-1.5"><Package className="w-3.5 h-3.5" />Produtos Acabados</TabsTrigger>
          <TabsTrigger value="insumos" className="gap-1.5"><FlaskConical className="w-3.5 h-3.5" />Insumos</TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />Alertas
            {alertas.length > 0 && <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{alertas.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5"><History className="w-3.5 h-3.5" />Histórico</TabsTrigger>
        </TabsList>

        {/* Produtos */}
        <TabsContent value="produtos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white border-ilunna-light">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-ilunna-muted">Valor a Custo</p>
                <p className="text-xl font-bold text-ilunna-dark">{formatCurrency(totalProdutosCusto)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-ilunna-light">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-ilunna-muted">Valor a Preço de Venda</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalProdutosVenda)}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-ilunna-light shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-ilunna-light hover:bg-transparent">
                  <TableHead className="text-ilunna-muted font-medium">Produto</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Qtd</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Custo Un.</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Valor Custo</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Preço Venda</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Valor Venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVal ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)
                ) : produtos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-ilunna-muted">Nenhum produto em estoque</TableCell></TableRow>
                ) : produtos.map((p: any) => (
                  <TableRow key={p.id} className="border-ilunna-light hover:bg-ilunna-light/30">
                    <TableCell className="font-medium text-ilunna-dark">{p.nome}</TableCell>
                    <TableCell>{formatNumber(p.quantidade, 0)}</TableCell>
                    <TableCell className="text-ilunna-muted">{formatCurrency(p.custo_unitario)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.valor_custo)}</TableCell>
                    <TableCell className="text-ilunna-muted">{formatCurrency(p.preco_unitario)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatCurrency(p.valor_venda)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Insumos */}
        <TabsContent value="insumos" className="space-y-4 mt-4">
          <Card className="bg-white border-ilunna-light">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-ilunna-muted">Valor total de insumos em estoque (custo)</p>
              <p className="text-xl font-bold text-ilunna-dark">{formatCurrency(totalInsumosCusto)}</p>
            </CardContent>
          </Card>
          <Card className="border-ilunna-light shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-ilunna-light hover:bg-transparent">
                  <TableHead className="text-ilunna-muted font-medium">Insumo</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Qtd</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Custo/Un</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVal ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)
                ) : insumos.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-ilunna-muted">Nenhum insumo em estoque</TableCell></TableRow>
                ) : insumos.map((ins: any) => (
                  <TableRow key={ins.id} className="border-ilunna-light hover:bg-ilunna-light/30">
                    <TableCell className="font-medium text-ilunna-dark">{ins.nome}</TableCell>
                    <TableCell>{formatNumber(ins.quantidade, 2)}</TableCell>
                    <TableCell className="text-ilunna-muted">{formatCurrency(ins.custo_unitario)}</TableCell>
                    <TableCell className="font-semibold text-ilunna-dark">{formatCurrency(ins.valor_custo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alertas" className="mt-4">
          {loadingAlertas ? <Skeleton className="h-40 w-full" /> : alertas.length === 0 ? (
            <Card className="bg-white border-ilunna-light">
              <CardContent className="py-16 flex flex-col items-center gap-2 text-green-600">
                <CheckCircle2 className="w-10 h-10" />
                <p className="font-semibold text-lg">Estoque normalizado</p>
                <p className="text-sm text-ilunna-muted">Todos os itens estão acima do estoque mínimo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(alertas as any[]).map((item, i) => (
                <Card key={i} className={`border ${item.estoque_atual <= 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${item.estoque_atual <= 0 ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ilunna-dark">{item.nome}</p>
                      <p className="text-xs text-ilunna-muted capitalize">{item.tipo}{item.unidade ? ` (${item.unidade})` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold ${item.estoque_atual <= 0 ? 'text-red-500' : 'text-amber-600'}`}>
                        {item.estoque_atual <= 0 ? 'ZERADO' : `${formatNumber(item.estoque_atual, 1)} / mín ${formatNumber(item.estoque_minimo, 0)}`}
                      </p>
                      {item.falta > 0 && <p className="text-xs text-ilunna-muted">Falta: {formatNumber(item.falta, 1)}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="flex gap-3">
            <Select value={tipoMov} onValueChange={setTipoMov}>
              <SelectTrigger className="w-48 border-ilunna-light bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="entrada_insumo">Entrada</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
                <SelectItem value="perda">Perda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-ilunna-light shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-ilunna-light hover:bg-transparent">
                  <TableHead className="text-ilunna-muted font-medium">Data</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Tipo</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Item</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Qtd</TableHead>
                  <TableHead className="text-ilunna-muted font-medium">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMovs ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-9 w-full" /></TableCell></TableRow>)
                ) : movs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-ilunna-muted">Nenhuma movimentação encontrada</TableCell></TableRow>
                ) : movs.map((m: any) => (
                  <TableRow key={m.id} className="border-ilunna-light hover:bg-ilunna-light/30">
                    <TableCell className="text-xs text-ilunna-muted">{formatDateTime(m.data)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_MOV_COLORS[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_MOV_LABELS[m.tipo] ?? m.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-ilunna-muted">{m.referencia_tipo}</TableCell>
                    <TableCell className={`font-semibold ${m.quantidade > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {m.quantidade > 0 ? '+' : ''}{formatNumber(m.quantidade, 2)}
                    </TableCell>
                    <TableCell className="text-xs text-ilunna-muted">{m.motivo ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
