"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Obra, DiarioObra, FotoObra, DocumentoObra, TimelineObra,
  ColaboradorObra, MaterialObra, LancamentoFinanceiro, OrdemServico,
  Colaborador, EventoCalendario, PresencaColaborador, PagamentoColaborador,
  DocumentoColaborador, MaterialEstoque, MovimentacaoEstoque, Fornecedor,
  Veiculo, ManutencaoVeiculo, AbastecimentoVeiculo, DocumentoVeiculo,
  Orcamento, Cliente, DocumentoCliente,
} from "@/lib/mock-data";

// Service imports
import { getObras, createObra, updateObra, deleteObra, deleteObraCascade } from "@/lib/supabase/services/obras";
import { getLancamentos, createLancamento, updateLancamento, deleteLancamento } from "@/lib/supabase/services/lancamentos";
import { getOrdensServico, createOrdemServico, updateOrdemServico, deleteOrdemServico } from "@/lib/supabase/services/ordens-servico";
import { getColaboradores, createColaborador, updateColaborador, deleteColaborador } from "@/lib/supabase/services/colaboradores";
import { getPresencas, createPresenca } from "@/lib/supabase/services/presencas";
import { getPagamentos, createPagamento, updatePagamento } from "@/lib/supabase/services/pagamentos";
import { getDocumentosColaborador, createDocumentoColaborador } from "@/lib/supabase/services/documentos-colaborador";
import { getMateriaisEstoque, createMaterialEstoque, updateMaterialEstoque, deleteMaterialEstoque } from "@/lib/supabase/services/materiais-estoque";
import { getMovimentacoes, createMovimentacao } from "@/lib/supabase/services/movimentacoes";
import { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor } from "@/lib/supabase/services/fornecedores";
import { getColaboradoresObra, addColaboradorObra, removeColaboradorObra } from "@/lib/supabase/services/colaboradores-obra";
import { getMateriaisObra, addMaterialObra } from "@/lib/supabase/services/materiais-obra";
import { getDiarioObra, addDiarioObra } from "@/lib/supabase/services/diario-obra";
import { getTimelineObra, addTimelineObra } from "@/lib/supabase/services/timeline-obra";
import { getDocumentosObra, addDocumentoObra } from "@/lib/supabase/services/documentos-obra";
import { getFotosObra, addFotoObra } from "@/lib/supabase/services/fotos-obra";
import { getEventosCalendario } from "@/lib/supabase/services/eventos-calendario";
import { getVeiculos, createVeiculo, updateVeiculo, deleteVeiculo } from "@/lib/supabase/services/veiculos";
import { getManutencoesVeiculo, createManutencaoVeiculo } from "@/lib/supabase/services/manutencoes-veiculo";
import { getAbastecimentosVeiculo, createAbastecimentoVeiculo } from "@/lib/supabase/services/abastecimentos-veiculo";
import { getDocumentosVeiculo, createDocumentoVeiculo } from "@/lib/supabase/services/documentos-veiculo";
import { getOrcamentos as getOrcamentosService, createOrcamento as createOrcamentoService, updateOrcamento as updateOrcamentoService, deleteOrcamento as deleteOrcamentoService } from "@/lib/supabase/services/orcamentos";
import { getClientes as getClientesService, createCliente as createClienteService, updateCliente as updateClienteService, deleteCliente as deleteClienteService } from "@/lib/supabase/services/clientes";
import { getDocumentosCliente, createDocumentoCliente } from "@/lib/supabase/services/documentos-cliente";

// ============================================================
// useObras
// ============================================================
export function useObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getObras();
      setObras(data as unknown as Obra[]);
    } catch (err) {
      console.error("Erro ao carregar obras:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (obra: Omit<Obra, "id">) => {
    const created = await createObra(obra);
    await refresh();
    return created as unknown as Obra;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Obra>) => {
    const updated = await updateObra(id, updates);
    await refresh();
    return updated as unknown as Obra;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteObra(id);
    await refresh();
  }, [refresh]);

  const removeCascade = useCallback(async (id: string) => {
    await deleteObraCascade(id);
    await refresh();
  }, [refresh]);

  return { obras, loading, create, update, delete: remove, createObra: create, updateObra: update, deleteObra: remove, deleteObraCascade: removeCascade, refresh };
}

// ============================================================
// useLancamentos
// ============================================================
export function useLancamentos(obraId?: string) {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLancamentos(obraId);
      setLancamentos(data as unknown as LancamentoFinanceiro[]);
    } catch (err) {
      console.error("Erro ao carregar lancamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (lancamento: Omit<LancamentoFinanceiro, "id">) => {
    const created = await createLancamento(lancamento);
    await refresh();
    return created as unknown as LancamentoFinanceiro;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<LancamentoFinanceiro>) => {
    const updated = await updateLancamento(id, updates);
    await refresh();
    return updated as unknown as LancamentoFinanceiro;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteLancamento(id);
    await refresh();
  }, [refresh]);

  return { lancamentos, loading, create, update, delete: remove, createLancamento: create, updateLancamento: update, deleteLancamento: remove, refresh };
}

// ============================================================
// useOrdensServico
// ============================================================
export function useOrdensServico() {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrdensServico();
      setOrdensServico(data as unknown as OrdemServico[]);
    } catch (err) {
      console.error("Erro ao carregar ordens de servico:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (os: Omit<OrdemServico, "id">) => {
    const created = await createOrdemServico(os);
    await refresh();
    return created as unknown as OrdemServico;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<OrdemServico>) => {
    const updated = await updateOrdemServico(id, updates);
    await refresh();
    return updated as unknown as OrdemServico;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteOrdemServico(id);
    await refresh();
  }, [refresh]);

  return { ordensServico, ordens: ordensServico, loading, create, update, delete: remove, createOrdem: create, updateOrdem: update, deleteOrdem: remove, refresh };
}

// ============================================================
// useColaboradores
// ============================================================
export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getColaboradores();
      setColaboradores(data as unknown as Colaborador[]);
    } catch (err) {
      console.error("Erro ao carregar colaboradores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (colab: Omit<Colaborador, "id">) => {
    const created = await createColaborador(colab);
    await refresh();
    return created as unknown as Colaborador;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Colaborador>) => {
    const updated = await updateColaborador(id, updates);
    await refresh();
    return updated as unknown as Colaborador;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteColaborador(id);
    await refresh();
  }, [refresh]);

  return { colaboradores, loading, create, update, delete: remove, createColaborador: create, updateColaborador: update, deleteColaborador: remove, refresh };
}

// ============================================================
// usePresencas
// ============================================================
export function usePresencas(colaboradorId?: string) {
  const [presencas, setPresencas] = useState<PresencaColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPresencas(colaboradorId);
      setPresencas(data as unknown as PresencaColaborador[]);
    } catch (err) {
      console.error("Erro ao carregar presencas:", err);
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (presenca: Omit<PresencaColaborador, "id">) => {
    const created = await createPresenca(presenca);
    await refresh();
    return created as unknown as PresencaColaborador;
  }, [refresh]);

  return { presencas, loading, create, createPresenca: create, refresh };
}

// ============================================================
// usePagamentosColaborador
// ============================================================
export function usePagamentosColaborador(colaboradorId?: string) {
  const [pagamentos, setPagamentos] = useState<PagamentoColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPagamentos(colaboradorId);
      setPagamentos(data as unknown as PagamentoColaborador[]);
    } catch (err) {
      console.error("Erro ao carregar pagamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (pagamento: Omit<PagamentoColaborador, "id">) => {
    const created = await createPagamento(pagamento);
    await refresh();
    return created as unknown as PagamentoColaborador;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<PagamentoColaborador>) => {
    const updated = await updatePagamento(id, updates);
    await refresh();
    return updated as unknown as PagamentoColaborador;
  }, [refresh]);

  return { pagamentos, loading, create, update, createPagamento: create, updatePagamento: update, refresh };
}

// ============================================================
// useDocumentosColaborador
// ============================================================
export function useDocumentosColaborador(colaboradorId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDocumentosColaborador(colaboradorId);
      setDocumentos(data as unknown as DocumentoColaborador[]);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (doc: Omit<DocumentoColaborador, "id">) => {
    const created = await createDocumentoColaborador(doc);
    await refresh();
    return created as unknown as DocumentoColaborador;
  }, [refresh]);

  return { documentos, loading, create, createDocumento: create, refresh };
}

// ============================================================
// useMateriaisEstoque
// ============================================================
export function useMateriaisEstoque() {
  const [materiais, setMateriais] = useState<MaterialEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMateriaisEstoque();
      setMateriais(data as unknown as MaterialEstoque[]);
    } catch (err) {
      console.error("Erro ao carregar materiais:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (mat: Omit<MaterialEstoque, "id">) => {
    const created = await createMaterialEstoque(mat);
    await refresh();
    return created as unknown as MaterialEstoque;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<MaterialEstoque>) => {
    const updated = await updateMaterialEstoque(id, updates);
    await refresh();
    return updated as unknown as MaterialEstoque;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteMaterialEstoque(id);
    await refresh();
  }, [refresh]);

  return { materiais, loading, create, update, delete: remove, createMaterial: create, updateMaterial: update, deleteMaterial: remove, refresh };
}

// ============================================================
// useMovimentacoes
// ============================================================
export function useMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMovimentacoes();
      setMovimentacoes(data as unknown as MovimentacaoEstoque[]);
    } catch (err) {
      console.error("Erro ao carregar movimentacoes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (mov: Omit<MovimentacaoEstoque, "id">) => {
    const created = await createMovimentacao(mov);
    await refresh();
    return created as unknown as MovimentacaoEstoque;
  }, [refresh]);

  return { movimentacoes, loading, create, createMovimentacao: create, refresh };
}

// ============================================================
// useFornecedores
// ============================================================
export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setFornecedores(data as unknown as Fornecedor[]);
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (fornecedor: Omit<Fornecedor, "id">) => {
    const created = await createFornecedor(fornecedor);
    await refresh();
    return created as unknown as Fornecedor;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Fornecedor>) => {
    const updated = await updateFornecedor(id, updates);
    await refresh();
    return updated as unknown as Fornecedor;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteFornecedor(id);
    await refresh();
  }, [refresh]);

  return { fornecedores, loading, create, update, delete: remove, createFornecedor: create, updateFornecedor: update, deleteFornecedor: remove, refresh };
}

// ============================================================
// useColaboradoresObra
// ============================================================
export function useColaboradoresObra(obraId: string) {
  const [colaboradores, setColaboradores] = useState<ColaboradorObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getColaboradoresObra(obraId);
      setColaboradores(data as unknown as ColaboradorObra[]);
    } catch (err) {
      console.error("Erro ao carregar colaboradores da obra:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (colab: Omit<ColaboradorObra, "id">) => {
    await addColaboradorObra(colab);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await removeColaboradorObra(id);
    await refresh();
  }, [refresh]);

  return { colaboradores, loading, add, remove, addColaborador: add, removeColaborador: remove, refresh };
}

// ============================================================
// useMateriaisObra
// ============================================================
export function useMateriaisObra(obraId: string) {
  const [materiais, setMateriais] = useState<MaterialObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMateriaisObra(obraId);
      setMateriais(data as unknown as MaterialObra[]);
    } catch (err) {
      console.error("Erro ao carregar materiais da obra:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (mat: Omit<MaterialObra, "id">) => {
    await addMaterialObra(mat);
    await refresh();
  }, [refresh]);

  return { materiais, loading, add, addMaterial: add, refresh };
}

// ============================================================
// useDiarioObra
// ============================================================
export function useDiarioObra(obraId: string) {
  const [diario, setDiario] = useState<DiarioObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDiarioObra(obraId);
      setDiario(data as unknown as DiarioObra[]);
    } catch (err) {
      console.error("Erro ao carregar diario:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (entry: Omit<DiarioObra, "id">) => {
    await addDiarioObra(entry);
    await refresh();
  }, [refresh]);

  return { diario, entradas: diario, loading, add, addEntrada: add, refresh };
}

// ============================================================
// useTimelineObra
// ============================================================
export function useTimelineObra(obraId: string) {
  const [timeline, setTimeline] = useState<TimelineObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTimelineObra(obraId);
      setTimeline(data as unknown as TimelineObra[]);
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (entry: Omit<TimelineObra, "id">) => {
    await addTimelineObra(entry);
    await refresh();
  }, [refresh]);

  return { timeline, eventos: timeline, loading, add, addEvento: add, refresh };
}

// ============================================================
// useDocumentosObra
// ============================================================
export function useDocumentosObra(obraId: string) {
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDocumentosObra(obraId);
      setDocumentos(data as unknown as DocumentoObra[]);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (doc: Omit<DocumentoObra, "id">) => {
    await addDocumentoObra(doc);
    await refresh();
  }, [refresh]);

  return { documentos, loading, add, addDocumento: add, refresh };
}

// ============================================================
// useFotosObra
// ============================================================
export function useFotosObra(obraId: string) {
  const [fotos, setFotos] = useState<FotoObra[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFotosObra(obraId);
      setFotos(data as unknown as FotoObra[]);
    } catch (err) {
      console.error("Erro ao carregar fotos:", err);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (foto: Omit<FotoObra, "id">) => {
    await addFotoObra(foto);
    await refresh();
  }, [refresh]);

  return { fotos, loading, add, addFoto: add, refresh };
}

// ============================================================
// useEventosCalendario
// ============================================================
export function useEventosCalendario() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventosCalendario();
      setEventos(data as unknown as EventoCalendario[]);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { eventos, loading, refresh };
}

// ============================================================
// useVeiculos
// ============================================================
export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVeiculos();
      setVeiculos(data as unknown as Veiculo[]);
    } catch (err) {
      console.error("Erro ao carregar veiculos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (veiculo: Omit<Veiculo, "id">) => {
    const created = await createVeiculo(veiculo);
    await refresh();
    return created as unknown as Veiculo;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Veiculo>) => {
    const updated = await updateVeiculo(id, updates);
    await refresh();
    return updated as unknown as Veiculo;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteVeiculo(id);
    await refresh();
  }, [refresh]);

  return { veiculos, loading, create, update, delete: remove, createVeiculo: create, updateVeiculo: update, deleteVeiculo: remove, refresh };
}

// ============================================================
// useManutencoesVeiculo
// ============================================================
export function useManutencoesVeiculo(veiculoId?: string) {
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getManutencoesVeiculo(veiculoId);
      setManutencoes(data as unknown as ManutencaoVeiculo[]);
    } catch (err) {
      console.error("Erro ao carregar manutencoes:", err);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (manutencao: Omit<ManutencaoVeiculo, "id">) => {
    const created = await createManutencaoVeiculo(manutencao);
    await refresh();
    return created as unknown as ManutencaoVeiculo;
  }, [refresh]);

  return { manutencoes, loading, create, createManutencao: create, refresh };
}

// ============================================================
// useAbastecimentosVeiculo
// ============================================================
export function useAbastecimentosVeiculo(veiculoId?: string) {
  const [abastecimentos, setAbastecimentos] = useState<AbastecimentoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAbastecimentosVeiculo(veiculoId);
      setAbastecimentos(data as unknown as AbastecimentoVeiculo[]);
    } catch (err) {
      console.error("Erro ao carregar abastecimentos:", err);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (abastecimento: Omit<AbastecimentoVeiculo, "id">) => {
    const created = await createAbastecimentoVeiculo(abastecimento);
    await refresh();
    return created as unknown as AbastecimentoVeiculo;
  }, [refresh]);

  return { abastecimentos, loading, create, createAbastecimento: create, refresh };
}

// ============================================================
// useDocumentosVeiculo
// ============================================================
export function useDocumentosVeiculo(veiculoId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDocumentosVeiculo(veiculoId);
      setDocumentos(data as unknown as DocumentoVeiculo[]);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoading(false);
    }
  }, [veiculoId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (doc: Omit<DocumentoVeiculo, "id">) => {
    const created = await createDocumentoVeiculo(doc);
    await refresh();
    return created as unknown as DocumentoVeiculo;
  }, [refresh]);

  return { documentos, loading, create, createDocumento: create, refresh };
}

// ============================================================
// useClientes
// ============================================================
export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientesService();
      setClientes(data as unknown as Cliente[]);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (cliente: Omit<Cliente, "id">) => {
    const created = await createClienteService(cliente);
    await refresh();
    return created as unknown as Cliente;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Cliente>) => {
    const updated = await updateClienteService(id, updates);
    await refresh();
    return updated as unknown as Cliente;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteClienteService(id);
    await refresh();
  }, [refresh]);

  return { clientes, loading, create, update, delete: remove, createCliente: create, updateCliente: update, deleteCliente: remove, refresh };
}

// ============================================================
// useDocumentosCliente
// ============================================================
export function useDocumentosCliente(clienteId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDocumentosCliente(clienteId);
      setDocumentos(data as unknown as DocumentoCliente[]);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (doc: Omit<DocumentoCliente, "id">) => {
    const created = await createDocumentoCliente(doc);
    await refresh();
    return created as unknown as DocumentoCliente;
  }, [refresh]);

  return { documentos, loading, create, createDocumento: create, refresh };
}

// ============================================================
// useOrcamentos
// ============================================================
export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrcamentosService();
      setOrcamentos(data as unknown as Orcamento[]);
    } catch (err) {
      console.error("Erro ao carregar orcamentos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (orcamento: Omit<Orcamento, "id"> & { id?: string }) => {
    const created = await createOrcamentoService(orcamento);
    await refresh();
    return created as unknown as Orcamento;
  }, [refresh]);

  const update = useCallback(async (id: string, updates: Partial<Orcamento>) => {
    const updated = await updateOrcamentoService(id, updates);
    await refresh();
    return updated as unknown as Orcamento;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteOrcamentoService(id);
    await refresh();
  }, [refresh]);

  return { orcamentos, loading, create, update, delete: remove, createOrcamento: create, updateOrcamento: update, deleteOrcamento: remove, refresh };
}





