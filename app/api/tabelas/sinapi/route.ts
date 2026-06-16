import { NextRequest, NextResponse } from "next/server";
import { sinapiData } from "@/lib/sinapi-data";

export async function GET(request: NextRequest) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { searchParams } = new URL(request.url);
  const uf = searchParams.get("uf") || "SP";
  const busca = searchParams.get("busca") || "";
  const grupo = searchParams.get("grupo") || "";

  let items = sinapiData;

  if (busca) {
    const buscaLower = busca.toLowerCase();
    items = items.filter(
      (item) =>
        item.codigo.toLowerCase().includes(buscaLower) ||
        item.descricao.toLowerCase().includes(buscaLower)
    );
  }

  if (grupo) {
    items = items.filter((item) => item.grupo === grupo);
  }

  const result = items.map((item) => ({
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    grupo: item.grupo,
    preco: item.precos[uf] || item.precos["SP"],
    mesReferencia: item.mesReferencia,
    fonte: "SINAPI" as const,
  }));

  return NextResponse.json(result);
}
