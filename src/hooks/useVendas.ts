import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { VendaComItens } from '@/types/database.types'

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------
export type ItemVenda = {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

export type ProcessarVendaParams = {
  caixa_id: string
  cliente_id: string
  forma_pagamento: string
  desconto: number
  itens: ItemVenda[]
}

export type ResultadoVenda = {
  venda_id: string
  numero: string
  total: number
}

export type FiltrosVenda = {
  dataInicio?: string
  dataFim?: string
  status?: string
  formaPagamento?: string
  page?: number
  pageSize?: number
}

// ----------------------------------------------------------------
// useProcessarVenda — chama RPC processar_venda
// ----------------------------------------------------------------
export function useProcessarVenda() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (params: ProcessarVendaParams): Promise<ResultadoVenda> => {
      const { data, error } = await supabase.rpc('processar_venda', {
        p_caixa_id: params.caixa_id,
        p_cliente_id: params.cliente_id,
        p_forma_pagamento: params.forma_pagamento,
        p_desconto: params.desconto,
        p_usuario_id: user?.id ?? null,
        p_itens: params.itens,
      })
      if (error) throw error
      return data as ResultadoVenda
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      queryClient.invalidateQueries({ queryKey: ['caixa'] })
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({ title: `Venda #${data.numero} registrada`, description: 'Venda finalizada com sucesso.' })
    },
    onError: (error: Error) => {
      // Nao exibe toast aqui — o componente trata o erro diretamente
      console.error('Erro ao processar venda:', error.message)
    },
  })
}

// ----------------------------------------------------------------
// useVendas — lista paginada com filtros e join a clientes
// ----------------------------------------------------------------
export function useVendas(filtros?: FiltrosVenda) {
  const page = filtros?.page ?? 0
  const pageSize = filtros?.pageSize ?? 20
  const from = page * pageSize
  const to = from + pageSize - 1

  return useQuery({
    queryKey: ['vendas', 'lista', filtros],
    queryFn: async () => {
      let query = supabase
        .from('vendas')
        .select(`
          *,
          clientes ( id, nome, telefone ),
          venda_itens (
            id, quantidade, preco_unitario, subtotal,
            produtos ( id, nome, sku )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filtros?.dataInicio) query = query.gte('data', filtros.dataInicio)
      if (filtros?.dataFim) query = query.lte('data', filtros.dataFim)
      if (filtros?.status) query = query.eq('status', filtros.status as 'concluida' | 'cancelada')
      if (filtros?.formaPagamento) query = query.eq('forma_pagamento', filtros.formaPagamento as 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro')

      const { data, error, count } = await query
      if (error) throw error
      return { vendas: data as unknown as VendaComItens[], total: count ?? 0 }
    },
  })
}

// ----------------------------------------------------------------
// useVenda — busca uma venda pelo ID (com itens e cliente)
// ----------------------------------------------------------------
export function useVenda(id: string | undefined) {
  return useQuery({
    queryKey: ['vendas', 'detalhe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes ( id, nome, telefone ),
          venda_itens (
            id, quantidade, preco_unitario, custo_unitario, subtotal,
            produtos ( id, nome, sku )
          )
        `)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as VendaComItens
    },
    enabled: !!id,
  })
}

// ----------------------------------------------------------------
// useClientes — busca clientes por nome ou telefone
// ----------------------------------------------------------------
export function useClientes(busca?: string) {
  return useQuery({
    queryKey: ['clientes', busca],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('id, nome, telefone, email')
        .order('nome')
        .limit(20)

      if (busca && busca.length > 1) {
        query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !busca || busca.length > 1,
  })
}

// ----------------------------------------------------------------
// useProdutosPDV — lista produtos ativos com estoque para o PDV
// ----------------------------------------------------------------
export function useProdutosPDV() {
  return useQuery({
    queryKey: ['produtos', 'pdv'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id, nome, sku, preco_venda, estoque_atual,
          categorias ( id, nome, cor )
        `)
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data
    },
    refetchInterval: 60_000,
  })
}
