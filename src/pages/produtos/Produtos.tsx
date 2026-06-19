import { useState } from 'react'
import { Calculator, Plus, Pencil, Copy, Trash2, FlaskConical, Package, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PRODUCT_MARKUP, useApplyProductMarkup, useDeleteProduto, useProdutos } from '@/hooks/useProdutos'
import { useCategorias } from '@/hooks/useCategorias'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { ProdutoDialog } from './ProdutoDialog'
import { FichaTecnicaEditor } from './FichaTecnicaEditor'

function MargemBadge({ pct }: { pct: number | null }) {
  if (pct == null) return null
  const color = pct >= 50 ? 'bg-green-100 text-green-700' : pct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{formatPercent(pct)}</span>
}

export default function Produtos() {
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [fichaId, setFichaId] = useState<string | null>(null)
  const [deleteProduto, setDeleteProduto] = useState<{ id: string; nome: string } | null>(null)

  const { data: produtos = [], isLoading } = useProdutos()
  const { data: categorias = [] } = useCategorias()
  const applyMarkup = useApplyProductMarkup()
  const deleteMutation = useDeleteProduto()

  const filtrados = produtos.filter(p => {
    const mb = busca === '' || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(busca.toLowerCase())
    const mc = catFiltro === 'todos' || p.categoria_id === catFiltro
    return mb && mc
  })

  const ativos = produtos.filter(p => p.ativo).length
  const estoqueBaixo = produtos.filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo).length
  const margemMedia = produtos.length > 0
    ? produtos.reduce((s, p) => s + (p.margem_percentual ?? 0), 0) / produtos.length
    : 0

  function openEdit(id: string) { setEditId(id); setDuplicateId(null); setDialogOpen(true) }
  function openDuplicate(id: string) { setEditId(null); setDuplicateId(id); setDialogOpen(true) }
  function openNew() { setEditId(null); setDuplicateId(null); setDialogOpen(true) }
  function closeDialog() { setDialogOpen(false); setEditId(null); setDuplicateId(null) }
  function handleDelete() {
    if (!deleteProduto) return
    deleteMutation.mutate(deleteProduto.id, { onSuccess: () => setDeleteProduto(null) })
  }

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ilunna-dark">Produtos</h1>
          <p className="text-ilunna-muted text-sm mt-0.5">Produtos acabados e seus custos de produção</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-ilunna-light gap-2"
            onClick={() => applyMarkup.mutate()}
            disabled={applyMarkup.isPending}
          >
            <Calculator className="w-4 h-4" />
            {applyMarkup.isPending ? 'Aplicando...' : `Markup ${PRODUCT_MARKUP}`}
          </Button>
          <Button className="bg-ilunna-terracotta hover:bg-ilunna-brown text-white gap-2" onClick={openNew}>
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-ilunna-light">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ilunna-light flex items-center justify-center">
              <Package className="w-5 h-5 text-ilunna-terracotta" />
            </div>
            <div><p className="text-2xl font-bold text-ilunna-dark">{ativos}</p><p className="text-xs text-ilunna-muted">Produtos ativos</p></div>
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
              <TrendingDown className="w-5 h-5 text-green-600 rotate-180" />
            </div>
            <div><p className="text-2xl font-bold text-green-700">{formatPercent(margemMedia)}</p><p className="text-xs text-ilunna-muted">Margem média</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input placeholder="Buscar por nome ou SKU..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs border-ilunna-light" />
        <Select value={catFiltro} onValueChange={setCatFiltro}>
          <SelectTrigger className="w-48 border-ilunna-light">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-ilunna-light shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-ilunna-light hover:bg-transparent">
              <TableHead className="text-ilunna-muted font-medium">Produto</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Categoria</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Preço Venda</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Custo Prod.</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Margem</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Estoque</TableHead>
              <TableHead className="text-ilunna-muted font-medium">Status</TableHead>
              <TableHead className="text-right text-ilunna-muted font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-ilunna-muted">
                    <Package className="w-10 h-10 opacity-30" />
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm">Clique em "Novo Produto" para cadastrar o primeiro</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map(p => {
                const baixo = p.estoque_atual <= p.estoque_minimo
                return (
                  <TableRow key={p.id} className={`border-ilunna-light ${baixo ? 'bg-amber-50' : 'hover:bg-ilunna-light/30'}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-ilunna-dark">{p.nome}</p>
                        {p.sku && <p className="text-xs text-ilunna-muted">{p.sku}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(p as any).categorias ? (
                        <Badge style={{ backgroundColor: (p as any).categorias.cor + '20', color: (p as any).categorias.cor, border: `1px solid ${(p as any).categorias.cor}40` }} className="font-medium">
                          {(p as any).categorias.nome}
                        </Badge>
                      ) : <span className="text-ilunna-muted/50 text-xs">Sem categoria</span>}
                    </TableCell>
                    <TableCell className="font-medium text-ilunna-dark">{formatCurrency(p.preco_venda)}</TableCell>
                    <TableCell className="text-ilunna-muted">{formatCurrency(p.custo_producao)}</TableCell>
                    <TableCell><MargemBadge pct={p.margem_percentual} /></TableCell>
                    <TableCell>
                      <span className={`font-medium ${baixo ? 'text-amber-600' : 'text-ilunna-dark'}`}>{p.estoque_atual}</span>
                      <span className="text-xs text-ilunna-muted ml-1">/ mín {p.estoque_minimo}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? 'default' : 'secondary'} className={p.ativo ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-ilunna-terracotta" onClick={() => setFichaId(p.id)} title="Ficha Técnica">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-ilunna-terracotta" onClick={() => openEdit(p.id)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-ilunna-terracotta" onClick={() => openDuplicate(p.id)} title="Duplicar produto">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-ilunna-muted hover:text-red-500" onClick={() => setDeleteProduto({ id: p.id, nome: p.nome })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ProdutoDialog open={dialogOpen} onClose={closeDialog} editId={editId} duplicateId={duplicateId} />
      {fichaId && <FichaTecnicaEditor open={!!fichaId} onClose={() => setFichaId(null)} produtoId={fichaId} />}

      <Dialog open={!!deleteProduto} onOpenChange={(open: boolean) => { if (!open) setDeleteProduto(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-ilunna-dark">Excluir produto?</DialogTitle>
            <DialogDescription className="text-ilunna-muted">
              Esta acao nao pode ser desfeita. O produto "{deleteProduto?.nome}" sera removido do cadastro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteProduto(null)} className="border-ilunna-light">
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
