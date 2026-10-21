import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { gerarTextoPost } from "@/lib/claude";
import { store } from "@/lib/store";
import { FORMATOS, MODELOS } from "@/lib/tipos";

export const maxDuration = 120;

// Reescreve legenda e texto da arte. Não grava: o editor mostra o resultado
// e a equipe decide se salva.
const Pedido = z.object({
  modelo: z.enum(MODELOS),
  formato: z.enum(FORMATOS),
  instrucoes: z.string().max(1000).default(""),
});

export async function POST(request: Request, ctx: RouteContext<"/api/posts/[id]/texto">) {
  try {
    const { id } = await ctx.params;
    const pedido = Pedido.safeParse(await request.json());
    if (!pedido.success) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });

    const post = await store.obterPost(id);
    if (!post) return naoEncontrado("Post");
    const cliente = await store.obterCliente(post.clienteId);
    if (!cliente) return naoEncontrado("Cliente");
    const pauta = post.pautaId ? await store.obterPauta(post.pautaId) : null;

    const texto = await gerarTextoPost(cliente, { tema: post.tema, pauta, ...pedido.data });
    return NextResponse.json({ texto });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
