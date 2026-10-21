import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, Pauta, Post } from "../tipos";
import type { Arquivos, Store } from "./tipos";

const BUCKET = "arquivos";

type LinhaCliente = {
  id: string;
  nome: string;
  segmento: string;
  regiao: string;
  instagram: string;
  guia_voz: string;
  pilares: string[];
  cores: Cliente["cores"];
  fontes: Cliente["fontes"];
  logo_url: string | null;
  criado_em: string;
};

type LinhaPauta = {
  id: string;
  cliente_id: string;
  titulo: string;
  angulo: string;
  pilar: string;
  formato_sugerido: string;
  por_que_agora: string;
  fontes: Pauta["fontes"];
  status: Pauta["status"];
  criada_em: string;
};

type LinhaPost = {
  id: string;
  cliente_id: string;
  pauta_id: string | null;
  tema: string;
  legenda: string;
  hashtags: string[];
  arte: Post["arte"];
  modelo: Post["modelo"];
  formato: Post["formato"];
  status: Post["status"];
  criado_em: string;
  atualizado_em: string;
};

const paraCliente = (l: LinhaCliente): Cliente => ({
  id: l.id,
  nome: l.nome,
  segmento: l.segmento,
  regiao: l.regiao,
  instagram: l.instagram,
  guiaVoz: l.guia_voz,
  pilares: l.pilares,
  cores: l.cores,
  fontes: l.fontes,
  logoUrl: l.logo_url,
  criadoEm: l.criado_em,
});

const deCliente = (c: Cliente): LinhaCliente => ({
  id: c.id,
  nome: c.nome,
  segmento: c.segmento,
  regiao: c.regiao,
  instagram: c.instagram,
  guia_voz: c.guiaVoz,
  pilares: c.pilares,
  cores: c.cores,
  fontes: c.fontes,
  logo_url: c.logoUrl,
  criado_em: c.criadoEm,
});

const paraPauta = (l: LinhaPauta): Pauta => ({
  id: l.id,
  clienteId: l.cliente_id,
  titulo: l.titulo,
  angulo: l.angulo,
  pilar: l.pilar,
  formatoSugerido: l.formato_sugerido,
  porQueAgora: l.por_que_agora,
  fontes: l.fontes,
  status: l.status,
  criadaEm: l.criada_em,
});

const dePauta = (p: Pauta): LinhaPauta => ({
  id: p.id,
  cliente_id: p.clienteId,
  titulo: p.titulo,
  angulo: p.angulo,
  pilar: p.pilar,
  formato_sugerido: p.formatoSugerido,
  por_que_agora: p.porQueAgora,
  fontes: p.fontes,
  status: p.status,
  criada_em: p.criadaEm,
});

const paraPost = (l: LinhaPost): Post => ({
  id: l.id,
  clienteId: l.cliente_id,
  pautaId: l.pauta_id,
  tema: l.tema,
  legenda: l.legenda,
  hashtags: l.hashtags,
  arte: l.arte,
  modelo: l.modelo,
  formato: l.formato,
  status: l.status,
  criadoEm: l.criado_em,
  atualizadoEm: l.atualizado_em,
});

const dePost = (p: Post): LinhaPost => ({
  id: p.id,
  cliente_id: p.clienteId,
  pauta_id: p.pautaId,
  tema: p.tema,
  legenda: p.legenda,
  hashtags: p.hashtags,
  arte: p.arte,
  modelo: p.modelo,
  formato: p.formato,
  status: p.status,
  criado_em: p.criadoEm,
  atualizado_em: p.atualizadoEm,
});

function verificar<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

export function criarStoreSupabase(db: SupabaseClient): Store {
  return {
    async listarClientes() {
      const linhas = verificar(await db.from("clientes").select("*").order("nome"));
      return (linhas as LinhaCliente[]).map(paraCliente);
    },
    async obterCliente(id) {
      const linha = verificar(await db.from("clientes").select("*").eq("id", id).maybeSingle());
      return linha ? paraCliente(linha as LinhaCliente) : null;
    },
    async salvarCliente(cliente) {
      verificar(await db.from("clientes").upsert(deCliente(cliente)));
    },
    async excluirCliente(id) {
      verificar(await db.from("clientes").delete().eq("id", id));
    },

    async listarPautas(clienteId) {
      let consulta = db.from("pautas").select("*").order("criada_em", { ascending: false });
      if (clienteId) consulta = consulta.eq("cliente_id", clienteId);
      return (verificar(await consulta) as LinhaPauta[]).map(paraPauta);
    },
    async obterPauta(id) {
      const linha = verificar(await db.from("pautas").select("*").eq("id", id).maybeSingle());
      return linha ? paraPauta(linha as LinhaPauta) : null;
    },
    async salvarPautas(pautas) {
      if (pautas.length === 0) return;
      verificar(await db.from("pautas").upsert(pautas.map(dePauta)));
    },

    async listarPosts(clienteId) {
      let consulta = db.from("posts").select("*").order("atualizado_em", { ascending: false });
      if (clienteId) consulta = consulta.eq("cliente_id", clienteId);
      return (verificar(await consulta) as LinhaPost[]).map(paraPost);
    },
    async obterPost(id) {
      const linha = verificar(await db.from("posts").select("*").eq("id", id).maybeSingle());
      return linha ? paraPost(linha as LinhaPost) : null;
    },
    async salvarPost(post) {
      verificar(await db.from("posts").upsert(dePost(post)));
    },
    async excluirPost(id) {
      verificar(await db.from("posts").delete().eq("id", id));
    },
  };
}

export function criarArquivosSupabase(db: SupabaseClient): Arquivos {
  return {
    async salvar(dados, extensao, tipo) {
      const caminho = `${randomUUID()}.${extensao}`;
      verificar(await db.storage.from(BUCKET).upload(caminho, dados, { contentType: tipo }));
      return db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
    },
  };
}

export function conectarSupabase(url: string, chave: string) {
  return createClient(url, chave, { auth: { persistSession: false } });
}
