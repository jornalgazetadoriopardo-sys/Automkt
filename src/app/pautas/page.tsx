import Link from "next/link";
import { store } from "@/lib/store";
import CartaoPauta from "./CartaoPauta";
import PesquisaPautas from "./PesquisaPautas";

export const dynamic = "force-dynamic";

export default async function Pautas({ searchParams }: PageProps<"/pautas">) {
  const { cliente } = await searchParams;
  const clientes = await store.listarClientes();

  if (clientes.length === 0) {
    return (
      <>
        <h1>Pautas</h1>
        <p className="subtitulo-pagina">
          Cadastre um cliente primeiro. <Link href="/clientes/novo">Cadastrar cliente</Link>
        </p>
      </>
    );
  }

  const clienteId = typeof cliente === "string" && clientes.some((c) => c.id === cliente) ? cliente : clientes[0].id;
  const pautas = await store.listarPautas(clienteId);
  const ativas = pautas.filter((p) => p.status !== "descartada");
  const descartadas = pautas.filter((p) => p.status === "descartada");

  return (
    <div className="pilha">
      <div>
        <h1>Pautas</h1>
        <p className="subtitulo-pagina">
          O Claude pesquisa notícias, datas e tendências do momento e sugere pautas para o cliente.
        </p>
      </div>

      <PesquisaPautas key={clienteId} clientes={clientes.map(({ id, nome }) => ({ id, nome }))} clienteInicial={clienteId} />

      {ativas.length === 0 ? (
        <p className="suave">Nenhuma pauta para este cliente ainda.</p>
      ) : (
        <div className="grade">
          {ativas.map((p) => (
            <CartaoPauta key={p.id} pauta={p} />
          ))}
        </div>
      )}

      {descartadas.length > 0 && (
        <details>
          <summary className="suave">Descartadas ({descartadas.length})</summary>
          <div className="grade" style={{ marginTop: 12 }}>
            {descartadas.map((p) => (
              <CartaoPauta key={p.id} pauta={p} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
