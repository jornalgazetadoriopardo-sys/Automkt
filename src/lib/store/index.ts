import "server-only";
import type { Arquivos, Store } from "./tipos";
import { arquivosLocal, storeLocal } from "./local";
import { conectarSupabase, criarArquivosSupabase, criarStoreSupabase } from "./supabase";

function escolher(): { store: Store; arquivos: Arquivos; modo: "supabase" | "local" } {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && chave) {
    const db = conectarSupabase(url, chave);
    return { store: criarStoreSupabase(db), arquivos: criarArquivosSupabase(db), modo: "supabase" };
  }
  return { store: storeLocal, arquivos: arquivosLocal, modo: "local" };
}

export const { store, arquivos, modo } = escolher();
