import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Package, FlaskConical, Layers } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRODUCT_MARKUP, useProduto, useProdutos, useCreateProduto, useUpdateProduto, useFichaTecnica, useSaveFichaTecnica } from '@/hooks/useProdutos'
import { useCategorias } from '@/hooks/useCategorias'
import { useInsumos } from '@/hooks/useInsumos'
import { useKitItens, useSaveKitItens } from '@/hooks/useKitItens'
import { formatCurrency, formatPercent, toSKU } from '@/lib/utils'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  sku: z.string().optional(),
  tipo: z.enum(['simples', 'producao', 'kit']),
  categoria_id: z.string().optional(),
  preco_venda: z.coerce.number().min(0, 'Preço inválido'),
  estoque_atual: z.coerce.number().min(0),
  estoque_minimo: z.coerce.number().min(0),
  validade_dias: z.coerce.number().optional(),
  ativo: z.boolean(),
})
type FormData = z.infer<typeof schema>

type InsumoRow = { insumo_id: string; quantidade: number }
type KitRow   = { produto_id: string; quantidade: number; custo_unitario: number }

interface Props {
  open: boolean
  onClose: () => void
  editId: string | null
}

const NONE = '__none__'

export function ProdutoDialog({ open, onClose, editId }: Props) {
  const { data: produto }    = useProduto(editId)
  const { data: categorias = [] } = useCategorias()
  const { data: insumosList = [] } = useInsumos()
  const { data: produtosList = [] } = useProdutos()
  const { data: fichaExistente = [] } = useFichaTecnica(editId)
  const { data: kitExistente = [] }   = useKitItens(editId)

  const createProduto   = useCreateProduto()
  const updateProduto   = useUpdateProduto()
  const saveFicha       = useSaveFichaTecnica()
  const saveKit         = useSaveKitItens()

  // Inline editors state
  const [insumoRows, setInsumoRows] = useState<InsumoRow[]>([])
  const [kitRows, setKitRows]       = useState<KitRow[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '', sku: '', tipo: 'simples', categoria_id: NONE,
      preco_venda: 0, estoque_atual: 0, estoque_minimo: 0,
      validade_dias: undefined, ativo: true,
    },
  })

  const tipoWatch = form.watch('tipo')

  // Load existing data when editing
  useEffect(() => {
    if (produto && editId) {
      form.reset({
        nome: produto.nome,
        sku: produto.sku ?? '',
        tipo: (produto.tipo as 'simples' | 'producao' | 'kit') ?? 'simples',
        categoria_id: produto.categoria_id ?? NONE,
        preco_venda: produto.preco_venda,
        estoque_atual: produto.estoque_atual,
        estoque_minimo: produto.estoque_minimo,
        validade_dias: produto.validade_dias ?? undefined,
        ativo: produto.ativo,
      })
    } else if (!editId) {
      form.reset({
        nome: '', sku: '', tipo: 'simples', categoria_id: NONE,
        preco_venda: 0, estoque_atual: 0, estoque_minimo: 0,
        ativo: true,
      })
      setInsumoRows([])
      setKitRows([])
    }
  }, [produto, editId, open])

  // Load ficha técnica rows when editing a producao product or kit
  useEffect(() => {
    if (editId) {
      setInsumoRows(fichaExistente.map(f => ({
        insumo_id: f.insumo_id,
        quantidade: f.quantidade,
      })))
    }
  }, [fichaExistente, editId])

  // Load kit rows when editing a kit product
  useEffect(() => {
    if (editId) {
      setKitRows(kitExistente.map(k => ({
        produto_id: k.produto_id,
        quantidade: k.quantidade,
        custo_unitario: k.custo_unitario,
      })))
    }
  }, [kitExistente, editId])

  // Auto-generate SKU from name (new products only)
  const nomeWatch = form.watch('nome')
  useEffect(() => {
    if (!editId && nomeWatch) {
      form.setValue('sku', toSKU(nomeWatch))
    }
  }, [nomeWatch, editId])

  // Live cost calculation
  const custoFicha = insumoRows.reduce((sum, row) => {
    const ins = insumosList.find(i => i.id === row.insumo_id)
    return sum + (ins ? ins.custo_unitario * row.quantidade : 0)
  }, 0)

  const custoKit = kitRows.reduce((sum, row) => {
    const prod = produtosList.find(p => p.id === row.produto_id)
    const custo = prod?.custo_producao ?? 0
    return sum + custo * row.quantidade
  }, 0)

  const custoTotal = tipoWatch === 'producao' ? custoFicha
                   : tipoWatch === 'kit'      ? custoKit + custoFicha
                   : produto?.custo_producao ?? 0

  const precoVenda = form.watch('preco_venda') ?? 0
  const margem     = precoVenda > 0 ? ((precoVenda - custoTotal) / precoVenda) * 100 : 0

  useEffect(() => {
    if (custoTotal <= 0) return
    form.setValue('preco_venda', Number((custoTotal * PRODUCT_MARKUP).toFixed(2)))
  }, [custoTotal, form])

  // ---- Insumo row helpers ----
  function addInsumoRow() {
    setInsumoRows(rows => [...rows, { insumo_id: '', quantidade: 1 }])
  }
  function removeInsumoRow(idx: number) {
    setInsumoRows(rows => rows.filter((_, i) => i !== idx))
  }
  function updateInsumoRow(idx: number, field: keyof InsumoRow, value: string | number) {
    setInsumoRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  // ---- Kit row helpers ----
  function addKitRow() {
    setKitRows(rows => [...rows, { produto_id: '', quantidade: 1, custo_unitario: 0 }])
  }
  function removeKitRow(idx: number) {
    setKitRows(rows => rows.filter((_, i) => i !== idx))
  }
  function updateKitRow(idx: number, field: keyof KitRow, value: string | number) {
    setKitRows(rows => rows.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: value }
      if (field === 'produto_id') {
        const prod = produtosList.find(p => p.id === value)
        updated.custo_unitario = prod?.custo_producao ?? 0
      }
      return updated
    }))
  }

  async function onSubmit(data: FormData) {
    const payload = {
      nome: data.nome,
      sku: data.sku || undefined,
      tipo: data.tipo,
      categoria_id: (data.categoria_id && data.categoria_id !== NONE) ? data.categoria_id : undefined,
      preco_venda: data.preco_venda,
      estoque_atual: data.estoque_atual,
      estoque_minimo: data.estoque_minimo,
      validade_dias: data.validade_dias || undefined,
      ativo: data.ativo,
    }

    try {
      let savedId: string

      if (editId) {
        await updateProduto.mutateAsync({ id: editId, formData: payload as any })
        savedId = editId
      } else {
        const novo = await createProduto.mutateAsync(payload as any)
        savedId = novo.id
      }

      // Save inline composition depending on tipo
      if (data.tipo === 'producao') {
        const validRows = insumoRows.filter(r => r.insumo_id)
        await saveFicha.mutateAsync({ produtoId: savedId, items: validRows })
      } else if (data.tipo === 'kit') {
        const validInsumos = insumoRows.filter(r => r.insumo_id)
        await saveFicha.mutateAsync({ produtoId: savedId, items: validInsumos })

        const validRows = kitRows.filter(r => r.produto_id)
        await saveKit.mutateAsync({
          kitId: savedId,
          itens: validRows.map(r => ({
            produto_id: r.produto_id,
            quantidade: r.quantidade,
            custo_unitario: produtosList.find(p => p.id === r.produto_id)?.custo_producao ?? r.custo_unitario,
          })),
          extraCusto: custoFicha,
        })
      }

      onClose()
    } catch {
      // errors handled by mutation hooks via toast
    }
  }

  const isPending = createProduto.isPending || updateProduto.isPending
    || saveFicha.isPending || saveKit.isPending

  // Produtos elegíveis para kit (exclude self and non-simples/producao)
  const produtosParaKit = produtosList.filter(p => p.id !== editId)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-ilunna-cream border-ilunna-light">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ilunna-dark">
            {editId ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Tipo selector */}
            <FormField control={form.control} name="tipo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ilunna-brown">Tipo de Produto</FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'simples',  label: 'Simples',         icon: Package,      desc: 'Sem composição' },
                    { value: 'producao', label: 'Com Insumos',     icon: FlaskConical, desc: 'Ficha técnica' },
                    { value: 'kit',      label: 'Kit',             icon: Layers,       desc: 'Produtos e insumos' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
                        ${field.value === opt.value
                          ? 'border-ilunna-terracotta bg-ilunna-terracotta/10 text-ilunna-terracotta'
                          : 'border-ilunna-light bg-white text-ilunna-muted hover:border-ilunna-brown/40'}`}
                    >
                      <opt.icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </FormItem>
            )} />

            {/* Nome */}
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ilunna-brown">Nome</FormLabel>
                <FormControl><Input {...field} className="border-ilunna-light" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-ilunna-brown">SKU</FormLabel>
                  <FormControl><Input {...field} placeholder="Gerado automaticamente" className="border-ilunna-light text-sm" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="categoria_id" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-ilunna-brown">Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="border-ilunna-light"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem categoria</SelectItem>
                      {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="preco_venda" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ilunna-brown">Preço de Venda (R$) - markup {PRODUCT_MARKUP}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    readOnly={custoTotal > 0}
                    className={`border-ilunna-light ${custoTotal > 0 ? 'bg-ilunna-light/50' : ''}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Ficha Técnica (tipo = producao) ── */}
            {tipoWatch === 'producao' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-ilunna-brown">Insumos</FormLabel>
                  <Button type="button" size="sm" variant="outline" onClick={addInsumoRow}
                    className="h-7 text-xs gap-1 border-ilunna-light">
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                </div>
                {insumoRows.length === 0 && (
                  <p className="text-xs text-ilunna-muted text-center py-3 border border-dashed border-ilunna-light rounded-xl">
                    Nenhum insumo adicionado
                  </p>
                )}
                {insumoRows.map((row, idx) => {
                  const ins = insumosList.find(i => i.id === row.insumo_id)
                  const custoLinha = ins ? ins.custo_unitario * row.quantidade : 0
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_100px_80px_28px] gap-2 items-center">
                      <Select value={row.insumo_id || NONE} onValueChange={v => updateInsumoRow(idx, 'insumo_id', v === NONE ? '' : v)}>
                        <SelectTrigger className="border-ilunna-light text-sm h-8">
                          <SelectValue placeholder="Selecionar insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Selecionar...</SelectItem>
                          {insumosList.map(i => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.nome} ({i.unidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number" step="0.001" min="0"
                        value={row.quantidade}
                        onChange={e => updateInsumoRow(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                        className="border-ilunna-light text-sm h-8"
                        placeholder="Qtd"
                      />
                      <span className="text-xs text-ilunna-muted text-right">{formatCurrency(custoLinha)}</span>
                      <Button type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-ilunna-muted hover:text-red-500"
                        onClick={() => removeInsumoRow(idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Composição do Kit (tipo = kit) ── */}
            {tipoWatch === 'kit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-ilunna-brown">Produtos do Kit</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={addKitRow}
                      className="h-7 text-xs gap-1 border-ilunna-light">
                      <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                  </div>
                  {kitRows.length === 0 && (
                    <p className="text-xs text-ilunna-muted text-center py-3 border border-dashed border-ilunna-light rounded-xl">
                      Nenhum produto adicionado
                    </p>
                  )}
                  {kitRows.map((row, idx) => {
                    const prod = produtosList.find(p => p.id === row.produto_id)
                    const custoLinha = (prod?.custo_producao ?? 0) * row.quantidade
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_100px_80px_28px] gap-2 items-center">
                        <Select value={row.produto_id || NONE} onValueChange={v => updateKitRow(idx, 'produto_id', v === NONE ? '' : v)}>
                          <SelectTrigger className="border-ilunna-light text-sm h-8">
                            <SelectValue placeholder="Selecionar produto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Selecionar...</SelectItem>
                            {produtosParaKit.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome}{p.sku ? ` (${p.sku})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number" step="1" min="1"
                          value={row.quantidade}
                          onChange={e => updateKitRow(idx, 'quantidade', parseInt(e.target.value) || 1)}
                          className="border-ilunna-light text-sm h-8"
                          placeholder="Qtd"
                        />
                        <span className="text-xs text-ilunna-muted text-right">{formatCurrency(custoLinha)}</span>
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-ilunna-muted hover:text-red-500"
                          onClick={() => removeKitRow(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2 border-t border-ilunna-light pt-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-ilunna-brown">Insumos do Kit</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={addInsumoRow}
                      className="h-7 text-xs gap-1 border-ilunna-light">
                      <Plus className="w-3 h-3" /> Adicionar
                    </Button>
                  </div>
                  {insumoRows.length === 0 && (
                    <p className="text-xs text-ilunna-muted text-center py-3 border border-dashed border-ilunna-light rounded-xl">
                      Nenhum insumo adicionado
                    </p>
                  )}
                  {insumoRows.map((row, idx) => {
                    const ins = insumosList.find(i => i.id === row.insumo_id)
                    const custoLinha = ins ? ins.custo_unitario * row.quantidade : 0
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_100px_80px_28px] gap-2 items-center">
                        <Select value={row.insumo_id || NONE} onValueChange={v => updateInsumoRow(idx, 'insumo_id', v === NONE ? '' : v)}>
                          <SelectTrigger className="border-ilunna-light text-sm h-8">
                            <SelectValue placeholder="Selecionar insumo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Selecionar...</SelectItem>
                            {insumosList.map(i => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.nome} ({i.unidade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number" step="0.001" min="0"
                          value={row.quantidade}
                          onChange={e => updateInsumoRow(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="border-ilunna-light text-sm h-8"
                          placeholder="Qtd"
                        />
                        <span className="text-xs text-ilunna-muted text-right">{formatCurrency(custoLinha)}</span>
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-ilunna-muted hover:text-red-500"
                          onClick={() => removeInsumoRow(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Live cost panel */}
            {(tipoWatch !== 'simples' || editId) && (
              <div className="bg-ilunna-light/60 rounded-xl p-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ilunna-muted">Custo Total</p>
                  <p className="font-semibold text-ilunna-dark">{formatCurrency(custoTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-ilunna-muted">Preço de Venda</p>
                  <p className="font-semibold text-ilunna-dark">{formatCurrency(precoVenda)}</p>
                </div>
                <div>
                  <p className="text-xs text-ilunna-muted">Margem</p>
                  <p className={`font-semibold ${margem >= 50 ? 'text-green-600' : margem >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                    {formatPercent(margem)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="estoque_atual" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-ilunna-brown">Estoque Atual</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" className="border-ilunna-light" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="estoque_minimo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-ilunna-brown">Estoque Mínimo</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" className="border-ilunna-light" /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="validade_dias" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ilunna-brown">Validade (dias, opcional)</FormLabel>
                <FormControl><Input {...field} type="number" min="1" placeholder="Ex: 365" className="border-ilunna-light" /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="ativo" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-ilunna-brown !mt-0">Produto ativo</FormLabel>
              </FormItem>
            )} />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-ilunna-light" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
