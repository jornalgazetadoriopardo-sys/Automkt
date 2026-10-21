import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Cliente, Formato, Modelo, Pauta } from "./tipos";

const MODELO_CLAUDE = "claude-opus-5-5";

// Se o modelo principal recusar um pedido por engano, a API refaz o pedido
// em outro modelo automaticamente, na mesma chamada.
const FALLBACK = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default" as const,
};

export class ErroClaude extends Error {}

let cliente: Anthropic | null = null;

function claude() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new ErroClaude("Falta a chave do Claude. Defina ANTHROPIC_API_KEY no arquivo .env.local.");
  }
  return (cliente ??= new Anthropic());
}

function hoje() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function perfilDoCliente(c: Cliente) {
  return [
    `Cliente: ${c.nome}`,
    c.segmento && `Segmento: ${c.segmento}`,
    c.regiao && `Região de atuação: ${c.regiao}`,
    c.instagram && `Instagram: @${c.instagram.replace(/^@/, "")}`,
    c.pilares.length > 0 && `Pilares editoriais: ${c.pilares.join("; ")}`,
    c.guiaVoz && `Guia de voz da marca:\n${c.guiaVoz}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function verificarRecusa(resposta: Anthropic.Beta.BetaMessage) {
  if (resposta.stop_reason === "refusal") {
    throw new ErroClaude(
      "O Claude não quis atender a este pedido. Reformule o tema ou o foco e tente de novo.",
    );
  }
}

// ---------------------------------------------------------------------------
// Pesquisa de pautas
// ---------------------------------------------------------------------------

const PautasSchema = z.object({
  pautas: z.array(
    z.object({
      titulo: z.string(),
      angulo: z.string(),
      pilar: z.string(),
      formatoSugerido: z.string(),
      porQueAgora: z.string(),
      fontes: z.array(z.object({ titulo: z.string(), url: z.string() })),
    }),
  ),
});

export type PautaSugerida = z.infer<typeof PautasSchema>["pautas"][number];

const FERRAMENTA_PAUTAS = {
  name: "registrar_pautas",
  description:
    "Registra as pautas sugeridas para o cliente. Chame uma única vez, ao final da pesquisa, com todas as pautas.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["pautas"],
    properties: {
      pautas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["titulo", "angulo", "pilar", "formatoSugerido", "porQueAgora", "fontes"],
          properties: {
            titulo: { type: "string", description: "Título curto da pauta, como numa reunião de pauta." },
            angulo: {
              type: "string",
              description: "Como o cliente deve abordar o assunto: a ideia do post em 1 a 3 frases.",
            },
            pilar: { type: "string", description: "Pilar editorial do cliente em que a pauta se encaixa." },
            formatoSugerido: {
              type: "string",
              description: "Formato indicado: post único, carrossel, story, reels.",
            },
            porQueAgora: {
              type: "string",
              description: "Por que publicar agora: notícia, data, tendência ou sazonalidade.",
            },
            fontes: {
              type: "array",
              description: "Páginas consultadas que embasam a pauta. Vazio se for só data comemorativa.",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["titulo", "url"],
                properties: { titulo: { type: "string" }, url: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
};

const SISTEMA_PAUTAS = `Você é estrategista de conteúdo de um estúdio de marketing digital brasileiro.
Sua tarefa é sugerir pautas de redes sociais para um cliente, com base no que está acontecendo agora.

Como trabalhar:
- Pesquise na web antes de sugerir: notícias do segmento e da região do cliente, datas comemorativas e sazonais do período, tendências e dúvidas frequentes do público.
- Prefira fontes brasileiras e recentes. Não invente fatos, números ou datas: tudo o que não for opinião precisa vir de uma fonte consultada.
- Cada pauta precisa servir a um pilar editorial do cliente e fazer sentido para a marca. Descarte assuntos polêmicos, políticos ou trágicos, a menos que o foco pedido os inclua.
- Varie pilares e formatos.
- Escreva em português do Brasil.
- Ao terminar, chame a ferramenta registrar_pautas uma única vez com todas as pautas. Não escreva as pautas fora da ferramenta.`;

export async function pesquisarPautas(
  cliente: Cliente,
  opcoes: { foco: string; periodo: string; quantidade: number },
): Promise<PautaSugerida[]> {
  const pedido = [
    `Hoje é ${hoje()}.`,
    perfilDoCliente(cliente),
    `Período das publicações: ${opcoes.periodo || "próximas duas semanas"}.`,
    opcoes.foco && `Foco pedido pelo estúdio: ${opcoes.foco}`,
    `Sugira ${opcoes.quantidade} pautas.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const mensagens: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: pedido }];

  // A busca na web roda nos servidores da Anthropic. Em pesquisas longas a API
  // pausa o turno (pause_turn) e basta reenviar para continuar.
  for (let rodada = 0; rodada < 6; rodada++) {
    const resposta = await claude().beta.messages.create({
      model: MODELO_CLAUDE,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: "medium" },
      system: SISTEMA_PAUTAS,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 8,
          user_location: { type: "approximate", country: "BR", timezone: "America/Sao_Paulo" },
        },
        FERRAMENTA_PAUTAS,
      ],
      messages: mensagens,
    });
    verificarRecusa(resposta);

    const chamada = resposta.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === FERRAMENTA_PAUTAS.name,
    );
    if (chamada) {
      const lido = PautasSchema.safeParse(chamada.input);
      if (!lido.success) throw new ErroClaude("O Claude devolveu as pautas num formato inesperado.");
      return lido.data.pautas;
    }

    mensagens.push({ role: "assistant", content: resposta.content });
    if (resposta.stop_reason === "max_tokens") {
      throw new ErroClaude("A pesquisa ficou longa demais. Peça menos pautas ou um foco mais específico.");
    }
    if (resposta.stop_reason !== "pause_turn") {
      mensagens.push({
        role: "user",
        content: "Registre agora as pautas usando a ferramenta registrar_pautas.",
      });
    }
  }
  throw new ErroClaude("A pesquisa não terminou. Tente de novo com um foco mais específico.");
}

// ---------------------------------------------------------------------------
// Texto do post (legenda + texto da arte)
// ---------------------------------------------------------------------------

const TextoPostSchema = z.object({
  legenda: z.string(),
  hashtags: z.array(z.string()),
  titulo: z.string(),
  subtitulo: z.string(),
  chamada: z.string(),
});

export type TextoPost = z.infer<typeof TextoPostSchema>;

const ORIENTACAO_MODELO: Record<Modelo, string> = {
  destaque:
    "Arte com título grande. Título: no máximo 8 palavras, forte e direto. Subtítulo: uma frase de apoio, até 18 palavras.",
  foto: "Arte com foto de fundo. Título: no máximo 10 palavras. Subtítulo: até 15 palavras, opcional (pode ficar vazio).",
  citacao:
    "Arte de citação ou dado em evidência. Título: a frase ou o dado, até 25 palavras, sem aspas. Subtítulo: quem disse ou a fonte do dado.",
};

const SISTEMA_TEXTO = `Você é redator(a) de um estúdio de marketing digital brasileiro e escreve posts de Instagram para clientes.

Regras:
- Escreva em português do Brasil, seguindo à risca o guia de voz do cliente (tom, vocabulário, grafias fixas, o que evitar).
- Não invente fatos, números, preços, datas ou promessas. Use apenas o que estiver na pauta, nas fontes ou no perfil do cliente. Se faltar uma informação essencial, escreva de forma que não dependa dela.
- O texto da arte é curto e legível em uma tela de celular. Sem emojis e sem hashtags na arte.
- A chamada é um botão: 2 a 4 palavras (ex.: "Saiba mais", "Agende sua visita"). Pode ficar vazia se não fizer sentido.
- A legenda abre com uma frase que prende a atenção, desenvolve em parágrafos curtos e termina com um convite à ação. Emojis só se o guia de voz permitir.
- Hashtags: de 5 a 10, relevantes para o assunto e a região, sem o símbolo #.`;

export async function gerarTextoPost(
  cliente: Cliente,
  opcoes: { tema: string; pauta: Pauta | null; modelo: Modelo; formato: Formato; instrucoes?: string },
): Promise<TextoPost> {
  const { pauta } = opcoes;
  const pedido = [
    `Hoje é ${hoje()}.`,
    perfilDoCliente(cliente),
    pauta
      ? [
          `Pauta: ${pauta.titulo}`,
          `Ângulo: ${pauta.angulo}`,
          `Pilar: ${pauta.pilar}`,
          `Por que agora: ${pauta.porQueAgora}`,
          pauta.fontes.length > 0 &&
            `Fontes:\n${pauta.fontes.map((f) => `- ${f.titulo} (${f.url})`).join("\n")}`,
        ]
          .filter(Boolean)
          .join("\n")
      : `Tema do post: ${opcoes.tema}`,
    `Formato: ${opcoes.formato}. ${ORIENTACAO_MODELO[opcoes.modelo]}`,
    opcoes.instrucoes && `Pedido de ajuste do estúdio: ${opcoes.instrucoes}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const resposta = await claude().beta.messages.parse({
    model: MODELO_CLAUDE,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: "medium", format: betaZodOutputFormat(TextoPostSchema) },
    system: SISTEMA_TEXTO,
    messages: [{ role: "user", content: pedido }],
  });
  verificarRecusa(resposta);
  if (!resposta.parsed_output) throw new ErroClaude("O Claude devolveu o texto num formato inesperado.");

  const texto = resposta.parsed_output;
  return { ...texto, hashtags: texto.hashtags.map((h) => h.replace(/^#/, "").trim()).filter(Boolean) };
}
