import { NextResponse } from "next/server";
import { z } from "zod";
import { naoEncontrado, respostaDeErro } from "@/lib/api";
import { ArteSchema } from "@/lib/esquemas";
import { renderizarPng } from "@/lib/renderizar";
import { store } from "@/lib/store";
import { FORMATOS, MODELOS } from "@/lib/tipos";

export const maxDuration = 60;

// Gera o PNG do que está na tela do editor (mesmo antes de salvar).
const Pedido = z.object({
  clienteId: z.string().min(1),
  arte: ArteSchema,
  modelo: z.enum(MODELOS),
  formato: z.enum(FORMATOS),
});

export async function POST(request: Request) {
  try {
    const pedido = Pedido.safeParse(await request.json());
    if (!pedido.success) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
    const cliente = await store.obterCliente(pedido.data.clienteId);
    if (!cliente) return naoEncontrado("Cliente");

    const png = await renderizarPng({
      ...pedido.data,
      cliente,
      baseUrl: new URL(request.url).origin,
    });
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
