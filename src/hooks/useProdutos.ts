import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export const PRODUCT_MARKUP = 3

export type ProdutoFormData = {
  nome: string
  sku?: string
  tipo?: 'simples' | 'producao' | 'kit'
  categoria_id?: string
  preco_venda: number
  estoque_atual: number
  estoque_minimo: number
  validade_dias?: number
  ativo: boolean
}

export type FichaTecnicaItem = {
  insumo_id: string
  quantidade: number
}

export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(id, nome, cor)')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useProduto(id: string | null) {
  return useQuery({
    queryKey: ['produto', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(id, nome, cor)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateProduto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (formData: ProdutoFormData) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          nome: formData.nome,
          sku: formData.sku,
          tipo: formData.tipo ?? 'simples',
          categoria_id: formData.categoria_id || null,
          preco_venda: formData.preco_venda,
          estoque_atual: formData.estoque_atual,
          estoque_minimo: formData.estoque_minimo,
          validade_dias: formData.validade_dias || null,
          ativo: formData.ativo,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: 'Produto criado',
        description: 'Produto cadastrado com sucesso.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateProduto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ProdutoFormData }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({
          nome: formData.nome,
          sku: formData.sku,
          tipo: formData.tipo,
          categoria_id: formData.categoria_id || null,
          preco_venda: formData.preco_venda,
          estoque_atual: formData.estoque_atual,
          estoque_minimo: formData.estoque_minimo,
          validade_dias: formData.validade_dias || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['produto', variables.id] })
      toast({
        title: 'Produto atualizado',
        description: 'Alterações salvas com sucesso.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useApplyProductMarkup() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const { data: produtos, error: selectError } = await supabase
        .from('produtos')
        .select('id, custo_producao')
        .gt('custo_producao', 0)

      if (selectError) throw selectError

      const updates = (produtos ?? []).map((produto) =>
        supabase
          .from('produtos')
          .update({
            preco_venda: Number((produto.custo_producao * PRODUCT_MARKUP).toFixed(2)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', produto.id)
      )

      const results = await Promise.all(updates)
      const error = results.find((result) => result.error)?.error
      if (error) throw error

      return produtos?.length ?? 0
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: 'Markup aplicado',
        description: `${count} produto${count === 1 ? '' : 's'} atualizado${count === 1 ? '' : 's'} com markup ${PRODUCT_MARKUP}.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao aplicar markup',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useFichaTecnica(produtoId: string | null) {
  return useQuery({
    queryKey: ['ficha_tecnica', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_tecnicas')
        .select('*, insumos(id, nome, unidade, custo_unitario)')
        .eq('produto_id', produtoId!)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useSaveFichaTecnica() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      produtoId,
      items,
    }: {
      produtoId: string
      items: FichaTecnicaItem[]
    }) => {
      // Delete all existing lines for this product
      const { error: deleteError } = await supabase
        .from('fichas_tecnicas')
        .delete()
        .eq('produto_id', produtoId)

      if (deleteError) throw deleteError

      if (items.length === 0) return []

      // Fetch insumo custo_unitario for each item
      const insumoIds = items.map((i) => i.insumo_id)
      const { data: insumos, error: insumoError } = await supabase
        .from('insumos')
        .select('id, custo_unitario')
        .in('id', insumoIds)

      if (insumoError) throw insumoError

      const custoMap: Record<string, number> = {}
      insumos?.forEach((ins) => {
        custoMap[ins.id] = ins.custo_unitario
      })

      const rows = items.map((item) => ({
        produto_id: produtoId,
        insumo_id: item.insumo_id,
        quantidade: item.quantidade,
        custo_linha: item.quantidade * (custoMap[item.insumo_id] ?? 0),
      }))

      const { data, error: insertError } = await supabase
        .from('fichas_tecnicas')
        .insert(rows)
        .select()

      if (insertError) throw insertError

      // Recalculate produto custo_producao via RPC or direct update
      const custoProducao = rows.reduce((sum, r) => sum + r.custo_linha, 0)
      const { data: produto } = await supabase
        .from('produtos')
        .select('preco_venda')
        .eq('id', produtoId)
        .single()

      const precoVenda = produto?.preco_venda ?? 0
      const margemValor = precoVenda - custoProducao
      const margemPercentual = precoVenda > 0 ? (margemValor / precoVenda) * 100 : 0

      await supabase
        .from('produtos')
        .update({
          custo_producao: custoProducao,
          preco_venda: custoProducao * PRODUCT_MARKUP,
          updated_at: new Date().toISOString(),
        })
        .eq('id', produtoId)

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ficha_tecnica', variables.produtoId] })
      queryClient.invalidateQueries({ queryKey: ['produto', variables.produtoId] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: 'Ficha tecnica salva',
        description: 'Custo de producao atualizado.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar ficha tecnica',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useProducoesRecentes(produtoId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['producoes_recentes', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producoes')
        .select('*')
        .eq('produto_id', produtoId!)
        .order('data', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

export function useMovimentacoesRecentes(produtoId: string | null, limit = 10) {
  return useQuery({
    queryKey: ['movimentacoes_recentes', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .eq('referencia_id', produtoId!)
        .eq('referencia_tipo', 'produto')
        .order('data', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}
