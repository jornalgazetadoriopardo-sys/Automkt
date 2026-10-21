"use client";

import { useActionState } from "react";
import type { Cliente } from "@/lib/tipos";
import { FONTES_SUGERIDAS } from "@/lib/util";
import { salvarCliente } from "./actions";

const CORES: { campo: string; chave: keyof Cliente["cores"]; rotulo: string }[] = [
  { campo: "corPrimaria", chave: "primaria", rotulo: "Primária" },
  { campo: "corSecundaria", chave: "secundaria", rotulo: "Secundária" },
  { campo: "corDestaque", chave: "destaque", rotulo: "Destaque" },
  { campo: "corFundo", chave: "fundo", rotulo: "Fundo claro" },
  { campo: "corTexto", chave: "texto", rotulo: "Texto" },
];

export default function ClienteForm({ cliente }: { cliente: Cliente }) {
  const [estado, enviar, enviando] = useActionState(salvarCliente, { erro: null });

  return (
    <form action={enviar} className="pilha">
      <input type="hidden" name="id" value={cliente.id} />

      <div className="cartao pilha">
        <h2>Dados do cliente</h2>
        <div className="campos-2">
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" type="text" defaultValue={cliente.nome} required />
          </div>
          <div className="campo">
            <label htmlFor="segmento">Segmento</label>
            <input id="segmento" name="segmento" type="text" defaultValue={cliente.segmento}
              placeholder="Ex.: plano de saúde, escola, restaurante" />
          </div>
          <div className="campo">
            <label htmlFor="regiao">Cidade / região</label>
            <input id="regiao" name="regiao" type="text" defaultValue={cliente.regiao}
              placeholder="Ex.: Rio Pardo - RS" />
          </div>
          <div className="campo">
            <label htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" type="text" defaultValue={cliente.instagram} placeholder="@perfil" />
          </div>
        </div>
      </div>

      <div className="cartao pilha">
        <h2>Voz e conteúdo</h2>
        <div className="campo">
          <label htmlFor="guiaVoz">
            Guia de voz <small>— tom, palavras que a marca usa e evita, grafias fixas, o que nunca dizer</small>
          </label>
          <textarea id="guiaVoz" name="guiaVoz" rows={8} defaultValue={cliente.guiaVoz}
            placeholder={"Ex.: Tom acolhedor e próximo, sem ser informal demais. Tratamos o público por \"você\".\nEvitar: jargão médico, promessas de cura, letras maiúsculas para gritar.\nGrafia fixa: \"Savisa\" (nunca SAVISA)."} />
        </div>
        <div className="campo">
          <label htmlFor="pilares">
            Pilares editoriais <small>— um por linha</small>
          </label>
          <textarea id="pilares" name="pilares" rows={4} defaultValue={cliente.pilares.join("\n")}
            placeholder={"Dicas de saúde\nBastidores e equipe\nServiços e benefícios"} />
        </div>
      </div>

      <div className="cartao pilha">
        <h2>Identidade visual</h2>
        <div className="cores">
          {CORES.map(({ campo, chave, rotulo }) => (
            <div className="campo cor" key={campo}>
              <label htmlFor={campo}>{rotulo}</label>
              <input id={campo} name={campo} type="color" defaultValue={cliente.cores[chave]} />
            </div>
          ))}
        </div>
        <div className="campos-2">
          <div className="campo">
            <label htmlFor="fonteTitulo">Fonte dos títulos <small>— nome no Google Fonts</small></label>
            <input id="fonteTitulo" name="fonteTitulo" type="text" list="fontes" defaultValue={cliente.fontes.titulo} />
          </div>
          <div className="campo">
            <label htmlFor="fonteCorpo">Fonte dos textos</label>
            <input id="fonteCorpo" name="fonteCorpo" type="text" list="fontes" defaultValue={cliente.fontes.corpo} />
          </div>
          <datalist id="fontes">
            {FONTES_SUGERIDAS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div className="campo">
          <label htmlFor="logo">Logo <small>— PNG com fundo transparente fica melhor</small></label>
          {cliente.logoUrl && (
            <div className="linha" style={{ marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cliente.logoUrl} alt="Logo atual" style={{ maxHeight: 60, maxWidth: 200 }} />
              <label className="linha" style={{ fontWeight: 400 }}>
                <input type="checkbox" name="removerLogo" /> remover
              </label>
            </div>
          )}
          <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
      </div>

      {estado.erro && <p className="erro">{estado.erro}</p>}
      <div>
        <button className="botao primario" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
