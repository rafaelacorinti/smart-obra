"use client";

import { useState, useEffect, useCallback } from "react";
import { StorageService, generateId } from "@/lib/storage";
import {
  Obra, DiarioObra, FotoObra, DocumentoObra, TimelineObra,
  ColaboradorObra, MaterialObra, LancamentoFinanceiro, OrdemServico,
  Colaborador, EventoCalendario, PresencaColaborador, PagamentoColaborador,
  DocumentoColaborador, MaterialEstoque, MovimentacaoEstoque, Fornecedor,
  Veiculo, ManutencaoVeiculo, AbastecimentoVeiculo, DocumentoVeiculo,
  Orcamento, Cliente, DocumentoCliente,
  obrasIniciais, lancamentosIniciais, ordensServicoIniciais,
  colaboradoresIniciais, colaboradoresObraIniciais, materiaisObraIniciais,
  diarioObraIniciais, timelineObraIniciais, documentosObraIniciais,
  eventosCalendarioIniciais, fotosObraIniciais, presencasIniciais,
  pagamentosIniciais, documentosColaboradorIniciais, materiaisEstoqueIniciais,
  movimentacoesIniciais, fornecedoresIniciais, veiculosIniciais,
  manutencoesVeiculoIniciais, abastecimentosVeiculoIniciais,
  documentosVeiculoIniciais, clientesIniciais, documentosClienteIniciais,
} from "@/lib/mock-data";

// Storage instances
const obrasStorage = new StorageService<Obra>("smart-obra-obras");
const lancamentosStorage = new StorageService<LancamentoFinanceiro>("smart-obra-lancamentos");
const ordensStorage = new StorageService<OrdemServico>("smart-obra-ordens");
const colaboradoresStorage = new StorageService<Colaborador>("smart-obra-colaboradores");
const colaboradoresObraStorage = new StorageService<ColaboradorObra>("smart-obra-colaboradores-obra");
const materiaisObraStorage = new StorageService<MaterialObra>("smart-obra-materiais-obra");
const diarioStorage = new StorageService<DiarioObra>("smart-obra-diario");
const timelineStorage = new StorageService<TimelineObra>("smart-obra-timeline");
const documentosStorage = new StorageService<DocumentoObra>("smart-obra-documentos");
const eventosStorage = new StorageService<EventoCalendario>("smart-obra-eventos");
const fotosStorage = new StorageService<FotoObra>("smart-obra-fotos");
const presencasStorage = new StorageService<PresencaColaborador>("smart-obra-presencas");
const pagamentosColabStorage = new StorageService<PagamentoColaborador>("smart-obra-pagamentos-colab");
const documentosColabStorage = new StorageService<DocumentoColaborador>("smart-obra-documentos-colab");
const materiaisEstoqueStorage = new StorageService<MaterialEstoque>("smart-obra-materiais-estoque");
const movimentacoesStorage = new StorageService<MovimentacaoEstoque>("smart-obra-movimentacoes");
const fornecedoresStorage = new StorageService<Fornecedor>("smart-obra-fornecedores");
const veiculosStorage = new StorageService<Veiculo>("smart-obra-veiculos");
const manutencoesVeiculoStorage = new StorageService<ManutencaoVeiculo>("smart-obra-manutencoes-veiculo");
const abastecimentosVeiculoStorage = new StorageService<AbastecimentoVeiculo>("smart-obra-abastecimentos-veiculo");
const documentosVeiculoStorage = new StorageService<DocumentoVeiculo>("smart-obra-documentos-veiculo");
const orcamentosStorage = new StorageService<Orcamento>("smart-obra-orcamentos");
const clientesStorage = new StorageService<Cliente>("smart-obra-clientes");
const documentosClienteStorage = new StorageService<DocumentoCliente>("smart-obra-documentos-cliente");

function initializeData() {
  obrasStorage.seed(obrasIniciais);
  lancamentosStorage.seed(lancamentosIniciais);
  ordensStorage.seed(ordensServicoIniciais);
  colaboradoresStorage.seed(colaboradoresIniciais);
  colaboradoresObraStorage.seed(colaboradoresObraIniciais);
  materiaisObraStorage.seed(materiaisObraIniciais);
  diarioStorage.seed(diarioObraIniciais);
  timelineStorage.seed(timelineObraIniciais);
  documentosStorage.seed(documentosObraIniciais);
  eventosStorage.seed(eventosCalendarioIniciais);
  fotosStorage.seed(fotosObraIniciais);
  presencasStorage.seed(presencasIniciais);
  pagamentosColabStorage.seed(pagamentosIniciais);
  documentosColabStorage.seed(documentosColaboradorIniciais);
  materiaisEstoqueStorage.seed(materiaisEstoqueIniciais);
  movimentacoesStorage.seed(movimentacoesIniciais);
  fornecedoresStorage.seed(fornecedoresIniciais);
  veiculosStorage.seed(veiculosIniciais);
  manutencoesVeiculoStorage.seed(manutencoesVeiculoIniciais);
  abastecimentosVeiculoStorage.seed(abastecimentosVeiculoIniciais);
  documentosVeiculoStorage.seed(documentosVeiculoIniciais);
  clientesStorage.seed(clientesIniciais);
  documentosClienteStorage.seed(documentosClienteIniciais);
}

export function useObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setObras(obrasStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setObras(obrasStorage.getAll());
  }, []);

  const createObra = useCallback((obra: Omit<Obra, "id" | "criadoEm">) => {
    const newObra: Obra = { ...obra, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    obrasStorage.create(newObra);
    refresh();
    return newObra;
  }, [refresh]);

  const updateObra = useCallback((id: string, updates: Partial<Obra>) => {
    obrasStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteObra = useCallback((id: string) => {
    obrasStorage.delete(id);
    refresh();
  }, [refresh]);

  const deleteObraCascade = useCallback((id: string) => {
    // Delete obra
    obrasStorage.delete(id);
    
    // Delete from storage instances
    const storages = [
      lancamentosStorage, ordensStorage, colaboradoresObraStorage,
      materiaisObraStorage, diarioStorage, timelineStorage,
      documentosStorage, fotosStorage
    ];
    storages.forEach((storage) => {
      const all = storage.getAll();
      all.filter((item: any) => item.obraId === id).forEach((item: any) => storage.delete(item.id));
    });

    // Delete from inline localStorage keys
    const inlineKeys = [
      "smart-obra-compras", "smart-obra-centro-custos", "smart-obra-cronograma",
      "smart-obra-documents", "smart-obra-galeria", "smart-obra-orcado-realizado"
    ];
    inlineKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) {
            const filtered = data.filter((item: any) => item.obraId !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch {}
    });

    // Also delete orcamentos linked to this obra
    const allOrcamentos = orcamentosStorage.getAll();
    allOrcamentos.filter((o: any) => o.obraId === id).forEach((o: any) => orcamentosStorage.delete(o.id));
    
    refresh();
  }, [refresh]);

  return { obras, loading, createObra, updateObra, deleteObra, deleteObraCascade, refresh };
}

export function useLancamentos(obraId?: string) {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = lancamentosStorage.getAll();
    setLancamentos(obraId ? all.filter((l) => l.obraId === obraId) : all);
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    const all = lancamentosStorage.getAll();
    setLancamentos(obraId ? all.filter((l) => l.obraId === obraId) : all);
  }, [obraId]);

  const createLancamento = useCallback((lancamento: Omit<LancamentoFinanceiro, "id" | "criadoEm">) => {
    const newItem: LancamentoFinanceiro = { ...lancamento, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    lancamentosStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateLancamento = useCallback((id: string, updates: Partial<LancamentoFinanceiro>) => {
    lancamentosStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteLancamento = useCallback((id: string) => {
    lancamentosStorage.delete(id);
    refresh();
  }, [refresh]);

  return { lancamentos, loading, createLancamento, updateLancamento, deleteLancamento, refresh };
}

export function useOrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setOrdens(ordensStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setOrdens(ordensStorage.getAll());
  }, []);

  const createOrdem = useCallback((ordem: Omit<OrdemServico, "id">) => {
    const newItem: OrdemServico = { ...ordem, id: generateId() };
    ordensStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateOrdem = useCallback((id: string, updates: Partial<OrdemServico>) => {
    ordensStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteOrdem = useCallback((id: string) => {
    ordensStorage.delete(id);
    refresh();
  }, [refresh]);

  return { ordens, loading, createOrdem, updateOrdem, deleteOrdem, refresh };
}

export function useColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setColaboradores(colaboradoresStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setColaboradores(colaboradoresStorage.getAll());
  }, []);

  const createColaborador = useCallback((colab: Omit<Colaborador, "id">) => {
    const newItem: Colaborador = { ...colab, id: generateId() };
    colaboradoresStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateColaborador = useCallback((id: string, updates: Partial<Colaborador>) => {
    colaboradoresStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteColaborador = useCallback((id: string) => {
    colaboradoresStorage.delete(id);
    refresh();
  }, [refresh]);

  return { colaboradores, loading, createColaborador, updateColaborador, deleteColaborador, refresh };
}

export function usePresencas(colaboradorId?: string) {
  const [presencas, setPresencas] = useState<PresencaColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = presencasStorage.getAll();
    setPresencas(colaboradorId ? all.filter((p) => p.colaboradorId === colaboradorId) : all);
    setLoading(false);
  }, [colaboradorId]);

  const refresh = useCallback(() => {
    const all = presencasStorage.getAll();
    setPresencas(colaboradorId ? all.filter((p) => p.colaboradorId === colaboradorId) : all);
  }, [colaboradorId]);

  const createPresenca = useCallback((presenca: Omit<PresencaColaborador, "id">) => {
    const newItem: PresencaColaborador = { ...presenca, id: generateId() };
    presencasStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { presencas, loading, createPresenca, refresh };
}

export function usePagamentosColaborador(colaboradorId?: string) {
  const [pagamentos, setPagamentos] = useState<PagamentoColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = pagamentosColabStorage.getAll();
    setPagamentos(colaboradorId ? all.filter((p) => p.colaboradorId === colaboradorId) : all);
    setLoading(false);
  }, [colaboradorId]);

  const refresh = useCallback(() => {
    const all = pagamentosColabStorage.getAll();
    setPagamentos(colaboradorId ? all.filter((p) => p.colaboradorId === colaboradorId) : all);
  }, [colaboradorId]);

  const createPagamento = useCallback((pagamento: Omit<PagamentoColaborador, "id">) => {
    const newItem: PagamentoColaborador = { ...pagamento, id: generateId() };
    pagamentosColabStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updatePagamento = useCallback((id: string, updates: Partial<PagamentoColaborador>) => {
    pagamentosColabStorage.update(id, updates);
    refresh();
  }, [refresh]);

  return { pagamentos, loading, createPagamento, updatePagamento, refresh };
}

export function useDocumentosColaborador(colaboradorId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoColaborador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = documentosColabStorage.getAll();
    setDocumentos(colaboradorId ? all.filter((d) => d.colaboradorId === colaboradorId) : all);
    setLoading(false);
  }, [colaboradorId]);

  const refresh = useCallback(() => {
    const all = documentosColabStorage.getAll();
    setDocumentos(colaboradorId ? all.filter((d) => d.colaboradorId === colaboradorId) : all);
  }, [colaboradorId]);

  const createDocumento = useCallback((doc: Omit<DocumentoColaborador, "id" | "criadoEm">) => {
    const newItem: DocumentoColaborador = { ...doc, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    documentosColabStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { documentos, loading, createDocumento, refresh };
}

export function useMateriaisEstoque() {
  const [materiais, setMateriais] = useState<MaterialEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setMateriais(materiaisEstoqueStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setMateriais(materiaisEstoqueStorage.getAll());
  }, []);

  const createMaterial = useCallback((material: Omit<MaterialEstoque, "id">) => {
    const newItem: MaterialEstoque = { ...material, id: generateId() };
    materiaisEstoqueStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateMaterial = useCallback((id: string, updates: Partial<MaterialEstoque>) => {
    materiaisEstoqueStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteMaterial = useCallback((id: string) => {
    materiaisEstoqueStorage.delete(id);
    refresh();
  }, [refresh]);

  return { materiais, loading, createMaterial, updateMaterial, deleteMaterial, refresh };
}

export function useMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setMovimentacoes(movimentacoesStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setMovimentacoes(movimentacoesStorage.getAll());
  }, []);

  const createMovimentacao = useCallback((mov: Omit<MovimentacaoEstoque, "id">) => {
    const newItem: MovimentacaoEstoque = { ...mov, id: generateId() };
    movimentacoesStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { movimentacoes, loading, createMovimentacao, refresh };
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setFornecedores(fornecedoresStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setFornecedores(fornecedoresStorage.getAll());
  }, []);

  const createFornecedor = useCallback((forn: Omit<Fornecedor, "id">) => {
    const newItem: Fornecedor = { ...forn, id: generateId() };
    fornecedoresStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateFornecedor = useCallback((id: string, updates: Partial<Fornecedor>) => {
    fornecedoresStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteFornecedor = useCallback((id: string) => {
    fornecedoresStorage.delete(id);
    refresh();
  }, [refresh]);

  return { fornecedores, loading, createFornecedor, updateFornecedor, deleteFornecedor, refresh };
}

export function useColaboradoresObra(obraId: string) {
  const [colaboradores, setColaboradores] = useState<ColaboradorObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setColaboradores(colaboradoresObraStorage.getAll().filter((c) => c.obraId === obraId));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setColaboradores(colaboradoresObraStorage.getAll().filter((c) => c.obraId === obraId));
  }, [obraId]);

  const addColaborador = useCallback((colab: Omit<ColaboradorObra, "id">) => {
    const newItem: ColaboradorObra = { ...colab, id: generateId() };
    colaboradoresObraStorage.create(newItem);
    refresh();
  }, [obraId]);

  const removeColaborador = useCallback((id: string) => {
    colaboradoresObraStorage.delete(id);
    refresh();
  }, [obraId]);

  return { colaboradores, loading, addColaborador, removeColaborador, refresh };
}

export function useMateriaisObra(obraId: string) {
  const [materiais, setMateriais] = useState<MaterialObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setMateriais(materiaisObraStorage.getAll().filter((m) => m.obraId === obraId));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setMateriais(materiaisObraStorage.getAll().filter((m) => m.obraId === obraId));
  }, [obraId]);

  const addMaterial = useCallback((material: Omit<MaterialObra, "id">) => {
    const newItem: MaterialObra = { ...material, id: generateId() };
    materiaisObraStorage.create(newItem);
    refresh();
  }, [obraId]);

  return { materiais, loading, addMaterial, refresh };
}

export function useDiarioObra(obraId: string) {
  const [entradas, setEntradas] = useState<DiarioObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setEntradas(diarioStorage.getAll().filter((d) => d.obraId === obraId).sort((a, b) => b.data.localeCompare(a.data)));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setEntradas(diarioStorage.getAll().filter((d) => d.obraId === obraId).sort((a, b) => b.data.localeCompare(a.data)));
  }, [obraId]);

  const addEntrada = useCallback((entrada: Omit<DiarioObra, "id" | "criadoEm">) => {
    const newItem: DiarioObra = { ...entrada, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    diarioStorage.create(newItem);
    refresh();
  }, [obraId]);

  return { entradas, loading, addEntrada, refresh };
}

export function useTimelineObra(obraId: string) {
  const [eventos, setEventos] = useState<TimelineObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setEventos(timelineStorage.getAll().filter((t) => t.obraId === obraId).sort((a, b) => b.data.localeCompare(a.data)));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setEventos(timelineStorage.getAll().filter((t) => t.obraId === obraId).sort((a, b) => b.data.localeCompare(a.data)));
  }, [obraId]);

  const addEvento = useCallback((evento: Omit<TimelineObra, "id" | "criadoEm">) => {
    const newItem: TimelineObra = { ...evento, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    timelineStorage.create(newItem);
    refresh();
  }, [obraId]);

  return { eventos, loading, addEvento, refresh };
}

export function useDocumentosObra(obraId: string) {
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setDocumentos(documentosStorage.getAll().filter((d) => d.obraId === obraId));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setDocumentos(documentosStorage.getAll().filter((d) => d.obraId === obraId));
  }, [obraId]);

  const addDocumento = useCallback((doc: Omit<DocumentoObra, "id" | "criadoEm">) => {
    const newItem: DocumentoObra = { ...doc, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    documentosStorage.create(newItem);
    refresh();
  }, [obraId]);

  return { documentos, loading, addDocumento, refresh };
}

export function useFotosObra(obraId: string) {
  const [fotos, setFotos] = useState<FotoObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setFotos(fotosStorage.getAll().filter((f) => f.obraId === obraId));
    setLoading(false);
  }, [obraId]);

  const refresh = useCallback(() => {
    setFotos(fotosStorage.getAll().filter((f) => f.obraId === obraId));
  }, [obraId]);

  const addFoto = useCallback((foto: Omit<FotoObra, "id" | "criadoEm">) => {
    const newItem: FotoObra = { ...foto, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    fotosStorage.create(newItem);
    refresh();
  }, [obraId]);

  return { fotos, loading, addFoto, refresh };
}

export function useEventosCalendario() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setEventos(eventosStorage.getAll());
    setLoading(false);
  }, []);

  return { eventos, loading };
}

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setVeiculos(veiculosStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setVeiculos(veiculosStorage.getAll());
  }, []);

  const createVeiculo = useCallback((veiculo: Omit<Veiculo, "id" | "criadoEm">) => {
    const newItem: Veiculo = { ...veiculo, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    veiculosStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateVeiculo = useCallback((id: string, updates: Partial<Veiculo>) => {
    veiculosStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteVeiculo = useCallback((id: string) => {
    veiculosStorage.delete(id);
    refresh();
  }, [refresh]);

  return { veiculos, loading, createVeiculo, updateVeiculo, deleteVeiculo, refresh };
}

export function useManutencoesVeiculo(veiculoId?: string) {
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = manutencoesVeiculoStorage.getAll();
    setManutencoes(veiculoId ? all.filter((m) => m.veiculoId === veiculoId) : all);
    setLoading(false);
  }, [veiculoId]);

  const refresh = useCallback(() => {
    const all = manutencoesVeiculoStorage.getAll();
    setManutencoes(veiculoId ? all.filter((m) => m.veiculoId === veiculoId) : all);
  }, [veiculoId]);

  const createManutencao = useCallback((manutencao: Omit<ManutencaoVeiculo, "id" | "criadoEm">) => {
    const newItem: ManutencaoVeiculo = { ...manutencao, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    manutencoesVeiculoStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { manutencoes, loading, createManutencao, refresh };
}

export function useAbastecimentosVeiculo(veiculoId?: string) {
  const [abastecimentos, setAbastecimentos] = useState<AbastecimentoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = abastecimentosVeiculoStorage.getAll();
    setAbastecimentos(veiculoId ? all.filter((a) => a.veiculoId === veiculoId) : all);
    setLoading(false);
  }, [veiculoId]);

  const refresh = useCallback(() => {
    const all = abastecimentosVeiculoStorage.getAll();
    setAbastecimentos(veiculoId ? all.filter((a) => a.veiculoId === veiculoId) : all);
  }, [veiculoId]);

  const createAbastecimento = useCallback((abastecimento: Omit<AbastecimentoVeiculo, "id" | "criadoEm">) => {
    const newItem: AbastecimentoVeiculo = { ...abastecimento, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    abastecimentosVeiculoStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { abastecimentos, loading, createAbastecimento, refresh };
}

export function useDocumentosVeiculo(veiculoId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = documentosVeiculoStorage.getAll();
    setDocumentos(veiculoId ? all.filter((d) => d.veiculoId === veiculoId) : all);
    setLoading(false);
  }, [veiculoId]);

  const refresh = useCallback(() => {
    const all = documentosVeiculoStorage.getAll();
    setDocumentos(veiculoId ? all.filter((d) => d.veiculoId === veiculoId) : all);
  }, [veiculoId]);

  const createDocumento = useCallback((doc: Omit<DocumentoVeiculo, "id" | "criadoEm">) => {
    const newItem: DocumentoVeiculo = { ...doc, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    documentosVeiculoStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { documentos, loading, createDocumento, refresh };
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    setClientes(clientesStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setClientes(clientesStorage.getAll());
  }, []);

  const createCliente = useCallback((cliente: Omit<Cliente, "id" | "criadoEm">) => {
    const newItem: Cliente = { ...cliente, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    clientesStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateCliente = useCallback((id: string, updates: Partial<Cliente>) => {
    clientesStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteCliente = useCallback((id: string) => {
    clientesStorage.delete(id);
    refresh();
  }, [refresh]);

  return { clientes, loading, createCliente, updateCliente, deleteCliente, refresh };
}

export function useDocumentosCliente(clienteId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const all = documentosClienteStorage.getAll();
    setDocumentos(clienteId ? all.filter((d) => d.clienteId === clienteId) : all);
    setLoading(false);
  }, [clienteId]);

  const refresh = useCallback(() => {
    const all = documentosClienteStorage.getAll();
    setDocumentos(clienteId ? all.filter((d) => d.clienteId === clienteId) : all);
  }, [clienteId]);

  const createDocumento = useCallback((doc: Omit<DocumentoCliente, "id" | "criadoEm">) => {
    const newItem: DocumentoCliente = { ...doc, id: generateId(), criadoEm: new Date().toISOString().split("T")[0] };
    documentosClienteStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  return { documentos, loading, createDocumento, refresh };
}

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrcamentos(orcamentosStorage.getAll());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setOrcamentos(orcamentosStorage.getAll());
  }, []);

  const createOrcamento = useCallback((orcamento: Omit<Orcamento, "id" | "criadoEm"> & { id?: string }) => {
    const newItem: Orcamento = {
      ...orcamento,
      id: orcamento.id || generateId(),
      criadoEm: new Date().toISOString().split("T")[0],
    } as Orcamento;
    orcamentosStorage.create(newItem);
    refresh();
    return newItem;
  }, [refresh]);

  const updateOrcamento = useCallback((id: string, updates: Partial<Orcamento>) => {
    orcamentosStorage.update(id, updates);
    refresh();
  }, [refresh]);

  const deleteOrcamento = useCallback((id: string) => {
    orcamentosStorage.delete(id);
    refresh();
  }, [refresh]);

  return { orcamentos, loading, createOrcamento, updateOrcamento, deleteOrcamento, refresh };
}
