import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { pesquisarPautas } from "@/lib/claude";
import { store } from "@/lib/store";
import type { Pauta } from "@/lib/tipos";
import { agora, novoId } from "@/lib/util";

// Pesquisar na web e analisar leva de 1 a 3 minutos.
export const maxDuration = 300;

const Pedido = z.object({
  clienteId: z.string().min(1),
  foco: z.string().max(1000).default(""),
  periodo: z.string().max(200).default(""),
  quantidade: z.coerce.number().int().min(1).max(12).default(6),
});

export async function POST(request: Request) {
  try {
    const pedido = Pedido.safeParse(await request.json());
    if (!pedido.success) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });

    const cliente = await store.obterCliente(pedido.data.clienteId);
    if (!cliente) return naoEncontrado("Cliente");

    const sugeridas = await pesquisarPautas(cliente, pedido.data);
    const criadaEm = agora();
    const pautas: Pauta[] = sugeridas.map((s) => ({
      ...s,
      fontes: s.fontes.filter((f) => /^https?:\/\//.test(f.url)),
      id: novoId(),
      clienteId: cliente.id,
      status: "sugerida",
      criadaEm,
    }));
    await store.salvarPautas(pautas);
    return NextResponse.json({ pautas });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
