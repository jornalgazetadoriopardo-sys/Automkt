import Link from "next/link";
import { notFound } from "next/navigation";
import BotaoConfirmar from "@/components/BotaoConfirmar";
import NovoPost from "@/components/NovoPost";
import { store } from "@/lib/store";
import { formatarData } from "@/lib/util";
import ClienteForm from "../ClienteForm";
import { excluirCliente } from "../actions";

export const dynamic = "force-dynamic";

export default async function PaginaCliente({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const cliente = await store.obterCliente(id);
  if (!cliente) notFound();
  const posts = await store.listarPosts(id);

  return (
    <div className="pilha">
      <div className="cabecalho-pagina">
        <div>
          <h1>{cliente.nome}</h1>
          <p className="subtitulo-pagina">{[cliente.segmento, cliente.regiao].filter(Boolean).join(" · ")}</p>
        </div>
        <Link href={`/pautas?cliente=${cliente.id}`} className="botao primario">
          Pesquisar pautas
        </Link>
      </div>

      <div className="cartao">
        <h2>Novo post a partir de um tema</h2>
        <NovoPost clienteId={cliente.id} />
      </div>

      <div className="cartao">
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <p className="suave">Nenhum post deste cliente ainda.</p>
        ) : (
          <div className="lista-posts">
            {posts.map((p) => (
              <Link key={p.id} href={`/posts/${p.id}`}>
                <span>
                  <strong>{p.arte.titulo || p.tema}</strong>
                  <br />
                  <span className="suave pequeno">{formatarData(p.atualizadoEm)}</span>
                </span>
                <span className={`etiqueta ${p.status}`}>{p.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 16 }}>Editar cadastro</h2>
      <ClienteForm cliente={cliente} />

      <form action={excluirCliente} className="cartao linha" style={{ justifyContent: "space-between" }}>
        <input type="hidden" name="id" value={cliente.id} />
        <span className="suave">Excluir o cliente apaga também as pautas e os posts dele.</span>
        <BotaoConfirmar mensagem={`Excluir ${cliente.nome} e todas as pautas e posts?`}>Excluir cliente</BotaoConfirmar>
      </form>
    </div>
  );
}
