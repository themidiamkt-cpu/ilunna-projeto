import { useState } from 'react'
import { Plus, Trash2, FlaskConical, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useFichaTecnica, useSaveFichaTecnica, useProduto } from '@/hooks/useProdutos'
import { useInsumos } from '@/hooks/useInsumos'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  produtoId: string
}

type LinhaFicha = {
  insumo_id: string
  quantidade: number
}

export function FichaTecnicaEditor({ open, onClose, produtoId }: Props) {
  const { data: produto } = useProduto(produtoId)
  const { data: fichaExistente = [], isLoading } = useFichaTecnica(produtoId)
  const { data: insumos = [] } = useInsumos()
  const saveFicha = useSaveFichaTecnica()

  const [linhas, setLinhas] = useState<LinhaFicha[]>([])
  const [inicializado, setInicializado] = useState(false)

  if (!inicializado && fichaExistente.length >= 0 && !isLoading) {
    setLinhas(fichaExistente.map(f => ({ insumo_id: f.insumo_id, quantidade: f.quantidade })))
    setInicializado(true)
  }

  function resetAndClose() {
    setInicializado(false)
    onClose()
  }

  function addLinha() {
    setLinhas(prev => [...prev, { insumo_id: '', quantidade: 0 }])
  }

  function removeLinha(idx: number) {
    setLinhas(prev => prev.filter((_, i) => i !== idx))
  }

  function updateLinha(idx: number, field: keyof LinhaFicha, value: string | number) {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  // Live cost calculation
  const custoCalculado = linhas.reduce((sum, l) => {
    const ins = insumos.find(i => i.id === l.insumo_id)
    if (!ins || !l.quantidade) return sum
    return sum + ins.custo_unitario * l.quantidade
  }, 0)

  const precoVenda = produto?.preco_venda ?? 0
  const margemValor = precoVenda - custoCalculado
  const margemPct = precoVenda > 0 ? (margemValor / precoVenda) * 100 : 0
  const margemBaixa = margemPct < 50 && precoVenda > 0

  function handleSave() {
    const validas = linhas.filter(l => l.insumo_id && l.quantidade > 0)
    saveFicha.mutate({ produtoId, items: validas }, { onSuccess: resetAndClose })
  }

  // Insumos já usados (para evitar duplicatas no select)
  const usedIds = linhas.map(l => l.insumo_id).filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={v => !v && resetAndClose()}>
      <DialogContent className="max-w-2xl bg-ilunna-cream border-ilunna-light">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ilunna-dark flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-ilunna-terracotta" />
            Ficha Técnica{produto ? `: ${produto.nome}` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* Cost summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-ilunna-light p-3 text-center">
            <p className="text-xs text-ilunna-muted">Custo de Produção</p>
            <p className="text-lg font-bold text-ilunna-dark mt-0.5">{formatCurrency(custoCalculado)}</p>
          </div>
          <div className="bg-white rounded-xl border border-ilunna-light p-3 text-center">
            <p className="text-xs text-ilunna-muted">Margem Valor</p>
            <p className={`text-lg font-bold mt-0.5 ${margemValor >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(margemValor)}</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${margemBaixa ? 'bg-amber-50 border-amber-200' : 'bg-white border-ilunna-light'}`}>
            <p className="text-xs text-ilunna-muted">Margem %</p>
            <p className={`text-lg font-bold mt-0.5 ${margemPct >= 50 ? 'text-green-600' : margemPct >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
              {formatPercent(margemPct)}
            </p>
          </div>
        </div>

        {margemBaixa && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              Margem abaixo de 50%. Considere ajustar o preço de venda ou reduzir o custo dos insumos.
            </AlertDescription>
          </Alert>
        )}

        {/* Lines table */}
        <div className="bg-white rounded-xl border border-ilunna-light overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-ilunna-light hover:bg-transparent">
                <TableHead className="text-ilunna-muted font-medium">Insumo</TableHead>
                <TableHead className="text-ilunna-muted font-medium w-28">Quantidade</TableHead>
                <TableHead className="text-ilunna-muted font-medium w-16">Un.</TableHead>
                <TableHead className="text-ilunna-muted font-medium w-24">Custo/Un</TableHead>
                <TableHead className="text-ilunna-muted font-medium w-24">Custo Linha</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-9 w-full" /></TableCell></TableRow>
                ))
              ) : linhas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-ilunna-muted text-sm">
                    Nenhum insumo adicionado. Clique em "Adicionar Insumo" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                linhas.map((linha, idx) => {
                  const ins = insumos.find(i => i.id === linha.insumo_id)
                  const custoLinha = ins && linha.quantidade ? ins.custo_unitario * linha.quantidade : 0
                  return (
                    <TableRow key={idx} className="border-ilunna-light">
                      <TableCell>
                        <select
                          value={linha.insumo_id}
                          onChange={e => updateLinha(idx, 'insumo_id', e.target.value)}
                          className="w-full border border-ilunna-light rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-ilunna-terracotta text-ilunna-dark"
                        >
                          <option value="">Selecionar insumo...</option>
                          {insumos
                            .filter(i => i.ativo && (i.id === linha.insumo_id || !usedIds.includes(i.id)))
                            .map(i => (
                              <option key={i.id} value={i.id}>{i.nome}</option>
                            ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={linha.quantidade || ''}
                          onChange={e => updateLinha(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm border-ilunna-light"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-ilunna-muted">{ins?.unidade ?? '-'}</TableCell>
                      <TableCell className="text-xs text-ilunna-muted">{ins ? formatCurrency(ins.custo_unitario) : '-'}</TableCell>
                      <TableCell className="font-medium text-ilunna-dark text-sm">{formatCurrency(custoLinha)}</TableCell>
                      <TableCell>
                        <button onClick={() => removeLinha(idx)} className="text-ilunna-muted hover:text-red-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" className="border-ilunna-light gap-1.5 self-start" onClick={addLinha}>
          <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
        </Button>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 border-ilunna-light" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
            onClick={handleSave}
            disabled={saveFicha.isPending}
          >
            {saveFicha.isPending ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
