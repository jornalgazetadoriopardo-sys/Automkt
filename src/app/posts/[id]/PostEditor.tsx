"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Previa from "@/components/Previa";
import { enviarJson } from "@/components/enviarJson";
import { DIMENSOES, ROTULOS_MODELO, montarHtmlArte } from "@/lib/modelos";
import { FORMATOS, MODELOS, type Cliente, type Formato, type Post } from "@/lib/tipos";

type TextoGerado = { legenda: string; hashtags: string[]; titulo: string; subtitulo: string; chamada: string };

const paraTextoHashtags = (tags: string[]) => tags.map((t) => `#${t}`).join(" ");
const deTextoHashtags = (texto: string) =>
  texto
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);

function nomeDoArquivo(cliente: string, titulo: string, formato: Formato) {
  const limpar = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${limpar(cliente)}-${limpar(titulo).slice(0, 40) || "arte"}-${formato}.png`;
}

export default function PostEditor({ postInicial, cliente }: { postInicial: Post; cliente: Cliente }) {
  const router = useRouter();
  const [post, setPost] = useState(postInicial);
  const [hashtags, setHashtags] = useState(paraTextoHashtags(postInicial.hashtags));
  const [alterado, setAlterado] = useState(false);
  const [instrucoes, setInstrucoes] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  const { largura, altura } = DIMENSOES[post.formato];
  const html = useMemo(
    () =>
      montarHtmlArte({
        cliente,
        arte: post.arte,
        modelo: post.modelo,
        formato: post.formato,
        baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      }),
    [cliente, post.arte, post.modelo, post.formato],
  );

  function mudar(parcial: Partial<Post>) {
    setPost((p) => ({ ...p, ...parcial }));
    setAlterado(true);
  }
  const mudarArte = (parcial: Partial<Post["arte"]>) => mudar({ arte: { ...post.arte, ...parcial } });

  async function executar(rotulo: string, tarefa: () => Promise<string | void>) {
    setMensagem(null);
    setOcupado(rotulo);
    try {
      const ok = await tarefa();
      if (ok) setMensagem({ tipo: "ok", texto: ok });
    } catch (falha) {
      setMensagem({ tipo: "erro", texto: (falha as Error).message });
    } finally {
      setOcupado(null);
    }
  }

  const salvar = (status = post.status) =>
    executar("salvar", async () => {
      const { post: salvo } = await enviarJson<{ post: Post }>(`/api/posts/${post.id}`, "PUT", {
        legenda: post.legenda,
        hashtags: deTextoHashtags(hashtags),
        arte: post.arte,
        modelo: post.modelo,
        formato: post.formato,
        status,
      });
      setPost(salvo);
      setHashtags(paraTextoHashtags(salvo.hashtags));
      setAlterado(false);
      router.refresh();
      return status === "aprovado" && post.status !== "aprovado" ? "Post aprovado." : "Salvo.";
    });

  const reescrever = () =>
    executar("reescrever", async () => {
      const { texto } = await enviarJson<{ texto: TextoGerado }>(`/api/posts/${post.id}/texto`, "POST", {
        modelo: post.modelo,
        formato: post.formato,
        instrucoes,
      });
      mudar({
        legenda: texto.legenda,
        arte: { ...post.arte, titulo: texto.titulo, subtitulo: texto.subtitulo, chamada: texto.chamada },
      });
      setHashtags(paraTextoHashtags(texto.hashtags));
      return "Texto reescrito. Revise e salve.";
    });

  const enviarImagem = (arquivo: File) =>
    executar("imagem", async () => {
      const dados = new FormData();
      dados.append("arquivo", arquivo);
      const resposta = await fetch("/api/upload", { method: "POST", body: dados });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.erro ?? "Falha no envio.");
      mudarArte({ imagemUrl: corpo.url });
    });

  async function baixar(formato: Formato) {
    const resposta = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: cliente.id, arte: post.arte, modelo: post.modelo, formato }),
    });
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      throw new Error(corpo.erro ?? "Não foi possível gerar a arte.");
    }
    const url = URL.createObjectURL(await resposta.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeDoArquivo(cliente.nome, post.arte.titulo, formato);
    link.click();
    URL.revokeObjectURL(url);
  }

  const copiarLegenda = () =>
    executar("copiar", async () => {
      await navigator.clipboard.writeText(`${post.legenda}\n\n${hashtags}`.trim());
      return "Legenda copiada.";
    });

  const excluir = () => {
    if (!confirm("Excluir este post?")) return;
    executar("excluir", async () => {
      await enviarJson(`/api/posts/${post.id}`, "DELETE");
      router.push(`/clientes/${cliente.id}`);
    });
  };

  const travado = ocupado !== null;

  return (
    <div className="editor">
      <div className="pilha">
        <div className="cartao pilha">
          <h2>Arte</h2>
          <div className="campo">
            <label>Modelo</label>
            <div className="opcoes-modelo">
              {MODELOS.map((m) => (
                <button key={m} type="button" aria-pressed={post.modelo === m} onClick={() => mudar({ modelo: m })}>
                  {ROTULOS_MODELO[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="campo">
            <label htmlFor="formato">Formato</label>
            <select id="formato" value={post.formato} onChange={(e) => mudar({ formato: e.target.value as Formato })}>
              {FORMATOS.map((f) => (
                <option key={f} value={f}>{DIMENSOES[f].rotulo}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="titulo">Título</label>
            <textarea id="titulo" rows={2} value={post.arte.titulo} onChange={(e) => mudarArte({ titulo: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="subtitulo">{post.modelo === "citacao" ? "Autor / fonte" : "Subtítulo"}</label>
            <textarea id="subtitulo" rows={2} value={post.arte.subtitulo}
              onChange={(e) => mudarArte({ subtitulo: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="chamada">Chamada <small>— texto do botão, ex.: &quot;Saiba mais&quot;</small></label>
            <input id="chamada" type="text" value={post.arte.chamada} onChange={(e) => mudarArte({ chamada: e.target.value })} />
          </div>
          {post.modelo === "foto" && (
            <div className="campo">
              <label htmlFor="imagem">Foto de fundo</label>
              <input id="imagem" type="file" accept="image/png,image/jpeg,image/webp" disabled={travado}
                onChange={(e) => e.target.files?.[0] && enviarImagem(e.target.files[0])} />
              <input type="url" placeholder="ou cole um endereço https://" value={post.arte.imagemUrl ?? ""}
                onChange={(e) => mudarArte({ imagemUrl: e.target.value.trim() || null })} />
            </div>
          )}
        </div>

        <div className="cartao pilha">
          <h2>Legenda</h2>
          <textarea rows={10} value={post.legenda} onChange={(e) => mudar({ legenda: e.target.value })} />
          <div className="campo">
            <label htmlFor="hashtags">Hashtags</label>
            <input id="hashtags" type="text" value={hashtags}
              onChange={(e) => { setHashtags(e.target.value); setAlterado(true); }} />
          </div>
          <div className="linha">
            <button type="button" className="botao" onClick={copiarLegenda} disabled={travado}>Copiar legenda</button>
          </div>
        </div>

        <div className="cartao pilha">
          <h2>Reescrever com o Claude</h2>
          <textarea rows={2} value={instrucoes} onChange={(e) => setInstrucoes(e.target.value)}
            placeholder="Opcional: o que mudar. Ex.: mais curto, tom mais animado, citar o horário de atendimento." />
          <div>
            <button type="button" className="botao" onClick={reescrever} disabled={travado}>
              {ocupado === "reescrever" ? "Reescrevendo..." : "Reescrever legenda e arte"}
            </button>
          </div>
        </div>
      </div>

      <div className="previa-coluna pilha">
        <Previa html={html} largura={largura} altura={altura} />
        {mensagem && <p className={mensagem.tipo === "erro" ? "erro" : "suave"} style={{ margin: 0 }}>{mensagem.texto}</p>}
        <div className="linha">
          <button type="button" className="botao primario" disabled={travado}
            onClick={() => executar("baixar", () => baixar(post.formato))}>
            {ocupado === "baixar" ? "Gerando..." : "Baixar PNG"}
          </button>
          <button type="button" className="botao" disabled={travado}
            onClick={() => executar("todos", async () => { for (const f of FORMATOS) await baixar(f); })}>
            {ocupado === "todos" ? "Gerando..." : "Baixar os 3 formatos"}
          </button>
        </div>
        <div className="linha">
          <button type="button" className="botao" disabled={travado || !alterado} onClick={() => salvar()}>
            {ocupado === "salvar" ? "Salvando..." : alterado ? "Salvar" : "Salvo"}
          </button>
          {post.status === "aprovado" ? (
            <button type="button" className="botao" disabled={travado} onClick={() => salvar("rascunho")}>
              Voltar para rascunho
            </button>
          ) : (
            <button type="button" className="botao" disabled={travado} onClick={() => salvar("aprovado")}>
              Aprovar
            </button>
          )}
          <button type="button" className="botao perigo" disabled={travado} onClick={excluir}>Excluir</button>
        </div>
        <p className="suave pequeno" style={{ margin: 0 }}>
          A pré-visualização é a mesma página usada para gerar o PNG em {largura}×{altura}px.
        </p>
      </div>
    </div>
  );
}
