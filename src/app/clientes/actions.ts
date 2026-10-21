"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { salvarImagem } from "@/lib/imagens";
import { store } from "@/lib/store";
import type { Cliente } from "@/lib/tipos";
import { agora, novoId } from "@/lib/util";

export type EstadoFormulario = { erro: string | null };

const texto = (dados: FormData, campo: string) => String(dados.get(campo) ?? "").trim();

function cor(dados: FormData, campo: string, padrao: string) {
  const valor = texto(dados, campo);
  return /^#[0-9a-fA-F]{6}$/.test(valor) ? valor : padrao;
}

export async function salvarCliente(_estado: EstadoFormulario, dados: FormData): Promise<EstadoFormulario> {
  const id = texto(dados, "id");
  const existente = id ? await store.obterCliente(id) : null;

  const nome = texto(dados, "nome");
  if (!nome) return { erro: "Informe o nome do cliente." };

  let logoUrl = existente?.logoUrl ?? null;
  if (dados.get("removerLogo") === "on") logoUrl = null;
  const logo = dados.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await salvarImagem(logo);
    } catch (erro) {
      return { erro: (erro as Error).message };
    }
  }

  const cliente: Cliente = {
    id: existente?.id ?? novoId(),
    nome,
    segmento: texto(dados, "segmento"),
    regiao: texto(dados, "regiao"),
    instagram: texto(dados, "instagram").replace(/^@/, ""),
    guiaVoz: texto(dados, "guiaVoz"),
    pilares: texto(dados, "pilares")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean),
    cores: {
      primaria: cor(dados, "corPrimaria", "#1d3557"),
      secundaria: cor(dados, "corSecundaria", "#457b9d"),
      destaque: cor(dados, "corDestaque", "#f4a261"),
      fundo: cor(dados, "corFundo", "#f7f4ef"),
      texto: cor(dados, "corTexto", "#1b1b1b"),
    },
    fontes: {
      titulo: texto(dados, "fonteTitulo") || "Montserrat",
      corpo: texto(dados, "fonteCorpo") || "Inter",
    },
    logoUrl,
    criadoEm: existente?.criadoEm ?? agora(),
  };

  await store.salvarCliente(cliente);
  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

export async function excluirCliente(dados: FormData) {
  const id = texto(dados, "id");
  if (id) await store.excluirCliente(id);
  revalidatePath("/clientes");
  redirect("/clientes");
}
