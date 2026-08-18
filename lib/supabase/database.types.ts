export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      obras: {
        Row: {
          id: string;
          nome: string;
          cliente: string | null;
          cliente_id: string | null;
          endereco: string | null;
          cidade: string | null;
          estado: string | null;
          data_inicio: string | null;
          previsao_termino: string | null;
          orcamento: number;
          gasto_real: number;
          progresso: number;
          status: string;
          descricao: string | null;
          foto_capa: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["obras"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["obras"]["Insert"]>;
      };
      clientes: {
        Row: {
          id: string;
          tipo: string;
          nome: string;
          cpf_cnpj: string | null;
          telefone: string | null;
          email: string | null;
          cep: string | null;
          rua: string | null;
          numero: string | null;
          bairro: string | null;
          cidade: string | null;
          uf: string | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clientes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
      };
      lancamentos: {
        Row: {
          id: string;
          obra_id: string | null;
          tipo: string;
          categoria: string | null;
          descricao: string | null;
          valor: number;
          data: string | null;
          data_pagamento: string | null;
          status: string;
          fornecedor_cliente: string | null;
          observacoes: string | null;
          comprovante: string | null;
          parcela: number | null;
          total_parcelas: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lancamentos"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lancamentos"]["Insert"]>;
      };
      orcamentos: {
        Row: {
          id: string;
          nome: string;
          obra_id: string | null;
          obra_nome: string | null;
          cliente_nome: string | null;
          uf: string | null;
          bdi: number;
          bdi_breakdown: Json | null;
          area_m2: number;
          base_padrao: string;
          status: string;
          capitulos: Json;
          encargos_horista: number | null;
          encargos_mensalista: number | null;
          tipo_encargo: string | null;
          fator_regional: number | null;
          contingencia: number | null;
          subtotal: number;
          valor_bdi: number;
          valor_encargos: number | null;
          valor_contingencia: number | null;
          total: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orcamentos"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orcamentos"]["Insert"]>;
      };
      ordens_servico: {
        Row: {
          id: string;
          numero: number;
          obra_id: string | null;
          cliente_id: string | null;
          cliente: string | null;
          local: string | null;
          tecnico_id: string | null;
          tecnico: string | null;
          tipo_servico: string | null;
          descricao: string | null;
          prioridade: string;
          status: string;
          data_abertura: string | null;
          data_agendada: string | null;
          data_conclusao: string | null;
          valor_estimado: number;
          observacoes: string | null;
          checklist: Json;
          materiais: Json;
          fotos: string[];
          hora_inicio: string | null;
          hora_fim: string | null;
          assinatura: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ordens_servico"]["Row"], "id" | "created_at" | "numero"> & {
          id?: string;
          created_at?: string;
          numero?: number;
        };
        Update: Partial<Database["public"]["Tables"]["ordens_servico"]["Insert"]>;
      };
      colaboradores: {
        Row: {
          id: string;
          nome: string;
          cpf: string | null;
          cargo: string | null;
          telefone: string | null;
          endereco: string | null;
          status: string;
          salario: number;
          data_admissao: string | null;
          avatar: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["colaboradores"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["colaboradores"]["Insert"]>;
      };
      presencas_colaborador: {
        Row: {
          id: string;
          colaborador_id: string;
          data: string | null;
          check_in: string | null;
          check_out: string | null;
          horas: number;
          tipo: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["presencas_colaborador"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["presencas_colaborador"]["Insert"]>;
      };
      pagamentos_colaborador: {
        Row: {
          id: string;
          colaborador_id: string;
          tipo: string;
          valor: number;
          data: string | null;
          status: string;
          descricao: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pagamentos_colaborador"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos_colaborador"]["Insert"]>;
      };
      documentos_colaborador: {
        Row: {
          id: string;
          colaborador_id: string;
          tipo: string | null;
          nome: string | null;
          validade: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documentos_colaborador"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos_colaborador"]["Insert"]>;
      };
      colaboradores_obra: {
        Row: {
          id: string;
          obra_id: string;
          nome: string;
          cargo: string | null;
          horas_trabalhadas: number;
          avatar: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["colaboradores_obra"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["colaboradores_obra"]["Insert"]>;
      };
      materiais_obra: {
        Row: {
          id: string;
          obra_id: string;
          nome: string;
          unidade: string | null;
          quantidade: number;
          custo_unitario: number;
          custo_total: number;
        };
        Insert: Omit<Database["public"]["Tables"]["materiais_obra"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["materiais_obra"]["Insert"]>;
      };
      fornecedores: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          telefone: string | null;
          email: string | null;
          endereco: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fornecedores"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fornecedores"]["Insert"]>;
      };
      materiais_estoque: {
        Row: {
          id: string;
          codigo: string | null;
          nome: string;
          unidade: string;
          quantidade: number;
          estoque_minimo: number;
          valor_unitario: number;
          fornecedor_id: string | null;
          fornecedor: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["materiais_estoque"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["materiais_estoque"]["Insert"]>;
      };
      movimentacoes_estoque: {
        Row: {
          id: string;
          material_id: string | null;
          material_nome: string | null;
          tipo: string;
          quantidade: number;
          obra_id: string | null;
          obra_nome: string | null;
          responsavel: string | null;
          motivo: string | null;
          data: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["movimentacoes_estoque"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["movimentacoes_estoque"]["Insert"]>;
      };
      veiculos: {
        Row: {
          id: string;
          nome: string;
          placa: string | null;
          tipo: string;
          marca: string | null;
          modelo: string | null;
          ano: number | null;
          km_atual: number;
          horimetro: number;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["veiculos"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["veiculos"]["Insert"]>;
      };
      manutencoes_veiculo: {
        Row: {
          id: string;
          veiculo_id: string;
          tipo: string | null;
          descricao: string | null;
          data: string | null;
          custo: number;
          km_na_manutencao: number;
          proxima_km: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["manutencoes_veiculo"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["manutencoes_veiculo"]["Insert"]>;
      };
      abastecimentos_veiculo: {
        Row: {
          id: string;
          veiculo_id: string;
          data: string | null;
          litros: number | null;
          preco_litro: number | null;
          total: number | null;
          km: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["abastecimentos_veiculo"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["abastecimentos_veiculo"]["Insert"]>;
      };
      documentos_veiculo: {
        Row: {
          id: string;
          veiculo_id: string;
          tipo: string | null;
          nome: string | null;
          validade: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documentos_veiculo"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos_veiculo"]["Insert"]>;
      };
      diario_obra: {
        Row: {
          id: string;
          obra_id: string;
          data: string | null;
          clima: string | null;
          descricao: string | null;
          fotos: string[];
          equipe_presente_numero: number | null;
          equipe_nomes: string | null;
          ocorrencias: string | null;
          videos: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["diario_obra"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diario_obra"]["Insert"]>;
      };
      fotos_obra: {
        Row: {
          id: string;
          obra_id: string;
          url: string;
          descricao: string | null;
          data: string | null;
          etapa: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fotos_obra"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fotos_obra"]["Insert"]>;
      };
      documentos_obra: {
        Row: {
          id: string;
          obra_id: string;
          nome: string | null;
          tipo: string | null;
          url: string | null;
          categoria: string | null;
          tamanho: number;
          descricao: string | null;
          obra_nome: string | null;
          data_upload: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documentos_obra"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos_obra"]["Insert"]>;
      };
      timeline_obra: {
        Row: {
          id: string;
          obra_id: string;
          tipo: string;
          titulo: string | null;
          descricao: string | null;
          data: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_obra"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["timeline_obra"]["Insert"]>;
      };
      eventos_calendario: {
        Row: {
          id: string;
          titulo: string;
          data: string | null;
          tipo: string | null;
          descricao: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["eventos_calendario"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["eventos_calendario"]["Insert"]>;
      };
      documentos_cliente: {
        Row: {
          id: string;
          cliente_id: string;
          tipo: string | null;
          nome: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documentos_cliente"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos_cliente"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          company_name: string | null;
          phone: string | null;
          active: boolean;
          allowed_modules: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      access_requests: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          empresa: string | null;
          cargo: string | null;
          mensagem: string | null;
          status: string;
          data_solicitacao: string;
          data_resposta: string | null;
          motivo_rejeicao: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["access_requests"]["Row"], "id" | "data_solicitacao"> & {
          id?: string;
          data_solicitacao?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_requests"]["Insert"]>;
      };
      centro_custos: {
        Row: {
          id: string;
          obra_id: string;
          centro: string;
          orcado: number;
          realizado: number;
        };
        Insert: Omit<Database["public"]["Tables"]["centro_custos"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["centro_custos"]["Insert"]>;
      };
      orcado_realizado: {
        Row: {
          id: string;
          obra_id: string;
          categoria: string;
          planejado: number;
          realizado: number;
        };
        Insert: Omit<Database["public"]["Tables"]["orcado_realizado"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orcado_realizado"]["Insert"]>;
      };
      cronograma_etapas: {
        Row: {
          id: string;
          obra_id: string;
          nome: string;
          data_prevista: string;
          data_realizada: string | null;
          percentual_concluido: number;
          valor_planejado: number;
          valor_realizado: number;
          status: string;
          ordem: number;
          depende_de: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cronograma_etapas"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cronograma_etapas"]["Insert"]>;
      };
      compras: {
        Row: {
          id: string;
          item: string;
          quantidade: number;
          unidade: string;
          obra_id: string;
          obra_nome: string;
          fornecedor_id: string | null;
          fornecedor_nome: string | null;
          valor_unitario: number;
          valor_total: number;
          status: string;
          cotacoes: Json;
          data_solicitacao: string | null;
          data_cotacao: string | null;
          data_aprovacao: string | null;
          data_pedido: string | null;
          data_recebimento: string | null;
          data_pagamento: string | null;
          observacoes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["compras"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compras"]["Insert"]>;
      };
      app_settings: {
        Row: {
          id: string;
          chave: string;
          valor: Json;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["app_settings"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
