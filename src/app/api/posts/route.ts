import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { gerarTextoPost } from "@/lib/claude";
import { store } from "@/lib/store";
import { FORMATOS, MODELOS, type Post } from "@/lib/tipos";
import { agora, novoId } from "@/lib/util";

export const maxDuration = 120;

// Cria um post a partir de uma pauta aprovada ou de um tema livre,
// já com legenda e texto da arte escritos pelo Claude.
const Pedido = z
  .object({
    clienteId: z.string().optional(),
    pautaId: z.string().optional(),
    tema: z.string().max(2000).default(""),
    modelo: z.enum(MODELOS).default("destaque"),
    formato: z.enum(FORMATOS).default("retrato"),
  })
  .refine((p) => p.pautaId || (p.clienteId && p.tema.trim()), {
    message: "Informe uma pauta ou um cliente e um tema.",
  });

export async function POST(request: Request) {
  try {
    const pedido = Pedido.safeParse(await request.json());
    if (!pedido.success) {
      return NextResponse.json({ erro: pedido.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
    }
    const { modelo, formato } = pedido.data;

    const pauta = pedido.data.pautaId ? await store.obterPauta(pedido.data.pautaId) : null;
    if (pedido.data.pautaId && !pauta) return naoEncontrado("Pauta");

    const cliente = await store.obterCliente(pauta?.clienteId ?? pedido.data.clienteId!);
    if (!cliente) return naoEncontrado("Cliente");

    const tema = pauta?.titulo ?? pedido.data.tema.trim();
    const texto = await gerarTextoPost(cliente, { tema, pauta, modelo, formato });

    const momento = agora();
    const post: Post = {
      id: novoId(),
      clienteId: cliente.id,
      pautaId: pauta?.id ?? null,
      tema,
      legenda: texto.legenda,
      hashtags: texto.hashtags,
      arte: { titulo: texto.titulo, subtitulo: texto.subtitulo, chamada: texto.chamada, imagemUrl: null },
      modelo,
      formato,
      status: "rascunho",
      criadoEm: momento,
      atualizadoEm: momento,
    };
    await store.salvarPost(post);
    if (pauta && pauta.status === "sugerida") {
      await store.salvarPautas([{ ...pauta, status: "aprovada" }]);
    }
    return NextResponse.json({ id: post.id });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
