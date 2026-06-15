import { useState } from 'react'
import { Plus, Pencil, ArrowDownToLine, FlaskConical, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInsumos } from '@/hooks/useInsumos'
import type { Insumo } from '@/types/database.types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { InsumoDialog } from './InsumoDialog'
import { EntradaInsumoDialog } from './EntradaInsumoDialog'

const TIPO_LABELS: Record<string, string> = {
  liquido: 'Líquido', solido: 'Sólido', embalagem: 'Embalagem', acessorio: 'Acessório',
}
const TIPO_COLORS: Record<string, string> = {
  liquido: 'bg-blue-100 text-blue-700', solido: 'bg-amber-100 text-amber-700',
  embalagem: 'bg-purple-100 text-purple-700', acessorio: 'bg-green-100 text-green-700',
}

export default function Insumos() {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editInsumo, setEditInsumo] = useState<Insumo | null>(null)
  const [entradaInsumo, setEntradaInsumo] = useState<Insumo | null>(null)

  const { data: insumos = [], isLoading } = useInsumos()

  const filtrados = insumos.filter(i => {
    const mb = busca === '' || i.nome.toLowerCase().includes(busca.toLowerCase())
    const mt = tipoFiltro === 'todos' || i.tipo === tipoFiltro
    return mb && mt
  })

  const total = insumos.filter(i => i.ativo).length
  const estoqueBaixo = insumos.filter(i => i.ativo && i.estoque_atual <= i.estoque_minimo).length
  const valorizacao = insumos.reduce((s, i) => s + i.estoque_atual * i.custo_unitario, 0)

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ilunna-dark">Insumos</h1>
          <p className="text-ilunna-muted text-sm mt-0.5">Matérias-primas e embalagens</p>
        </div>
        <Button className="bg-ilunna-terracotta hover:bg-ilunna-brown text-white gap-2" onClick={() => { setEditInsumo(null); setDialogOpen(true) }}>
          <Plus className="w-4 h-4" /> Novo Insumo
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-ilunna-light">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ilunna-light flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-ilunna-terracotta" />
            </div>
            <div><p className="text-2xl font-bold text-ilunna-dark">{total}</p><p className="text-xs text-ilunna-muted">Insumos ativos</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-ilunna-light">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div><p className="text-2xl font-bold text-amber-600">{estoqueBaixo}</p><p className="text-xs text-ilunna-muted">Estoque baixo</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white border-ilunna-light">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-green-600" />
            </div>
            <div><p className="text-lg font-bold text-green-700">{formatCurrency(valorizacao)}</p><p className="text-xs text-ilunna-muted">Valor em estoque</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar insumo..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs border-ilunna-light" />
        <Tabs value={tipoFiltro} onValueChange={setTipoFiltro}>
          <TabsList className="bg-white border border-ilunna-light">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="liquido">Líquidos</TabsTrigger>
            <TabsTrigger value="solido">Sólidos</TabsTrigger>
            <TabsTrigger value="embalagem">Embalagens</TabsTrigger>
            <TabsTrigger value="acessorio">Acessórios</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-ilunna-light shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-ilunna-light hover:bg-transparent">
              <TableHead className="text-ilunna-muted font-medium">Nome</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Tipo</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Vol. Compra</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Custo Compra</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Custo/Un</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Estoque</TableHead>
              <TableHead className="text-right text-ilunna-muted font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-ilunna-muted">
                    <FlaskConical className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Nenhum insumo encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtrados.map(ins => {
              const baixo = ins.estoque_atual <= ins.estoque_minimo
              return (
                <TableRow key={ins.id} className={`border-ilunna-light ${baixo ? 'bg-amber-50' : 'hover:bg-ilunna-light/30'}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-ilunna-dark">{ins.nome}</p>
                      {ins.fornecedor && <p className="text-xs text-ilunna-muted">{ins.fornecedor}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[ins.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TIPO_LABELS[ins.tipo] ?? ins.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-ilunna-dark">{formatNumber(ins.volume_compra, 0)} {ins.unidade}</TableCell>
                  <TableCell className="text-ilunna-dark">{formatCurrency(ins.custo_compra)}</TableCell>
                  <TableCell>
                    <span className="text-ilunna-terracotta font-semibold text-sm">{formatCurrency(ins.custo_unitario)}</span>
                    <span className="text-xs text-ilunna-muted">/{ins.unidade}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${baixo ? 'text-amber-600' : 'text-ilunna-dark'}`}>{formatNumber(ins.estoque_atual, 2)}</span>
                    <span className="text-xs text-ilunna-muted ml-1">{ins.unidade} / mín {formatNumber(ins.estoque_minimo, 0)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-green-600" title="Registrar entrada" onClick={() => setEntradaInsumo(ins)}>
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-ilunna-terracotta" onClick={() => { setEditInsumo(ins); setDialogOpen(true) }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <InsumoDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditInsumo(null) }} insumo={editInsumo} />
      {entradaInsumo && <EntradaInsumoDialog open={!!entradaInsumo} onOpenChange={(open) => { if (!open) setEntradaInsumo(null) }} insumo={entradaInsumo} />}
    </div>
  )
}
