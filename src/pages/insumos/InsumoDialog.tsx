import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useCreateInsumo,
  useInsumoComposicao,
  useInsumos,
  useSaveInsumoComposicao,
  useUpdateInsumo,
  type InsumoFormData,
} from '@/hooks/useInsumos'
import type { Insumo } from '@/types/database.types'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  tipo: z.enum(['liquido', 'solido', 'embalagem', 'acessorio']),
  unidade: z.enum(['ml', 'gr', 'un']),
  volume_compra: z.coerce.number().positive('Deve ser maior que zero'),
  custo_compra: z.coerce.number().min(0, 'Nao pode ser negativo'),
  estoque_atual: z.coerce.number().min(0),
  estoque_minimo: z.coerce.number().min(0),
  fornecedor: z.string().optional(),
  ativo: z.boolean(),
})

type FormValues = z.infer<typeof schema>
type ComposicaoRow = { componente_insumo_id: string; quantidade: number }

interface InsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumo?: Insumo | null
}

const tipoLabels: Record<string, string> = {
  liquido: 'Liquido',
  solido: 'Solido',
  embalagem: 'Embalagem',
  acessorio: 'Acessorio',
}

const unidadeLabels: Record<string, string> = {
  ml: 'ml (mililitros)',
  gr: 'gr (gramas)',
  un: 'un (unidade)',
}

const NONE = '__none__'

export function InsumoDialog({ open, onOpenChange, insumo }: InsumoDialogProps) {
  const createInsumo = useCreateInsumo()
  const updateInsumo = useUpdateInsumo()
  const saveComposicao = useSaveInsumoComposicao()
  const { data: insumos = [] } = useInsumos()
  const { data: composicao = [] } = useInsumoComposicao(insumo?.id ?? null)
  const isEditing = !!insumo
  const [composicaoRows, setComposicaoRows] = useState<ComposicaoRow[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      tipo: 'liquido',
      unidade: 'ml',
      volume_compra: 0,
      custo_compra: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      fornecedor: '',
      ativo: true,
    },
  })

  const volumeCompra = form.watch('volume_compra')
  const custoCompra = form.watch('custo_compra')
  const componentesDisponiveis = insumos.filter((item) => item.id !== insumo?.id && item.ativo)
  const custoComposicao = composicaoRows.reduce((total, row) => {
    const componente = componentesDisponiveis.find((item) => item.id === row.componente_insumo_id)
    return total + row.quantidade * (componente?.custo_unitario ?? 0)
  }, 0)
  const custoBase = composicaoRows.length > 0 ? custoComposicao : custoCompra
  const custoUnitario = volumeCompra > 0 ? custoBase / volumeCompra : 0

  useEffect(() => {
    if (open) {
      if (insumo) {
        form.reset({
          nome: insumo.nome,
          tipo: insumo.tipo as InsumoFormData['tipo'],
          unidade: insumo.unidade,
          volume_compra: insumo.volume_compra,
          custo_compra: insumo.custo_compra,
          estoque_atual: insumo.estoque_atual,
          estoque_minimo: insumo.estoque_minimo,
          fornecedor: insumo.fornecedor ?? '',
          ativo: insumo.ativo,
        })
      } else {
        form.reset({
          nome: '',
          tipo: 'liquido',
          unidade: 'ml',
          volume_compra: 0,
          custo_compra: 0,
          estoque_atual: 0,
          estoque_minimo: 0,
          fornecedor: '',
          ativo: true,
        })
      }
    }
  }, [open, insumo, form])

  useEffect(() => {
    if (!open) return
    if (insumo) {
      setComposicaoRows(
        composicao.map((item) => ({
          componente_insumo_id: item.componente_insumo_id,
          quantidade: item.quantidade,
        }))
      )
    } else {
      setComposicaoRows([])
    }
  }, [composicao, insumo, open])

  function addComponente() {
    setComposicaoRows((rows) => [...rows, { componente_insumo_id: '', quantidade: 1 }])
  }

  function removeComponente(index: number) {
    setComposicaoRows((rows) => rows.filter((_, idx) => idx !== index))
  }

  function updateComponente(index: number, field: keyof ComposicaoRow, value: string | number) {
    setComposicaoRows((rows) => rows.map((row, idx) => idx === index ? { ...row, [field]: value } : row))
  }

  async function onSubmit(values: FormValues) {
    const composicaoValida = composicaoRows.filter((row) => row.componente_insumo_id && row.quantidade > 0)
    const custoCompraFinal = composicaoValida.length > 0 ? custoComposicao : values.custo_compra
    const data: InsumoFormData = {
      ...values,
      custo_compra: custoCompraFinal,
      fornecedor: values.fornecedor || undefined,
    }

    let savedId = insumo?.id
    if (isEditing && insumo) {
      await updateInsumo.mutateAsync({ id: insumo.id, formData: data })
    } else {
      const novo = await createInsumo.mutateAsync(data)
      savedId = novo.id
    }

    if (savedId && (composicaoRows.length > 0 || composicao.length > 0)) {
      await saveComposicao.mutateAsync({
        insumoId: savedId,
        volumeCompra: values.volume_compra,
        items: composicaoValida,
      })
    }
    onOpenChange(false)
  }

  const isPending = createInsumo.isPending || updateInsumo.isPending || saveComposicao.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-ilunna-dark">
            {isEditing ? 'Editar Insumo' : 'Novo Insumo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Oleo essencial lavanda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo + Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(tipoLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(unidadeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Volume + Custo */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="volume_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume de Compra</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custo_compra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo de Compra (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custo unitario calculado */}
            <div className="rounded-lg bg-ilunna-light px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-ilunna-muted">Custo por unidade</span>
              <span className="text-sm font-semibold text-ilunna-terracotta">
                {formatCurrency(custoUnitario)}
              </span>
            </div>

            {/* Composicao */}
            <div className="rounded-lg border border-ilunna-light p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ilunna-dark">Composição do insumo</p>
                  <p className="text-xs text-ilunna-muted">Use quando este insumo é feito com outros insumos.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={addComponente}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </div>

              {composicaoRows.length > 0 && (
                <div className="rounded-md bg-ilunna-light/70 px-3 py-2 flex items-center justify-between text-sm">
                  <span className="text-ilunna-muted">Custo pela composição</span>
                  <span className="font-semibold text-ilunna-terracotta">{formatCurrency(custoComposicao)}</span>
                </div>
              )}

              {composicaoRows.map((row, index) => {
                const componente = componentesDisponiveis.find((item) => item.id === row.componente_insumo_id)
                const custoLinha = row.quantidade * (componente?.custo_unitario ?? 0)

                return (
                  <div key={index} className="grid grid-cols-[1fr_100px_86px_32px] gap-2 items-center">
                    <Select
                      value={row.componente_insumo_id || NONE}
                      onValueChange={(value) => updateComponente(index, 'componente_insumo_id', value === NONE ? '' : value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecionar insumo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Selecionar...</SelectItem>
                        {componentesDisponiveis.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nome} ({item.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={row.quantidade}
                      onChange={(event) => updateComponente(index, 'quantidade', parseFloat(event.target.value) || 0)}
                      className="text-sm"
                    />
                    <span className="text-xs text-ilunna-muted text-right">{formatCurrency(custoLinha)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-ilunna-muted hover:text-red-500"
                      onClick={() => removeComponente(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Estoque */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="estoque_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Atual</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Minimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fornecedor */}
            <FormField
              control={form.control}
              name="fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ativo */}
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="ativo-switch"
                      />
                    </FormControl>
                    <Label htmlFor="ativo-switch" className="cursor-pointer">
                      Insumo ativo
                    </Label>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-ilunna-terracotta hover:bg-ilunna-terracotta/90 text-white"
              >
                {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
