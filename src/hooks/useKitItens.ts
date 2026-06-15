import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PRODUCT_MARKUP } from '@/hooks/useProdutos'
import type { KitItemComProduto } from '@/types/database.types'

export type { KitItemComProduto }

export function useKitItens(kitId: string | null) {
  return useQuery({
    queryKey: ['kit_itens', kitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kit_itens')
        .select('*, produtos(id, nome, sku, custo_producao)')
        .eq('kit_id', kitId!)
        .order('created_at')
      if (error) throw error
      return data as unknown as KitItemComProduto[]
    },
    enabled: !!kitId,
  })
}

export function useSaveKitItens() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      kitId,
      itens,
    }: {
      kitId: string
      itens: { produto_id: string; quantidade: number; custo_unitario: number }[]
    }) => {
      // Delete existing items then re-insert
      const { error: delErr } = await supabase
        .from('kit_itens')
        .delete()
        .eq('kit_id', kitId)
      if (delErr) throw delErr

      if (itens.length === 0) {
        const { error: updateErr } = await supabase
          .from('produtos')
          .update({
            custo_producao: 0,
            preco_venda: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kitId)
        if (updateErr) throw updateErr
        return []
      }

      const { data, error } = await supabase
        .from('kit_itens')
        .insert(itens.map(i => ({ kit_id: kitId, produto_id: i.produto_id, quantidade: i.quantidade, custo_unitario: i.custo_unitario })))
        .select()
      if (error) throw error

      const custoProducao = itens.reduce((sum, item) => sum + item.quantidade * item.custo_unitario, 0)
      const { error: updateErr } = await supabase
        .from('produtos')
        .update({
          custo_producao: custoProducao,
          preco_venda: custoProducao * PRODUCT_MARKUP,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kitId)
      if (updateErr) throw updateErr

      return data
    },
    onSuccess: (_, { kitId }) => {
      qc.invalidateQueries({ queryKey: ['kit_itens', kitId] })
      qc.invalidateQueries({ queryKey: ['produtos'] })
      qc.invalidateQueries({ queryKey: ['produto', kitId] })
    },
  })
}
