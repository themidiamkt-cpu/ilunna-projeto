import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import type { Cliente } from '@/types/database.types'

export type { Cliente }

export type ClienteFormData = {
  nome: string
  telefone?: string
  email?: string
  observacao?: string
}

// Busca clientes (search-as-you-type)
export function useClientesBusca(busca?: string) {
  return useQuery({
    queryKey: ['clientes', busca],
    queryFn: async () => {
      let q = supabase
        .from('clientes')
        .select('id, nome, telefone, email')
        .order('nome')
        .limit(20)
      if (busca && busca.length > 1) {
        q = q.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,email.ilike.%${busca}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !busca || busca.length > 1,
  })
}

// Lista todos os clientes (para a página de gestão)
export function useClientesList() {
  return useQuery({
    queryKey: ['clientes-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useCreateCliente() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (form: ClienteFormData) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: form.nome,
          telefone: form.telefone || null,
          email: form.email || null,
          observacao: form.observacao || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['clientes-todos'] })
      toast({ title: 'Cliente cadastrado', description: 'Novo cliente adicionado com sucesso.' })
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })
}

export function useUpdateCliente() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ClienteFormData }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: form.nome,
          telefone: form.telefone || null,
          email: form.email || null,
          observacao: form.observacao || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['clientes-todos'] })
      toast({ title: 'Cliente atualizado' })
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })
}

export function useDeleteCliente() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['clientes-todos'] })
      toast({ title: 'Cliente removido' })
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  })
}
