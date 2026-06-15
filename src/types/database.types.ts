
// ============================================================
// Ilunna Gestão - Database Types (aligned with migrations)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: { id: string; nome: string; descricao: string | null; cor: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; descricao?: string | null; cor?: string | null }
        Update: { id?: string; nome?: string; descricao?: string | null; cor?: string | null; updated_at?: string }
        Relationships: []
      }
      perfis: {
        Row: { id: string; usuario_id: string; nome: string; papel: "admin" | "operador"; created_at: string; updated_at: string }
        Insert: { id?: string; usuario_id: string; nome: string; papel?: "admin" | "operador" }
        Update: { id?: string; nome?: string; papel?: "admin" | "operador"; updated_at?: string }
        Relationships: []
      }
      clientes: {
        Row: { id: string; nome: string; telefone: string | null; email: string | null; observacao: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; telefone?: string | null; email?: string | null; observacao?: string | null }
        Update: { id?: string; nome?: string; telefone?: string | null; email?: string | null; observacao?: string | null; updated_at?: string }
        Relationships: []
      }
      insumos: {
        Row: { id: string; nome: string; tipo: "liquido" | "solido" | "embalagem" | "acessorio"; unidade: "ml" | "gr" | "un"; volume_compra: number; custo_compra: number; custo_unitario: number; estoque_atual: number; estoque_minimo: number; fornecedor: string | null; ativo: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; tipo?: "liquido" | "solido" | "embalagem" | "acessorio"; unidade?: "ml" | "gr" | "un"; volume_compra?: number; custo_compra?: number; custo_unitario?: number; estoque_atual?: number; estoque_minimo?: number; fornecedor?: string | null; ativo?: boolean }
        Update: { id?: string; nome?: string; tipo?: "liquido" | "solido" | "embalagem" | "acessorio"; unidade?: "ml" | "gr" | "un"; volume_compra?: number; custo_compra?: number; custo_unitario?: number; estoque_atual?: number; estoque_minimo?: number; fornecedor?: string | null; ativo?: boolean; updated_at?: string }
        Relationships: []
      }
      produtos: {
        Row: { id: string; nome: string; sku: string | null; tipo: "simples" | "producao" | "kit"; categoria_id: string | null; preco_venda: number; custo_producao: number; margem_valor: number | null; margem_percentual: number | null; estoque_atual: number; estoque_minimo: number; validade_dias: number | null; imagem_url: string | null; ativo: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; sku?: string | null; tipo?: "simples" | "producao" | "kit"; categoria_id?: string | null; preco_venda?: number; custo_producao?: number; estoque_atual?: number; estoque_minimo?: number; validade_dias?: number | null; imagem_url?: string | null; ativo?: boolean }
        Update: { id?: string; nome?: string; sku?: string | null; tipo?: "simples" | "producao" | "kit"; categoria_id?: string | null; preco_venda?: number; custo_producao?: number; estoque_atual?: number; estoque_minimo?: number; validade_dias?: number | null; imagem_url?: string | null; ativo?: boolean; updated_at?: string }
        Relationships: []
      }
      kit_itens: {
        Row: { id: string; kit_id: string; produto_id: string; quantidade: number; custo_unitario: number; custo_linha: number; created_at: string }
        Insert: { id?: string; kit_id: string; produto_id: string; quantidade?: number; custo_unitario?: number }
        Update: { id?: string; quantidade?: number; custo_unitario?: number }
        Relationships: []
      }
      fichas_tecnicas: {
        Row: { id: string; produto_id: string; insumo_id: string; quantidade: number; custo_linha: number; created_at: string; updated_at: string }
        Insert: { id?: string; produto_id: string; insumo_id: string; quantidade: number; custo_linha?: number }
        Update: { id?: string; produto_id?: string; insumo_id?: string; quantidade?: number; custo_linha?: number; updated_at?: string }
        Relationships: []
      }
      caixas: {
        Row: { id: string; data_abertura: string; data_fechamento: string | null; valor_abertura: number; valor_fechamento_informado: number | null; valor_esperado: number; diferenca: number | null; usuario_id: string | null; status: "aberto" | "fechado"; created_at: string; updated_at: string }
        Insert: { id?: string; data_abertura?: string; valor_abertura?: number; usuario_id?: string | null; status?: "aberto" | "fechado" }
        Update: { id?: string; data_fechamento?: string | null; valor_fechamento_informado?: number | null; valor_esperado?: number; diferenca?: number | null; status?: "aberto" | "fechado"; updated_at?: string }
        Relationships: []
      }
      vendas: {
        Row: { id: string; numero: string; data: string; cliente_id: string | null; subtotal: number; desconto: number; total: number; forma_pagamento: "dinheiro" | "pix" | "debito" | "credito" | "outro"; status: "concluida" | "cancelada"; caixa_id: string | null; usuario_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; numero: string; data?: string; cliente_id?: string | null; subtotal?: number; desconto?: number; total?: number; forma_pagamento?: "dinheiro" | "pix" | "debito" | "credito" | "outro"; status?: "concluida" | "cancelada"; caixa_id?: string | null; usuario_id?: string | null }
        Update: { id?: string; status?: "concluida" | "cancelada"; updated_at?: string }
        Relationships: []
      }
      venda_itens: {
        Row: { id: string; venda_id: string; produto_id: string; quantidade: number; preco_unitario: number; custo_unitario: number; subtotal: number; created_at: string }
        Insert: { id?: string; venda_id: string; produto_id: string; quantidade?: number; preco_unitario?: number; custo_unitario?: number; subtotal?: number }
        Update: { id?: string }
        Relationships: []
      }
      producoes: {
        Row: { id: string; produto_id: string; quantidade_produzida: number; custo_total: number; lote: string | null; validade: string | null; data: string; usuario_id: string | null; observacao: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; produto_id: string; quantidade_produzida?: number; custo_total?: number; lote?: string | null; validade?: string | null; data?: string; usuario_id?: string | null; observacao?: string | null }
        Update: { id?: string; updated_at?: string }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: { id: string; tipo: "entrada_insumo" | "producao" | "venda" | "ajuste" | "perda"; referencia_tipo: string; referencia_id: string; quantidade: number; custo_unitario: number | null; motivo: string | null; data: string; usuario_id: string | null; created_at: string }
        Insert: { id?: string; tipo: "entrada_insumo" | "producao" | "venda" | "ajuste" | "perda"; referencia_tipo: string; referencia_id: string; quantidade: number; custo_unitario?: number | null; motivo?: string | null; data?: string; usuario_id?: string | null }
        Update: { id?: string }
        Relationships: []
      }
    }
    Views: {
      vw_margem_produtos: {
        Row: { id: string; nome: string; sku: string | null; categoria: string | null; categoria_cor: string | null; preco_venda: number; custo_producao: number; margem_valor: number | null; margem_percentual: number | null; estoque_atual: number; estoque_minimo: number; ativo: boolean }
        Relationships: []
      }
      vw_estoque_baixo: {
        Row: { tipo: string; id: string; nome: string; estoque_atual: number; estoque_minimo: number; falta: number | null; unidade: string | null }
        Relationships: []
      }
      vw_vendas_diarias: {
        Row: { dia: string; num_vendas: number; faturamento: number; custo_total: number; lucro: number; margem_percentual: number; ticket_medio: number }
        Relationships: []
      }
      vw_vendas_por_categoria: {
        Row: { categoria_id: string | null; categoria: string | null; cor: string | null; num_vendas: number; qtd_itens: number; faturamento: number; custo_total: number; lucro: number }
        Relationships: []
      }
      vw_produtos_mais_vendidos: {
        Row: { id: string; nome: string; sku: string | null; categoria: string | null; qtd_vendida: number; faturamento: number; custo_total: number; lucro: number; margem_media: number | null }
        Relationships: []
      }
      vw_valorizacao_estoque: {
        Row: { tipo: string; id: string; nome: string; quantidade: number; custo_unitario: number; valor_custo: number; preco_unitario: number | null; valor_venda: number | null }
        Relationships: []
      }
    }
    Functions: {
      processar_venda: {
        Args: { p_caixa_id: string; p_cliente_id: string; p_forma_pagamento: string; p_desconto: number; p_usuario_id: string | null; p_itens: Json }
        Returns: Json
      }
      registrar_producao: {
        Args: { p_produto_id: string; p_quantidade: number; p_lote: string; p_observacao: string; p_usuario_id: string | null }
        Returns: Json
      }
      fechar_caixa: {
        Args: { p_caixa_id: string; p_valor_informado: number; p_usuario_id: string | null }
        Returns: Json
      }
      get_dashboard_summary: {
        Args: { p_data_inicio: string; p_data_fim: string }
        Returns: Json
      }
      get_user_papel: { Args: Record<string, never>; Returns: string }
      generate_venda_numero: { Args: Record<string, never>; Returns: string }
      recalc_custo_producao: { Args: { p_produto_id: string }; Returns: void }
    }
    Enums: {
      unidade_insumo: "ml" | "gr" | "un"
      tipo_insumo: "liquido" | "solido" | "embalagem" | "acessorio"
      forma_pagamento: "dinheiro" | "pix" | "debito" | "credito" | "outro"
      status_venda: "concluida" | "cancelada"
      status_caixa: "aberto" | "fechado"
      tipo_movimentacao: "entrada_insumo" | "producao" | "venda" | "ajuste" | "perda"
      papel_usuario: "admin" | "operador"
    }
  }
}

// Convenience types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"]

export type Categoria = Tables<"categorias">
export type Insumo = Tables<"insumos">
export type Produto = Tables<"produtos">
export type FichaTecnica = Tables<"fichas_tecnicas">
export type Caixa = Tables<"caixas">
export type Venda = Tables<"vendas">
export type VendaItem = Tables<"venda_itens">
export type Producao = Tables<"producoes">
export type MovimentacaoEstoque = Tables<"movimentacoes_estoque">
export type Cliente = Tables<"clientes">
export type Perfil = Tables<"perfis">

export type VendaComItens = Venda & {
  venda_itens: (VendaItem & { produtos: { nome: string } | null })[]
  clientes: { nome: string } | null
}

export type ProdutoComCategoria = Produto & {
  categorias: { id: string; nome: string; cor: string } | null
}

export type FichaTecnicaComInsumo = FichaTecnica & {
  insumos: { id: string; nome: string; unidade: string; custo_unitario: number } | null
}

export type KitItem = Tables<"kit_itens">
export type KitItemComProduto = KitItem & {
  produtos: { id: string; nome: string; sku: string | null; custo_producao: number } | null
}

export type ProducaoComProduto = Producao & {
  produtos: { id: string; nome: string; sku: string | null } | null
}
