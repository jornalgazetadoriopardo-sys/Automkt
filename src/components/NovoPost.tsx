"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIMENSOES, ROTULOS_MODELO } from "@/lib/modelos";
import { FORMATOS, MODELOS, type Formato, type Modelo } from "@/lib/tipos";
import { enviarJson } from "./enviarJson";

export default function NovoPost({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [tema, setTema] = useState("");
  const [modelo, setModelo] = useState<Modelo>("destaque");
  const [formato, setFormato] = useState<Formato>("retrato");
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setGerando(true);
    try {
      const { id } = await enviarJson<{ id: string }>("/api/posts", "POST", { clienteId, tema, modelo, formato });
      router.push(`/posts/${id}`);
    } catch (falha) {
      setErro((falha as Error).message);
      setGerando(false);
    }
  }

  return (
    <form onSubmit={criar} className="pilha">
      <div className="campo">
        <label htmlFor="tema">Tema do post</label>
        <textarea id="tema" rows={3} value={tema} onChange={(e) => setTema(e.target.value)} required
          placeholder="Ex.: Campanha de vacinação contra a gripe começa na segunda; reforçar a importância para idosos." />
      </div>
      <div className="campos-2">
        <div className="campo">
          <label htmlFor="modelo">Modelo de arte</label>
          <select id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value as Modelo)}>
            {MODELOS.map((m) => (
              <option key={m} value={m}>{ROTULOS_MODELO[m]}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="formato">Formato</label>
          <select id="formato" value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
            {FORMATOS.map((f) => (
              <option key={f} value={f}>{DIMENSOES[f].rotulo}</option>
            ))}
          </select>
        </div>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <div>
        <button className="botao primario" disabled={gerando || !tema.trim()}>
          {gerando ? "Escrevendo o post..." : "Criar post com o Claude"}
        </button>
      </div>
    </form>
  );
}
