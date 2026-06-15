import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata valor monetário em Real brasileiro */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Formata percentual com uma casa decimal */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '0,0%'
  return `${value.toFixed(1).replace('.', ',')}%`
}

/** Formata número com vírgula decimal */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '0'
  return value.toFixed(decimals).replace('.', ',')
}

/** Formata data em pt-BR */
export function formatDate(date: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

/** Formata data e hora em pt-BR */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

/** Converte string para slug SKU */
export function toSKU(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20)
}

/** Variação percentual entre dois valores */
export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}
