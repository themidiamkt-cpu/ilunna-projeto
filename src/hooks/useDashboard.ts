import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

function fmtDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export interface VendaDiaria {
  dia: string
  num_vendas: number
  faturamento: number
  custo_total: number
  lucro: number
  margem_percentual: number
  ticket_medio: number
}

export function useVendasDiarias(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: ['vendas-diarias', fmtDate(dataInicio), fmtDate(dataFim)],
    queryFn: async (): Promise<VendaDiaria[]> => {
      const { data, error } = await supabase
        .from('vw_vendas_diarias')
        .select('*')
        .gte('dia', fmtDate(dataInicio))
        .lte('dia', fmtDate(dataFim))
        .order('dia', { ascending: true })
      if (error) throw error
      return (data ?? []) as VendaDiaria[]
    },
  })
}

export interface ProdutoMaisVendido {
  id: string
  nome: string
  sku: string
  categoria: string | null
  qtd_vendida: number
  faturamento: number
  custo_total: number
  lucro: number
  margem_media: number
}

export function useProdutosMaisVendidos(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: ['produtos-mais-vendidos', fmtDate(dataInicio), fmtDate(dataFim)],
    queryFn: async (): Promise<ProdutoMaisVendido[]> => {
      const { data, error } = await supabase
        .from('venda_itens')
        .select(
          'quantidade, subtotal, custo_unitario, vendas!inner(data, status), produtos!inner(id, nome, sku, categorias(nome))'
        )
        .eq('vendas.status', 'concluida')
        .gte('vendas.data', fmtDate(dataInicio))
        .lte('vendas.data', fmtDate(dataFim))
      if (error) throw error

      const map = new Map<string, { id: string; nome: string; sku: string; categoria: string | null; qtd_vendida: number; faturamento: number; custo_total: number }>()
      for (const row of data ?? []) {
        const p = row.produtos as unknown as { id: string; nome: string; sku: string; categorias: { nome: string } | null } | null
        if (!p) continue
        const existing = map.get(p.id) ?? { id: p.id, nome: p.nome, sku: p.sku, categoria: (p.categorias as { nome: string } | null)?.nome ?? null, qtd_vendida: 0, faturamento: 0, custo_total: 0 }
        existing.qtd_vendida += row.quantidade ?? 0
        existing.faturamento += row.subtotal ?? 0
        existing.custo_total += (row.custo_unitario ?? 0) * (row.quantidade ?? 0)
        map.set(p.id, existing)
      }

      return Array.from(map.values())
        .map((p) => ({ ...p, lucro: p.faturamento - p.custo_total, margem_media: p.faturamento > 0 ? ((p.faturamento - p.custo_total) / p.faturamento) * 100 : 0 }))
        .sort((a, b) => b.qtd_vendida - a.qtd_vendida)
        .slice(0, 10)
    },
  })
}

export interface VendaCategoria {
  categoria_id: string | null
  categoria: string | null
  cor: string | null
  num_vendas: number
  qtd_itens: number
  faturamento: number
  custo_total: number
  lucro: number
}

export function useVendasPorCategoria(dataInicio: Date, dataFim: Date) {
  return useQuery({
    queryKey: ['vendas-por-categoria', fmtDate(dataInicio), fmtDate(dataFim)],
    queryFn: async (): Promise<VendaCategoria[]> => {
      const { data, error } = await supabase
        .from('venda_itens')
        .select('quantidade, subtotal, custo_unitario, vendas!inner(data, status), produtos!inner(categorias(id, nome, cor))')
        .eq('vendas.status', 'concluida')
        .gte('vendas.data', fmtDate(dataInicio))
        .lte('vendas.data', fmtDate(dataFim))
      if (error) throw error

      const map = new Map<string, { categoria_id: string | null; categoria: string | null; cor: string | null; num_vendas: number; qtd_itens: number; faturamento: number; custo_total: number }>()
      for (const row of data ?? []) {
        const cat = (row.produtos as unknown as { categorias: { id: string; nome: string; cor: string | null } | null } | null)?.categorias
        const key = cat?.id ?? '__sem_categoria__'
        const existing = map.get(key) ?? { categoria_id: cat?.id ?? null, categoria: cat?.nome ?? 'Sem categoria', cor: cat?.cor ?? '#9C8070', num_vendas: 0, qtd_itens: 0, faturamento: 0, custo_total: 0 }
        existing.qtd_itens += row.quantidade ?? 0
        existing.faturamento += row.subtotal ?? 0
        existing.custo_total += (row.custo_unitario ?? 0) * (row.quantidade ?? 0)
        map.set(key, existing)
      }

      return Array.from(map.values())
        .map((c) => ({ ...c, lucro: c.faturamento - c.custo_total }))
        .sort((a, b) => b.faturamento - a.faturamento)
    },
  })
}

export interface EstoqueBaixoItem {
  tipo: string
  id: string
  nome: string
  estoque_atual: number
  estoque_minimo: number
  falta: number
  unidade: string | null
}

export function useEstoqueBaixo() {
  return useQuery({
    queryKey: ['estoque-baixo'],
    queryFn: async (): Promise<EstoqueBaixoItem[]> => {
      const { data, error } = await supabase
        .from('vw_estoque_baixo')
        .select('*')
        .order('falta', { ascending: false })
      if (error) throw error
      return (data ?? []) as EstoqueBaixoItem[]
    },
  })
}

export interface VendasSummary {
  faturamento: number
  custo_total: number
  lucro: number
  margem: number
  num_vendas: number
  ticket_medio: number
}

export function useVendasSummary(dataInicio: Date, dataFim: Date) {
  const { data: dias, ...rest } = useVendasDiarias(dataInicio, dataFim)

  const summary: VendasSummary = (dias ?? []).reduce(
    (acc, d) => ({
      faturamento: acc.faturamento + (d.faturamento ?? 0),
      custo_total: acc.custo_total + (d.custo_total ?? 0),
      lucro: acc.lucro + (d.lucro ?? 0),
      margem: 0,
      num_vendas: acc.num_vendas + (d.num_vendas ?? 0),
      ticket_medio: 0,
    }),
    { faturamento: 0, custo_total: 0, lucro: 0, margem: 0, num_vendas: 0, ticket_medio: 0 }
  )

  summary.margem = summary.faturamento > 0 ? (summary.lucro / summary.faturamento) * 100 : 0
  summary.ticket_medio = summary.num_vendas > 0 ? summary.faturamento / summary.num_vendas : 0

  return { data: summary, ...rest }
}
