import type { Cliente, Pauta, Post } from "../tipos";

/**
 * Onde os dados ficam guardados. Há duas implementações: Supabase (produção)
 * e um arquivo JSON em ./data (para testar sem configurar nada).
 */
export interface Store {
  listarClientes(): Promise<Cliente[]>;
  obterCliente(id: string): Promise<Cliente | null>;
  salvarCliente(cliente: Cliente): Promise<void>;
  excluirCliente(id: string): Promise<void>;

  listarPautas(clienteId?: string): Promise<Pauta[]>;
  obterPauta(id: string): Promise<Pauta | null>;
  salvarPautas(pautas: Pauta[]): Promise<void>;

  listarPosts(clienteId?: string): Promise<Post[]>;
  obterPost(id: string): Promise<Post | null>;
  salvarPost(post: Post): Promise<void>;
  excluirPost(id: string): Promise<void>;
}

/** Guarda arquivos enviados (logos, fotos) e devolve a URL pública. */
export interface Arquivos {
  salvar(dados: Buffer, extensao: string, tipo: string): Promise<string>;
}
