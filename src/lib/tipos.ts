export type CoresMarca = {
  primaria: string;
  secundaria: string;
  destaque: string;
  fundo: string;
  texto: string;
};

export type FontesMarca = {
  /** Nome de uma fonte do Google Fonts, ex.: "Montserrat" */
  titulo: string;
  corpo: string;
};

export type Cliente = {
  id: string;
  nome: string;
  segmento: string;
  regiao: string;
  instagram: string;
  /** Como a marca fala: tom, palavras que usa e evita, grafias fixas. */
  guiaVoz: string;
  /** Pilares editoriais, ex.: ["Dicas de saúde", "Bastidores", "Promoções"] */
  pilares: string[];
  cores: CoresMarca;
  fontes: FontesMarca;
  logoUrl: string | null;
  criadoEm: string;
};

export type FonteDaPauta = { titulo: string; url: string };

export type StatusPauta = "sugerida" | "aprovada" | "descartada";

export type Pauta = {
  id: string;
  clienteId: string;
  titulo: string;
  angulo: string;
  pilar: string;
  formatoSugerido: string;
  porQueAgora: string;
  fontes: FonteDaPauta[];
  status: StatusPauta;
  criadaEm: string;
};

export const MODELOS = ["destaque", "foto", "citacao"] as const;
export type Modelo = (typeof MODELOS)[number];

export const FORMATOS = ["quadrado", "retrato", "story"] as const;
export type Formato = (typeof FORMATOS)[number];

export type TextoArte = {
  titulo: string;
  subtitulo: string;
  chamada: string;
  imagemUrl: string | null;
};

export type StatusPost = "rascunho" | "aprovado";

export type Post = {
  id: string;
  clienteId: string;
  pautaId: string | null;
  tema: string;
  legenda: string;
  hashtags: string[];
  arte: TextoArte;
  modelo: Modelo;
  formato: Formato;
  status: StatusPost;
  criadoEm: string;
  atualizadoEm: string;
};
