import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import type { InsumoComposicaoComComponente } from '@/types/database.types'

export type InsumoFormData = {
  nome: string
  tipo: 'liquido' | 'solido' | 'embalagem' | 'acessorio'
  unidade: 'ml' | 'gr' | 'un'
  volume_compra: number
  custo_compra: number
  estoque_atual: number
  estoque_minimo: number
  fornecedor?: string
  ativo: boolean
}

export type InsumoComposicaoItem = {
  componente_insumo_id: string
  quantidade: number
}

export function useInsumos() {
  return useQuery({
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumos')
        .select('*')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useInsumoComposicao(insumoId: string | null) {
  return useQuery({
    queryKey: ['insumo_composicao', insumoId],
    enabled: !!insumoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insumo_composicoes')
        .select('*, componente:insumos!insumo_composicoes_componente_insumo_id_fkey(id, nome, unidade, custo_unitario)')
        .eq('insumo_id', insumoId!)
        .order('created_at')
      if (error) throw error
      return data as unknown as InsumoComposicaoComComponente[]
    },
  })
}

export function useSaveInsumoComposicao() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      insumoId,
      volumeCompra,
      items,
    }: {
      insumoId: string
      volumeCompra: number
      items: InsumoComposicaoItem[]
    }) => {
      const { error: deleteError } = await supabase
        .from('insumo_composicoes')
        .delete()
        .eq('insumo_id', insumoId)
      if (deleteError) throw deleteError

      const validItems = items.filter((item) => item.componente_insumo_id && item.quantidade > 0)
      let custoCompra = 0

      if (validItems.length > 0) {
        const ids = validItems.map((item) => item.componente_insumo_id)
        const { data: componentes, error: componentesError } = await supabase
          .from('insumos')
          .select('id, custo_unitario')
          .in('id', ids)
        if (componentesError) throw componentesError

        const custos = new Map((componentes ?? []).map((item) => [item.id, item.custo_unitario]))
        const rows = validItems.map((item) => {
          const custoLinha = item.quantidade * (custos.get(item.componente_insumo_id) ?? 0)
          custoCompra += custoLinha
          return {
            insumo_id: insumoId,
            componente_insumo_id: item.componente_insumo_id,
            quantidade: item.quantidade,
            custo_linha: custoLinha,
          }
        })

        const { error: insertError } = await supabase
          .from('insumo_composicoes')
          .insert(rows)
        if (insertError) throw insertError
      }

      const custoUnitario = volumeCompra > 0 ? custoCompra / volumeCompra : 0
      const { error: updateError } = await supabase
        .from('insumos')
        .update({
          custo_compra: custoCompra,
          custo_unitario: custoUnitario,
          updated_at: new Date().toISOString(),
        })
        .eq('id', insumoId)
      if (updateError) throw updateError

      return { custoCompra, custoUnitario }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insumo_composicao', variables.insumoId] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: 'Receita salva',
        description: 'Custo do insumo atualizado pela composição.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar receita',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useCreateInsumo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (formData: InsumoFormData) => {
      const custo_unitario =
        formData.volume_compra > 0
          ? formData.custo_compra / formData.volume_compra
          : 0

      const { data, error } = await supabase
        .from('insumos')
        .insert({
          ...formData,
          custo_unitario,
          fornecedor: formData.fornecedor || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: 'Insumo criado',
        description: 'Insumo cadastrado com sucesso.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar insumo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateInsumo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: InsumoFormData }) => {
      const custo_unitario =
        formData.volume_compra > 0
          ? formData.custo_compra / formData.volume_compra
          : 0

      const { data, error } = await supabase
        .from('insumos')
        .update({
          ...formData,
          custo_unitario,
          fornecedor: formData.fornecedor || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: 'Insumo atualizado',
        description: 'Alterações salvas com sucesso.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar insumo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteInsumo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insumos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: 'Insumo removido',
        description: 'O insumo foi excluído.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover insumo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useToggleAtivoInsumo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('insumos')
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: variables.ativo ? 'Insumo ativado' : 'Insumo desativado',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export type EntradaInsumoData = {
  quantidade: number
  custo_compra?: number
  volume_compra?: number
}

export function useEntradaInsumo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      estoqueAtual,
      entrada,
    }: {
      id: string
      estoqueAtual: number
      entrada: EntradaInsumoData
    }) => {
      const baseUpdates = {
        estoque_atual: estoqueAtual + entrada.quantidade,
        updated_at: new Date().toISOString(),
      }
      const extraUpdates = (
        entrada.custo_compra !== undefined &&
        entrada.volume_compra !== undefined &&
        entrada.volume_compra > 0
      ) ? {
        custo_compra: entrada.custo_compra,
        volume_compra: entrada.volume_compra,
        custo_unitario: entrada.custo_compra / entrada.volume_compra,
      } : {}

      const { data, error } = await supabase
        .from('insumos')
        .update({ ...baseUpdates, ...extraUpdates })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await supabase.from('movimentacoes_estoque').insert({
        tipo: 'entrada_insumo',
        referencia_tipo: 'insumo',
        referencia_id: id,
        quantidade: entrada.quantidade,
        custo_unitario:
          entrada.custo_compra && entrada.volume_compra && entrada.volume_compra > 0
            ? entrada.custo_compra / entrada.volume_compra
            : null,
        motivo: 'Entrada de estoque (compra)',
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      toast({
        title: 'Entrada registrada',
        description: 'Estoque atualizado com sucesso.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar entrada',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
