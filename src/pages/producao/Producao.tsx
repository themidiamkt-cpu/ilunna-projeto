import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Factory, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useProducoes, useRegistrarProducao, useVerificarInsumos } from '@/hooks/useProducao'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

export function Producao() {
  const { toast } = useToast()
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [lote, setLote] = useState('')
  const [observacao, setObservacao] = useState('')
  const [verificado, setVerificado] = useState(false)

  const { data: producoes, isLoading: loadingHistorico } = useProducoes()
  const { mutate: registrar, isPending: registrando } = useRegistrarProducao()
  const { data: verificacao, isLoading: verificando, refetch: verificarAgora } = useVerificarInsumos(produtoId, quantidade)

  // Reset verificado when produto or quantidade changes
  useEffect(() => { setVerificado(false) }, [produtoId, quantidade])

  const { data: produtos } = useQuery({
    queryKey: ['produtos', 'ativos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('id, nome, sku').eq('ativo', true).order('nome')
      if (error) throw error
      return data
    },
  })

  function handleVerificar() {
    verificarAgora().then(() => setVerificado(true))
  }

  function handleRegistrar() {
    if (!produtoId) return
    registrar(
      { produto_id: produtoId, quantidade, lote: lote || undefined, observacao: observacao || undefined },
      {
        onSuccess: (data) => {
          toast({
            title: 'Producao registrada',
            description: `Lote ${data.lote} criado. Custo total: ${formatCurrency(data.custo_total)}`,
          })
          setProdutoId('')
          setQuantidade(1)
          setLote('')
          setObservacao('')
          setVerificado(false)
        },
        onError: (err: Error) => {
          toast({ title: 'Erro ao registrar', description: err.message, variant: 'destructive' })
        },
      }
    )
  }

  const podeProduzir = verificado && (verificacao?.suficiente ?? false)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-ilunna-terracotta/10 rounded-lg flex items-center justify-center">
          <Factory className="w-5 h-5 text-ilunna-terracotta" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ilunna-dark">Producao</h1>
          <p className="text-sm text-ilunna-muted">Transforme insumos em produtos acabados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Nova Producao */}
        <Card className="border-ilunna-light">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-ilunna-dark text-lg">Nova Producao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Produto */}
            <div className="space-y-1.5">
              <Label htmlFor="produto">Produto</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger id="produto" className="border-ilunna-light">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {(produtos ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} <span className="text-ilunna-muted ml-1 text-xs">({p.sku})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            <div className="space-y-1.5">
              <Label htmlFor="qtd">Quantidade a produzir</Label>
              <Input
                id="qtd"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="border-ilunna-light"
              />
            </div>

            {/* Lote */}
            <div className="space-y-1.5">
              <Label htmlFor="lote">
                Lote{' '}
                <span className="text-ilunna-muted text-xs font-normal">(opcional - gerado automaticamente se vazio)</span>
              </Label>
              <Input
                id="lote"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="ex: LOT-20250610"
                className="border-ilunna-light"
              />
            </div>

            {/* Observacao */}
            <div className="space-y-1.5">
              <Label htmlFor="obs">Observacao <span className="text-ilunna-muted text-xs font-normal">(opcional)</span></Label>
              <Textarea
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Notas sobre esta producao..."
                rows={3}
                className="border-ilunna-light resize-none"
              />
            </div>

            {/* Verificar insumos */}
            <Button
              variant="outline"
              className="w-full border-ilunna-terracotta text-ilunna-terracotta hover:bg-ilunna-terracotta/5"
              disabled={!produtoId || verificando}
              onClick={handleVerificar}
            >
              {verificando ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verificar Insumos
            </Button>

            {/* Checklist de insumos */}
            {verificado && verificacao && (
              <div className="rounded-lg border border-ilunna-light overflow-hidden">
                {verificacao.itens.length === 0 ? (
                  <div className="p-4 text-center text-ilunna-muted text-sm">
                    Nenhuma ficha tecnica cadastrada para este produto.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-ilunna-cream border-b border-ilunna-light">
                      {verificacao.suficiente ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-ilunna-dark">
                        {verificacao.suficiente ? 'Insumos suficientes' : 'Insumos insuficientes'}
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead className="text-right">Necessario</TableHead>
                          <TableHead className="text-right">Disponivel</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificacao.itens.map((item) => (
                          <TableRow key={item.insumo_id}>
                            <TableCell className="font-medium text-sm">{item.insumo_nome}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatNumber(item.necessario, 2)} {item.unidade}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatNumber(item.disponivel, 2)} {item.unidade}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.suficiente ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-red-500 text-xs">falta {formatNumber(item.falta, 2)}</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </div>
            )}

            {/* Aviso quando insuficiente mas verificado */}
            {verificado && !verificacao?.suficiente && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Alguns insumos estao abaixo do necessario. A producao pode falhar ou ser parcial.</span>
              </div>
            )}

            {/* Botao registrar */}
            <Button
              className="w-full bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
              disabled={!produtoId || registrando || (verificado && verificacao?.itens.length === 0 ? false : !podeProduzir)}
              onClick={handleRegistrar}
            >
              {registrando ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Registrar Producao
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: Historico */}
        <Card className="border-ilunna-light">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-ilunna-dark text-lg">Historico de Producao</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistorico ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (producoes ?? []).length === 0 ? (
              <div className="text-center py-12 text-ilunna-muted text-sm">
                Nenhuma producao registrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(producoes ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDate(p.data)}</TableCell>
                        <TableCell className="font-medium text-sm">
                          {p.produtos?.nome ?? '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">{p.quantidade_produzida}</TableCell>
                        <TableCell className="text-sm">
                          <code className="text-xs bg-ilunna-light px-1.5 py-0.5 rounded">{p.lote ?? '-'}</code>
                        </TableCell>
                        <TableCell className="text-sm">{p.validade ? formatDate(p.validade) : '-'}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(p.custo_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
