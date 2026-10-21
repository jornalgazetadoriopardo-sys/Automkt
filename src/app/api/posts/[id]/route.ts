import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { ArteSchema } from "@/lib/esquemas";
import { store } from "@/lib/store";
import { FORMATOS, MODELOS } from "@/lib/tipos";
import { agora } from "@/lib/util";

const Edicao = z.object({
  legenda: z.string().max(5000),
  hashtags: z.array(z.string().max(100)).max(30),
  arte: ArteSchema,
  modelo: z.enum(MODELOS),
  formato: z.enum(FORMATOS),
  status: z.enum(["rascunho", "aprovado"]),
});

export async function PUT(request: Request, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const { id } = await ctx.params;
    const edicao = Edicao.safeParse(await request.json());
    if (!edicao.success) return NextResponse.json({ erro: edicao.error.issues[0]?.message ?? "Dados do post inválidos." }, { status: 400 });
    const post = await store.obterPost(id);
    if (!post) return naoEncontrado("Post");
    const atualizado = { ...post, ...edicao.data, atualizadoEm: agora() };
    await store.salvarPost(atualizado);
    return NextResponse.json({ post: atualizado });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/posts/[id]">) {
  try {
    const { id } = await ctx.params;
    await store.excluirPost(id);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
