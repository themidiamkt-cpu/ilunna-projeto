import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useEntradaInsumo } from '@/hooks/useInsumos'
import type { Insumo } from '@/types/database.types'
import { ArrowDown, Package } from 'lucide-react'

const schema = z.object({
  quantidade: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  custo_compra: z.coerce.number().min(0).optional(),
  volume_compra: z.coerce.number().min(0).optional(),
})

type FormValues = z.infer<typeof schema>

interface EntradaInsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumo?: Insumo | null
}

export function EntradaInsumoDialog({
  open,
  onOpenChange,
  insumo,
}: EntradaInsumoDialogProps) {
  const entradaInsumo = useEntradaInsumo()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantidade: 0,
      custo_compra: undefined,
      volume_compra: undefined,
    },
  })

  const quantidade = form.watch('quantidade') || 0
  const custoCompra = form.watch('custo_compra')
  const volumeCompra = form.watch('volume_compra')

  const novoEstoque = (insumo?.estoque_atual ?? 0) + quantidade
  const novoCustoUnitario =
    custoCompra && volumeCompra && volumeCompra > 0
      ? custoCompra / volumeCompra
      : insumo?.custo_unitario ?? 0

  useEffect(() => {
    if (open) {
      form.reset({
        quantidade: 0,
        custo_compra: undefined,
        volume_compra: undefined,
      })
    }
  }, [open, form])

  async function onSubmit(values: FormValues) {
    if (!insumo) return

    await entradaInsumo.mutateAsync({
      id: insumo.id,
      estoqueAtual: insumo.estoque_atual,
      entrada: {
        quantidade: values.quantidade,
        custo_compra: values.custo_compra,
        volume_compra: values.volume_compra,
      },
    })
    onOpenChange(false)
  }

  if (!insumo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-ilunna-dark flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-ilunna-terracotta" />
            Entrada de Estoque
          </DialogTitle>
          <DialogDescription className="text-ilunna-muted">
            {insumo.nome}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo atual */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-ilunna-light">
          <div>
            <p className="text-xs text-ilunna-muted">Estoque atual</p>
            <p className="text-sm font-semibold text-ilunna-dark">
              {formatNumber(insumo.estoque_atual)} {insumo.unidade}
            </p>
          </div>
          <div>
            <p className="text-xs text-ilunna-muted">Custo/un atual</p>
            <p className="text-sm font-semibold text-ilunna-dark">
              {formatCurrency(insumo.custo_unitario)}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quantidade ({insumo.unidade})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-ilunna-light pt-3">
              <p className="text-xs font-medium text-ilunna-muted mb-3 uppercase tracking-wide">
                Atualizar custo (opcional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="volume_compra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume de Compra</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={String(insumo.volume_compra)}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                        />
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
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={String(insumo.custo_compra)}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preview apos entrada */}
            <div className="rounded-lg border border-ilunna-terracotta/20 bg-ilunna-terracotta/5 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-3.5 h-3.5 text-ilunna-terracotta" />
                <p className="text-xs font-medium text-ilunna-terracotta uppercase tracking-wide">
                  Apos a entrada
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-ilunna-muted">Novo estoque</p>
                  <p className="text-sm font-semibold text-ilunna-dark">
                    {formatNumber(novoEstoque)} {insumo.unidade}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ilunna-muted">Novo custo/un</p>
                  <p className="text-sm font-semibold text-ilunna-dark">
                    {formatCurrency(novoCustoUnitario)}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={entradaInsumo.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={entradaInsumo.isPending}
                className="bg-ilunna-terracotta hover:bg-ilunna-terracotta/90 text-white"
              >
                {entradaInsumo.isPending ? 'Registrando...' : 'Registrar Entrada'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
