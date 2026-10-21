import { NextResponse } from "next/server";
import { respostaDeErro } from "@/lib/api";
import { salvarImagem } from "@/lib/imagens";

export async function POST(request: Request) {
  try {
    const arquivo = (await request.formData()).get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
    }
    return NextResponse.json({ url: await salvarImagem(arquivo) });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
