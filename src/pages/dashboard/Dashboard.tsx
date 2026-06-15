import { useState, useMemo } from 'react'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, ShoppingCart, Package, Receipt, AlertTriangle, BarChart2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendasDiarias, useProdutosMaisVendidos, useVendasPorCategoria, useEstoqueBaixo } from '@/hooks/useDashboard'
import { formatCurrency, formatPercent, calcVariation } from '@/lib/utils'

type Periodo = 'hoje' | '7dias' | '30dias' | 'mes'
const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
]

function usePeriodo(periodo: Periodo) {
  const now = new Date()
  switch (periodo) {
    case 'hoje': return { inicio: startOfDay(now), fim: endOfDay(now) }
    case '7dias': return { inicio: startOfDay(subDays(now, 6)), fim: endOfDay(now) }
    case '30dias': return { inicio: startOfDay(subDays(now, 29)), fim: endOfDay(now) }
    case 'mes': return { inicio: startOfMonth(now), fim: endOfMonth(now) }
  }
}

function VariacaoBadge({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function KPICard({ title, value, subtitle, icon: Icon, variacao, loading }: {
  title: string; value: string; subtitle?: string; icon: any; variacao?: number; loading?: boolean
}) {
  return (
    <Card className="bg-white border-ilunna-light">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ilunna-muted font-medium uppercase tracking-wide">{title}</p>
            {loading ? <Skeleton className="h-8 w-28 mt-1" /> : (
              <p className="text-2xl font-bold text-ilunna-dark mt-1 truncate">{value}</p>
            )}
            {subtitle && !loading && <p className="text-xs text-ilunna-muted mt-0.5">{subtitle}</p>}
            {variacao !== undefined && !loading && <div className="mt-1"><VariacaoBadge pct={variacao} /></div>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-ilunna-light flex items-center justify-center ml-3 shrink-0">
            <Icon className="w-5 h-5 text-ilunna-terracotta" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const COLORS = ['#C4704F', '#D4A853', '#6B8F71', '#8B6B9A', '#2C6E8A', '#6B3F2A']

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<Periodo>('30dias')
  const { inicio, fim } = usePeriodo(periodo)

  const { data: vendasDiarias = [], isLoading: loadingDiarias } = useVendasDiarias(inicio, fim)
  const { data: maisvVendidos = [], isLoading: loadingTop } = useProdutosMaisVendidos(inicio, fim)
  const { data: porCategoria = [], isLoading: loadingCat } = useVendasPorCategoria(inicio, fim)
  const { data: estoqueBaixo = [] } = useEstoqueBaixo()

  const totais = useMemo(() => {
    const fat = vendasDiarias.reduce((s, d) => s + (d.faturamento ?? 0), 0)
    const custo = vendasDiarias.reduce((s, d) => s + (d.custo_total ?? 0), 0)
    const lucro = fat - custo
    const numV = vendasDiarias.reduce((s, d) => s + (d.num_vendas ?? 0), 0)
    return {
      faturamento: fat,
      custo,
      lucro,
      margem: fat > 0 ? (lucro / fat) * 100 : 0,
      numVendas: numV,
      ticketMedio: numV > 0 ? fat / numV : 0,
    }
  }, [vendasDiarias])

  const chartData = vendasDiarias.map(d => ({
    dia: format(new Date(d.dia), 'dd/MM', { locale: ptBR }),
    faturamento: d.faturamento ?? 0,
    lucro: d.lucro ?? 0,
  })).reverse()

  const catChartData = porCategoria.map((c, i) => ({
    name: c.categoria ?? 'Sem categoria',
    value: c.faturamento ?? 0,
    color: c.cor ?? COLORS[i % COLORS.length],
  }))

  const formatTooltipBRL = (value: number) => formatCurrency(value)

  return (
    <div className="p-6 space-y-6 bg-ilunna-cream min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl text-ilunna-dark">Dashboard</h1>
          <p className="text-ilunna-muted text-sm mt-0.5">Visão geral do negócio</p>
        </div>
        <div className="flex gap-1 bg-white border border-ilunna-light rounded-xl p-1">
          {PERIODOS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodo === p.value ? 'bg-ilunna-terracotta text-white shadow-sm' : 'text-ilunna-muted hover:text-ilunna-brown'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard title="Faturamento" value={formatCurrency(totais.faturamento)} icon={TrendingUp} loading={loadingDiarias} />
        <KPICard title="Lucro Bruto" value={formatCurrency(totais.lucro)} icon={TrendingUp} loading={loadingDiarias} />
        <KPICard title="Margem" value={formatPercent(totais.margem)} icon={BarChart2} loading={loadingDiarias} />
        <KPICard title="Vendas" value={String(totais.numVendas)} icon={ShoppingCart} loading={loadingDiarias} />
        <KPICard title="Ticket Médio" value={formatCurrency(totais.ticketMedio)} icon={Receipt} loading={loadingDiarias} />
        <KPICard
          title="Alertas Estoque"
          value={String(estoqueBaixo.length)}
          subtitle={estoqueBaixo.length > 0 ? 'itens abaixo do mínimo' : 'estoque OK'}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Line chart */}
        <Card className="lg:col-span-3 bg-white border-ilunna-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ilunna-dark">Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDiarias ? <Skeleton className="h-52 w-full" /> : chartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-ilunna-muted text-sm">Sem vendas no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9C8070' }} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9C8070' }} />
                  <Tooltip formatter={formatTooltipBRL} labelStyle={{ color: '#2C1810' }} contentStyle={{ borderColor: '#F0EBE3', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="faturamento" stroke="#C4704F" strokeWidth={2} dot={false} name="Faturamento" />
                  <Line type="monotone" dataKey="lucro" stroke="#D4A853" strokeWidth={2} dot={false} name="Lucro" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="lg:col-span-2 bg-white border-ilunna-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ilunna-dark">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCat ? <Skeleton className="h-52 w-full" /> : catChartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-ilunna-muted text-sm">Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={catChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {catChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={formatTooltipBRL} contentStyle={{ borderColor: '#F0EBE3', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card className="bg-white border-ilunna-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ilunna-dark">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTop ? <Skeleton className="h-40 w-full" /> : maisvVendidos.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-ilunna-muted text-sm">Sem vendas no período</div>
            ) : (
              <div className="space-y-2">
                {maisvVendidos.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-ilunna-light text-ilunna-muted'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ilunna-dark truncate">{p.nome}</p>
                      <p className="text-xs text-ilunna-muted">{p.qtd_vendida} unidades</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-ilunna-dark">{formatCurrency(p.faturamento)}</p>
                      <p className="text-xs text-green-600">{formatPercent(p.margem_media ?? 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-white border-ilunna-light">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ilunna-dark flex items-center gap-2">
              Alertas
              {estoqueBaixo.length > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200">{estoqueBaixo.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estoqueBaixo.length === 0 ? (
              <div className="h-24 flex flex-col items-center justify-center gap-1 text-green-600">
                <Package className="w-6 h-6" />
                <p className="text-sm font-medium">Estoque normalizado</p>
                <p className="text-xs text-ilunna-muted">Todos os itens acima do mínimo</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {estoqueBaixo.slice(0, 8).map((item: any, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${item.estoque_atual <= 0 ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${item.estoque_atual <= 0 ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ilunna-dark truncate">{item.nome}</p>
                      <p className="text-xs text-ilunna-muted capitalize">{item.tipo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${item.estoque_atual <= 0 ? 'text-red-500' : 'text-amber-600'}`}>{item.estoque_atual}</p>
                      <p className="text-xs text-ilunna-muted">mín {item.estoque_minimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
