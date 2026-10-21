"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enviarJson } from "@/components/enviarJson";
import type { Pauta } from "@/lib/tipos";

export default function CartaoPauta({ pauta }: { pauta: Pauta }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"post" | "status" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function criarPost() {
    setErro(null);
    setOcupado("post");
    try {
      const { id } = await enviarJson<{ id: string }>("/api/posts", "POST", { pautaId: pauta.id });
      router.push(`/posts/${id}`);
    } catch (falha) {
      setErro((falha as Error).message);
      setOcupado(null);
    }
  }

  async function mudarStatus(status: Pauta["status"]) {
    setErro(null);
    setOcupado("status");
    try {
      await enviarJson(`/api/pautas/${pauta.id}`, "PATCH", { status });
      router.refresh();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="cartao pilha" style={{ gap: 10, opacity: pauta.status === "descartada" ? 0.6 : 1 }}>
      <div className="linha">
        <span className="etiqueta">{pauta.pilar}</span>
        <span className="etiqueta">{pauta.formatoSugerido}</span>
        {pauta.status !== "sugerida" && <span className={`etiqueta ${pauta.status}`}>{pauta.status}</span>}
      </div>
      <h3>{pauta.titulo}</h3>
      <p style={{ margin: 0 }}>{pauta.angulo}</p>
      <p className="suave pequeno" style={{ margin: 0 }}>
        <strong>Por que agora:</strong> {pauta.porQueAgora}
      </p>
      {pauta.fontes.length > 0 && (
        <details>
          <summary className="pequeno">Fontes ({pauta.fontes.length})</summary>
          <ul className="fontes">
            {pauta.fontes.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer noopener">{f.titulo || f.url}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
      {erro && <p className="erro">{erro}</p>}
      <div className="linha" style={{ marginTop: "auto" }}>
        <button className="botao primario pequeno" onClick={criarPost} disabled={ocupado !== null}>
          {ocupado === "post" ? "Escrevendo o post..." : "Criar post"}
        </button>
        {pauta.status === "descartada" ? (
          <button className="botao pequeno" onClick={() => mudarStatus("sugerida")} disabled={ocupado !== null}>
            Recuperar
          </button>
        ) : (
          <button className="botao pequeno" onClick={() => mudarStatus("descartada")} disabled={ocupado !== null}>
            Descartar
          </button>
        )}
      </div>
    </div>
  );
}
