import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInsumoComposicao, useInsumos, useSaveInsumoComposicao } from '@/hooks/useInsumos'
import type { Insumo } from '@/types/database.types'
import { formatCurrency, formatNumber } from '@/lib/utils'

type ReceitaRow = {
  componente_insumo_id: string
  quantidade: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  insumo: Insumo
}

const NONE = '__none__'

export function InsumoReceitaEditor({ open, onOpenChange, insumo }: Props) {
  const { data: composicao = [], isLoading } = useInsumoComposicao(insumo.id)
  const { data: insumos = [] } = useInsumos()
  const saveComposicao = useSaveInsumoComposicao()
  const [rows, setRows] = useState<ReceitaRow[]>([])

  useEffect(() => {
    if (!open) return
    setRows(
      composicao.map((item) => ({
        componente_insumo_id: item.componente_insumo_id,
        quantidade: item.quantidade,
      }))
    )
  }, [composicao, open])

  const componentesDisponiveis = insumos.filter((item) => item.id !== insumo.id && item.ativo)

  const custoTotal = rows.reduce((total, row) => {
    const componente = componentesDisponiveis.find((item) => item.id === row.componente_insumo_id)
    return total + row.quantidade * (componente?.custo_unitario ?? 0)
  }, 0)

  const custoUnitario = insumo.volume_compra > 0 ? custoTotal / insumo.volume_compra : 0

  function addRow() {
    setRows((current) => [...current, { componente_insumo_id: '', quantidade: 1 }])
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, idx) => idx !== index))
  }

  function updateRow(index: number, field: keyof ReceitaRow, value: string | number) {
    setRows((current) => current.map((row, idx) => idx === index ? { ...row, [field]: value } : row))
  }

  async function handleSave() {
    await saveComposicao.mutateAsync({
      insumoId: insumo.id,
      volumeCompra: insumo.volume_compra,
      items: rows,
    })
    onOpenChange(false)
  }

  const isPending = saveComposicao.isPending || isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-ilunna-cream border-ilunna-light">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-ilunna-dark">
            Receita do Insumo: {insumo.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white border border-ilunna-light rounded-lg p-3">
            <p className="text-xs text-ilunna-muted">Rendimento</p>
            <p className="font-semibold text-ilunna-dark">
              {formatNumber(insumo.volume_compra, 2)} {insumo.unidade}
            </p>
          </div>
          <div className="bg-white border border-ilunna-light rounded-lg p-3">
            <p className="text-xs text-ilunna-muted">Custo total</p>
            <p className="font-semibold text-ilunna-dark">{formatCurrency(custoTotal)}</p>
          </div>
          <div className="bg-white border border-ilunna-light rounded-lg p-3">
            <p className="text-xs text-ilunna-muted">Custo/{insumo.unidade}</p>
            <p className="font-semibold text-ilunna-terracotta">{formatCurrency(custoUnitario)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ilunna-brown">Componentes</p>
            <Button type="button" size="sm" variant="outline" onClick={addRow} className="h-8 gap-1 border-ilunna-light">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="text-xs text-ilunna-muted text-center py-5 border border-dashed border-ilunna-light rounded-lg">
              Nenhum componente cadastrado para este insumo.
            </p>
          ) : rows.map((row, index) => {
            const componente = componentesDisponiveis.find((item) => item.id === row.componente_insumo_id)
            const custoLinha = row.quantidade * (componente?.custo_unitario ?? 0)

            return (
              <div key={index} className="grid grid-cols-[1fr_110px_90px_32px] gap-2 items-center">
                <Select
                  value={row.componente_insumo_id || NONE}
                  onValueChange={(value) => updateRow(index, 'componente_insumo_id', value === NONE ? '' : value)}
                >
                  <SelectTrigger className="border-ilunna-light bg-white text-sm">
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
                  onChange={(event) => updateRow(index, 'quantidade', parseFloat(event.target.value) || 0)}
                  className="border-ilunna-light bg-white text-sm"
                />
                <span className="text-xs text-ilunna-muted text-right">{formatCurrency(custoLinha)}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-ilunna-muted hover:text-red-500"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1 border-ilunna-light" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-ilunna-terracotta hover:bg-ilunna-brown text-white"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar receita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
