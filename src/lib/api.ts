import "server-only";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ErroClaude } from "./claude";

/** Converte erros em respostas JSON com mensagens que a equipe entende. */
export function respostaDeErro(erro: unknown) {
  console.error(erro);
  if (erro instanceof ErroClaude) {
    return NextResponse.json({ erro: erro.message }, { status: 422 });
  }
  if (erro instanceof Anthropic.AuthenticationError) {
    return NextResponse.json(
      { erro: "A chave do Claude (ANTHROPIC_API_KEY) está ausente ou inválida." },
      { status: 500 },
    );
  }
  if (erro instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { erro: "Muitos pedidos ao Claude ao mesmo tempo. Espere um minuto e tente de novo." },
      { status: 429 },
    );
  }
  if (erro instanceof Anthropic.APIError) {
    return NextResponse.json(
      { erro: `O Claude respondeu com erro (${erro.status}). Tente de novo.` },
      { status: 502 },
    );
  }
  const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
  return NextResponse.json({ erro: mensagem }, { status: 500 });
}

export const naoEncontrado = (o_que: string) =>
  NextResponse.json({ erro: `${o_que} não encontrado(a).` }, { status: 404 });
