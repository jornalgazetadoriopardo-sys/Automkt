import type { Cliente } from "./tipos";

export const agora = () => new Date().toISOString();

export const novoId = () => crypto.randomUUID();

export const FONTES_SUGERIDAS = [
  "Montserrat",
  "Poppins",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Raleway",
  "Nunito",
  "Oswald",
  "Bebas Neue",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "DM Sans",
  "Archivo",
  "Barlow",
  "Work Sans",
  "Rubik",
];

export function clienteEmBranco(): Cliente {
  return {
    id: "",
    nome: "",
    segmento: "",
    regiao: "",
    instagram: "",
    guiaVoz: "",
    pilares: [],
    cores: {
      primaria: "#1d3557",
      secundaria: "#457b9d",
      destaque: "#f4a261",
      fundo: "#f7f4ef",
      texto: "#1b1b1b",
    },
    fontes: { titulo: "Montserrat", corpo: "Inter" },
    logoUrl: null,
    criadoEm: "",
  };
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
