import { promises as fs } from "node:fs";
import path from "node:path";
import { PASTA_UPLOADS } from "@/lib/store/local";

const TIPOS: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

// Serve os arquivos enviados no modo local. No Supabase eles vêm do Storage.
export async function GET(_request: Request, ctx: RouteContext<"/api/arquivos/[nome]">) {
  const { nome } = await ctx.params;
  const partes = /^[a-f0-9-]{36}\.(png|jpg|webp)$/.exec(nome);
  if (!partes) return new Response("Arquivo inválido", { status: 400 });
  try {
    const dados = await fs.readFile(path.join(PASTA_UPLOADS, nome));
    return new Response(new Uint8Array(dados), {
      headers: {
        "Content-Type": TIPOS[partes[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Arquivo não encontrado", { status: 404 });
  }
}
