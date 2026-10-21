import "server-only";
import { arquivos } from "./store";

const TIPOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const TAMANHO_MAXIMO = 8 * 1024 * 1024;

/** Valida e guarda uma imagem enviada. SVG fica de fora: pode carregar scripts. */
export async function salvarImagem(arquivo: File): Promise<string> {
  const extensao = TIPOS[arquivo.type];
  if (!extensao) throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error("A imagem passa de 8 MB.");
  const dados = Buffer.from(await arquivo.arrayBuffer());
  return arquivos.salvar(dados, extensao, arquivo.type);
}
