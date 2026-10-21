import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { store } from "@/lib/store";

const Pedido = z.object({ status: z.enum(["sugerida", "aprovada", "descartada"]) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/pautas/[id]">) {
  try {
    const { id } = await ctx.params;
    const pedido = Pedido.safeParse(await request.json());
    if (!pedido.success) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    const pauta = await store.obterPauta(id);
    if (!pauta) return naoEncontrado("Pauta");
    await store.salvarPautas([{ ...pauta, status: pedido.data.status }]);
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
