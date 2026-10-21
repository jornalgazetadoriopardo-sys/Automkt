import { NextResponse, type NextRequest } from "next/server";

// Proteção simples por senha (HTTP Basic). Ligada quando APP_SENHA existe.
export function proxy(request: NextRequest) {
  const senha = process.env.APP_SENHA;
  if (!senha) return NextResponse.next();

  const cabecalho = request.headers.get("authorization") ?? "";
  if (cabecalho.startsWith("Basic ")) {
    const [, informada] = atob(cabecalho.slice(6)).split(/:(.*)/s);
    if (informada === senha) return NextResponse.next();
  }
  return new NextResponse("Acesso restrito", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Automkt", charset="UTF-8"' },
  });
}

export const config = {
  // /api/arquivos fica aberto: o navegador que gera as artes busca as imagens ali
  // sem senha. Os nomes dos arquivos são aleatórios.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/arquivos).*)"],
};
