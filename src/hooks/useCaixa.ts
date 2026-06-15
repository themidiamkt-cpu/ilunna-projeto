import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Caixa } from '@/types/database.types'

// ----------------------------------------------------------------
// useCaixaAtual — retorna o caixa aberto mais recente (ou null)
// ----------------------------------------------------------------
export function useCaixaAtual() {
  return useQuery({
    queryKey: ['caixa', 'atual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixas')
        .select('*')
        .eq('status', 'aberto')
        .order('data_abertura', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Caixa | null
    },
    refetchInterval: 30_000,
  })
}

// ----------------------------------------------------------------
// useUltimoCaixa — retorna o ultimo caixa fechado (para exibir info na abertura)
// ----------------------------------------------------------------
export function useUltimoCaixaFechado() {
  return useQuery({
    queryKey: ['caixa', 'ultimo-fechado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixas')
        .select('*')
        .eq('status', 'fechado')
        .order('data_fechamento', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Caixa | null
    },
  })
}

// ----------------------------------------------------------------
// useAbrirCaixa — mutation para abrir um novo caixa
// ----------------------------------------------------------------
export function useAbrirCaixa() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (valorAbertura: number) => {
      const { data, error } = await supabase
        .from('caixas')
        .insert({
          valor_abertura: valorAbertura,
          usuario_id: user?.id ?? null,
          status: 'aberto',
        })
        .select()
        .single()
      if (error) throw error
      return data as Caixa
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa'] })
      toast({ title: 'Caixa aberto', description: 'Caixa aberto com sucesso.' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao abrir caixa', description: error.message, variant: 'destructive' })
    },
  })
}

// ----------------------------------------------------------------
// useFecharCaixa — chama RPC fechar_caixa
// ----------------------------------------------------------------
export function useFecharCaixa() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      caixaId,
      valorInformado,
    }: {
      caixaId: string
      valorInformado: number
    }) => {
      const { data, error } = await supabase.rpc('fechar_caixa', {
        p_caixa_id: caixaId,
        p_valor_informado: valorInformado,
        p_usuario_id: user?.id ?? null,
      })
      if (error) throw error
      return data as { valor_esperado: number; diferenca: number }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixa'] })
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      toast({ title: 'Caixa fechado', description: 'Caixa encerrado com sucesso.' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao fechar caixa', description: error.message, variant: 'destructive' })
    },
  })
}

// ----------------------------------------------------------------
// useVendasDoCaixa — retorna vendas do caixa corrente agrupadas por forma de pagamento
// ----------------------------------------------------------------
export function useVendasDoCaixa(caixaId: string | undefined) {
  return useQuery({
    queryKey: ['vendas', 'caixa', caixaId],
    queryFn: async () => {
      if (!caixaId) return { vendas: [], totaisPorFormaPagamento: {} as Record<string, number>, totalGeral: 0 }

      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('caixa_id', caixaId)
        .eq('status', 'concluida')
        .order('created_at', { ascending: false })
      if (error) throw error

      const totaisPorFormaPagamento: Record<string, number> = {}
      let totalGeral = 0
      for (const venda of data) {
        const fp = venda.forma_pagamento
        totaisPorFormaPagamento[fp] = (totaisPorFormaPagamento[fp] ?? 0) + venda.total
        totalGeral += venda.total
      }

      return { vendas: data, totaisPorFormaPagamento, totalGeral }
    },
    enabled: !!caixaId,
  })
}
