import { z } from "zod";

// Imagens só do próprio app (/api/arquivos/...) ou de endereços https.
// Evita que o navegador que gera as artes acesse endereços internos do servidor.
const UrlImagem = z
  .string()
  .max(2000)
  .refine((url) => url.startsWith("/api/arquivos/") || url.startsWith("https://"), {
    message: "A imagem precisa ser enviada pelo app ou ter um endereço https://",
  })
  .nullable();

export const ArteSchema = z.object({
  titulo: z.string().max(400),
  subtitulo: z.string().max(400),
  chamada: z.string().max(80),
  imagemUrl: UrlImagem,
});
