import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ProducaoComProduto } from '@/types/database.types'

// -------------------------------------------------------
// useProducoes: lista as 20 produções mais recentes
// -------------------------------------------------------
export function useProducoes() {
  return useQuery({
    queryKey: ['producoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producoes')
        .select('*, produtos(id, nome, sku)')
        .order('data', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as unknown as ProducaoComProduto[]
    },
  })
}

// -------------------------------------------------------
// useRegistrarProducao: chama RPC registrar_producao
// -------------------------------------------------------
export function useRegistrarProducao() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      produto_id: string
      quantidade: number
      lote?: string
      observacao?: string
    }) => {
      const { data, error } = await supabase.rpc('registrar_producao', {
        p_produto_id: params.produto_id,
        p_quantidade: params.quantidade,
        p_lote: params.lote ?? '',
        p_observacao: params.observacao ?? '',
        p_usuario_id: user?.id ?? '',
      })
      if (error) throw error
      return data as { producao_id: string; lote: string; custo_total: number }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producoes'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      queryClient.invalidateQueries({ queryKey: ['insumos'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
    },
  })
}

// -------------------------------------------------------
// useVerificarInsumos: checa se insumos são suficientes
// para produzir `quantidade` unidades de `produtoId`
// -------------------------------------------------------
export interface InsumoNecessario {
  insumo_id: string
  insumo_nome: string
  unidade: string
  necessario: number
  disponivel: number
  falta: number
  suficiente: boolean
}

export interface VerificacaoInsumos {
  suficiente: boolean
  itens: InsumoNecessario[]
}

export function useVerificarInsumos(produtoId: string, quantidade: number) {
  return useQuery({
    queryKey: ['verificar-insumos', produtoId, quantidade],
    queryFn: async (): Promise<VerificacaoInsumos> => {
      if (!produtoId || quantidade <= 0) {
        return { suficiente: true, itens: [] }
      }

      // Busca ficha técnica com insumos
      const { data: fichas, error } = await supabase
        .from('fichas_tecnicas')
        .select('quantidade, insumos(id, nome, unidade, estoque_atual)')
        .eq('produto_id', produtoId)

      if (error) throw error
      if (!fichas || fichas.length === 0) {
        return { suficiente: true, itens: [] }
      }

      const itens: InsumoNecessario[] = fichas.map((f) => {
        const insumo = f.insumos as unknown as { id: string; nome: string; unidade: string; estoque_atual: number } | null
        const necessario = (f.quantidade ?? 0) * quantidade
        const disponivel = insumo?.estoque_atual ?? 0
        const falta = Math.max(0, necessario - disponivel)
        return {
          insumo_id: insumo?.id ?? '',
          insumo_nome: insumo?.nome ?? '',
          unidade: insumo?.unidade ?? '',
          necessario,
          disponivel,
          falta,
          suficiente: disponivel >= necessario,
        }
      })

      return {
        suficiente: itens.every((i) => i.suficiente),
        itens,
      }
    },
    enabled: !!produtoId && quantidade > 0,
  })
}
