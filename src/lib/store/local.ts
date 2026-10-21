import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Cliente, Pauta, Post } from "../tipos";
import type { Arquivos, Store } from "./tipos";

export const PASTA_DADOS = path.join(process.cwd(), "data");
export const PASTA_UPLOADS = path.join(PASTA_DADOS, "uploads");
const ARQUIVO_BANCO = path.join(PASTA_DADOS, "banco.json");

type Banco = { clientes: Cliente[]; pautas: Pauta[]; posts: Post[] };

// Fila simples para que duas gravações seguidas não se atropelem.
let fila: Promise<unknown> = Promise.resolve();

async function ler(): Promise<Banco> {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO_BANCO, "utf8")) as Banco;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "ENOENT") {
      return { clientes: [], pautas: [], posts: [] };
    }
    throw erro;
  }
}

function alterar(fn: (banco: Banco) => void): Promise<void> {
  const tarefa = fila.then(async () => {
    const banco = await ler();
    fn(banco);
    await fs.mkdir(PASTA_DADOS, { recursive: true });
    const temporario = `${ARQUIVO_BANCO}.tmp`;
    await fs.writeFile(temporario, JSON.stringify(banco, null, 2));
    await fs.rename(temporario, ARQUIVO_BANCO);
  });
  fila = tarefa.catch(() => undefined);
  return tarefa;
}

function substituir<T extends { id: string }>(lista: T[], item: T) {
  const i = lista.findIndex((x) => x.id === item.id);
  if (i >= 0) lista[i] = item;
  else lista.push(item);
}

const maisRecentes = <T>(lista: T[], campo: keyof T) =>
  [...lista].sort((a, b) => String(b[campo]).localeCompare(String(a[campo])));

export const storeLocal: Store = {
  async listarClientes() {
    const { clientes } = await ler();
    return [...clientes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },
  async obterCliente(id) {
    return (await ler()).clientes.find((c) => c.id === id) ?? null;
  },
  salvarCliente(cliente) {
    return alterar((b) => substituir(b.clientes, cliente));
  },
  excluirCliente(id) {
    return alterar((b) => {
      b.clientes = b.clientes.filter((c) => c.id !== id);
      b.pautas = b.pautas.filter((p) => p.clienteId !== id);
      b.posts = b.posts.filter((p) => p.clienteId !== id);
    });
  },

  async listarPautas(clienteId) {
    const { pautas } = await ler();
    return maisRecentes(
      pautas.filter((p) => !clienteId || p.clienteId === clienteId),
      "criadaEm",
    );
  },
  async obterPauta(id) {
    return (await ler()).pautas.find((p) => p.id === id) ?? null;
  },
  salvarPautas(pautas) {
    return alterar((b) => pautas.forEach((p) => substituir(b.pautas, p)));
  },

  async listarPosts(clienteId) {
    const { posts } = await ler();
    return maisRecentes(
      posts.filter((p) => !clienteId || p.clienteId === clienteId),
      "atualizadoEm",
    );
  },
  async obterPost(id) {
    return (await ler()).posts.find((p) => p.id === id) ?? null;
  },
  salvarPost(post) {
    return alterar((b) => substituir(b.posts, post));
  },
  excluirPost(id) {
    return alterar((b) => {
      b.posts = b.posts.filter((p) => p.id !== id);
    });
  },
};

export const arquivosLocal: Arquivos = {
  async salvar(dados, extensao) {
    await fs.mkdir(PASTA_UPLOADS, { recursive: true });
    const nome = `${randomUUID()}.${extensao}`;
    await fs.writeFile(path.join(PASTA_UPLOADS, nome), dados);
    return `/api/arquivos/${nome}`;
  },
};
