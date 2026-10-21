import Link from "next/link";
import { store } from "@/lib/store";
import { formatarData } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const [clientes, pautas, posts] = await Promise.all([
    store.listarClientes(),
    store.listarPautas(),
    store.listarPosts(),
  ]);
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  const pautasNovas = pautas.filter((p) => p.status === "sugerida").length;

  return (
    <>
      <h1>Painel</h1>
      <p className="subtitulo-pagina">Pesquise pautas, gere os textos e baixe as artes prontas.</p>

      {!process.env.ANTHROPIC_API_KEY && (
        <div className="aviso">
          Falta a chave do Claude. Crie o arquivo <code>.env.local</code> com{" "}
          <code>ANTHROPIC_API_KEY=...</code> para pesquisar pautas e gerar textos.
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="cartao pilha">
          <h2>Comece cadastrando um cliente</h2>
          <p className="suave">
            Cores, fontes, logo e o guia de voz do cliente são usados em todas as pautas, textos e artes.
          </p>
          <div>
            <Link href="/clientes/novo" className="botao primario">
              Cadastrar cliente
            </Link>
          </div>
        </div>
      ) : (
        <div className="pilha">
          <div className="grade">
            <div className="cartao">
              <h3>{clientes.length} cliente(s)</h3>
              <Link href="/clientes">Ver clientes</Link>
            </div>
            <div className="cartao">
              <h3>{pautasNovas} pauta(s) esperando avaliação</h3>
              <Link href="/pautas">Pesquisar e avaliar pautas</Link>
            </div>
            <div className="cartao">
              <h3>{posts.filter((p) => p.status === "rascunho").length} post(s) em rascunho</h3>
              <span className="suave">{posts.filter((p) => p.status === "aprovado").length} aprovado(s)</span>
            </div>
          </div>

          <div className="cartao">
            <h2>Posts recentes</h2>
            {posts.length === 0 ? (
              <p className="suave">
                Nenhum post ainda. Aprove uma pauta ou crie um post a partir de um tema na página do cliente.
              </p>
            ) : (
              <div className="lista-posts">
                {posts.slice(0, 12).map((p) => (
                  <Link key={p.id} href={`/posts/${p.id}`}>
                    <span>
                      <strong>{p.arte.titulo || p.tema}</strong>
                      <br />
                      <span className="suave pequeno">
                        {nomes.get(p.clienteId)} · {formatarData(p.atualizadoEm)}
                      </span>
                    </span>
                    <span className={`etiqueta ${p.status}`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
