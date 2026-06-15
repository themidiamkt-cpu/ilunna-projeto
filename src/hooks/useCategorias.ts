import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}
