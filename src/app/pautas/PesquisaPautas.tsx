"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enviarJson } from "@/components/enviarJson";

type OpcaoCliente = { id: string; nome: string };

export default function PesquisaPautas({ clientes, clienteInicial }: { clientes: OpcaoCliente[]; clienteInicial: string }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clienteInicial);
  const [foco, setFoco] = useState("");
  const [periodo, setPeriodo] = useState("próximas duas semanas");
  const [quantidade, setQuantidade] = useState(6);
  const [pesquisando, setPesquisando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setPesquisando(true);
    try {
      await enviarJson("/api/pautas/pesquisar", "POST", { clienteId, foco, periodo, quantidade });
      router.replace(`/pautas?cliente=${clienteId}`);
      router.refresh();
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setPesquisando(false);
    }
  }

  return (
    <form onSubmit={pesquisar} className="cartao pilha">
      <div className="campos-2">
        <div className="campo">
          <label htmlFor="cliente">Cliente</label>
          <select id="cliente" value={clienteId}
            onChange={(e) => { setClienteId(e.target.value); router.replace(`/pautas?cliente=${e.target.value}`); }}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="periodo">Período</label>
          <input id="periodo" type="text" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="quantidade">Quantidade</label>
          <input id="quantidade" type="number" min={1} max={12} value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="foco">Foco <small>— opcional: campanha, data, produto, assunto que o cliente pediu</small></label>
        <textarea id="foco" rows={2} value={foco} onChange={(e) => setFoco(e.target.value)}
          placeholder="Ex.: Outubro Rosa e prevenção; destacar o novo laboratório." />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <div className="linha">
        <button className="botao primario" disabled={pesquisando || !clienteId}>
          {pesquisando ? "Pesquisando na web..." : "Pesquisar pautas"}
        </button>
        {pesquisando && <span className="suave pequeno">Leva de 1 a 3 minutos.</span>}
      </div>
    </form>
  );
}
