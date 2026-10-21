import Link from "next/link";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Clientes() {
  const clientes = await store.listarClientes();
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Clientes</h1>
          <p className="subtitulo-pagina">Marca, voz e identidade visual de cada cliente.</p>
        </div>
        <Link href="/clientes/novo" className="botao primario">
          Novo cliente
        </Link>
      </div>
      {clientes.length === 0 ? (
        <p className="suave">Nenhum cliente cadastrado.</p>
      ) : (
        <div className="grade">
          {clientes.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="cartao pilha"
              style={{ textDecoration: "none", color: "inherit" }}>
              <div>
                <h3>{c.nome}</h3>
                <span className="suave pequeno">{[c.segmento, c.regiao].filter(Boolean).join(" · ") || "—"}</span>
              </div>
              <div className="amostras">
                {Object.values(c.cores).map((cor, i) => (
                  <span key={i} style={{ background: cor }} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
