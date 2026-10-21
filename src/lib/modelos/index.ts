/**
 * Modelos de arte. Cada um é uma página HTML do tamanho exato do post, montada
 * com as cores, fontes e logo do cliente. O mesmo HTML é usado na pré-visualização
 * do editor e na geração do PNG pelo Playwright, então o que se vê é o que sai.
 *
 * Este arquivo roda no navegador e no servidor: não importe nada do Node aqui.
 */
import type { Cliente, Formato, Modelo, TextoArte } from "../tipos";

export const DIMENSOES: Record<Formato, { largura: number; altura: number; rotulo: string }> = {
  quadrado: { largura: 1080, altura: 1080, rotulo: "Quadrado 1:1 (feed)" },
  retrato: { largura: 1080, altura: 1350, rotulo: "Retrato 4:5 (feed)" },
  story: { largura: 1080, altura: 1920, rotulo: "Story / Reels 9:16" },
};

export const ROTULOS_MODELO: Record<Modelo, string> = {
  destaque: "Destaque — título grande sobre a cor da marca",
  foto: "Foto — imagem de fundo com título",
  citacao: "Citação — frase ou dado em evidência",
};

type Marca = Pick<Cliente, "nome" | "instagram" | "cores" | "fontes" | "logoUrl">;

export type EntradaArte = {
  cliente: Marca;
  arte: TextoArte;
  modelo: Modelo;
  formato: Formato;
  /** Endereço do app, para resolver caminhos como /api/arquivos/... */
  baseUrl?: string;
};

function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hexParaRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alfa: number) {
  const [r, g, b] = hexParaRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

/** Branco ou quase-preto, o que for mais legível sobre a cor dada (WCAG). */
export function corDeContraste(hex: string) {
  const [r, g, b] = hexParaRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.4 ? "#111111" : "#ffffff";
}

function linksDeFontes(fontes: Marca["fontes"]) {
  const familias = [...new Set([fontes.titulo, fontes.corpo].filter(Boolean))];
  // Nem toda fonte tem todos os pesos; se o pedido com pesos falhar,
  // o segundo link garante ao menos o peso normal.
  return familias
    .flatMap((f) => {
      const nome = encodeURIComponent(f).replace(/%20/g, "+");
      return [
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${nome}:wght@400;600;700;800&display=block">`,
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${nome}&display=block">`,
      ];
    })
    .join("\n");
}

// Reduz o tamanho da fonte até o texto caber na altura reservada (data-max, em px).
// Mede a caixa do texto, não o desenho das letras: fontes como a Poppins
// ultrapassam a linha e enganariam uma comparação com scrollHeight.
// Ao terminar, avisa o Playwright (window.__artePronta) que pode tirar a "foto".
const SCRIPT_AJUSTE = `
<script>
(function () {
  function ajustar() {
    document.querySelectorAll("[data-ajustar]").forEach(function (el) {
      var tamanho = parseFloat(el.getAttribute("data-ajustar"));
      var minimo = parseFloat(el.getAttribute("data-minimo") || "28");
      var maximo = parseFloat(el.getAttribute("data-max"));
      function naoCabe() {
        return el.getBoundingClientRect().height > maximo + 1 || el.scrollWidth > el.clientWidth + 1;
      }
      el.style.fontSize = tamanho + "px";
      while (naoCabe() && tamanho > minimo) {
        tamanho -= 2;
        el.style.fontSize = tamanho + "px";
      }
      if (naoCabe()) { el.style.maxHeight = maximo + "px"; el.style.overflow = "hidden"; }
    });
    window.__artePronta = true;
  }
  function quandoProntas() {
    var imagens = Array.prototype.slice.call(document.images).map(function (img) {
      return img.complete ? null : new Promise(function (ok) { img.onload = img.onerror = ok; });
    }).filter(Boolean);
    Promise.all([document.fonts.ready].concat(imagens)).then(ajustar);
  }
  if (document.readyState === "complete") quandoProntas();
  else window.addEventListener("load", quandoProntas);
})();
</script>`;

function margens(formato: Formato) {
  // Stories têm interface do Instagram em cima e embaixo; o texto fica longe dela.
  if (formato === "story") return { vertical: 230, lateral: 96 };
  return { vertical: 96, lateral: 96 };
}

function logo(cliente: Marca, altura: number) {
  if (cliente.logoUrl) {
    return `<img class="logo" src="${escapar(cliente.logoUrl)}" alt="" style="max-height:${altura}px">`;
  }
  return `<div class="logo-texto">${escapar(cliente.nome)}</div>`;
}

function instagram(cliente: Marca) {
  const usuario = cliente.instagram.trim().replace(/^@/, "");
  return usuario ? `<span class="arroba">@${escapar(usuario)}</span>` : "";
}

function corpoDestaque({ cliente, arte, formato }: EntradaArte) {
  const { cores } = cliente;
  const sobrePrimaria = corDeContraste(cores.primaria);
  const sobreDestaque = corDeContraste(cores.destaque);
  const m = margens(formato);
  const tituloInicial = formato === "story" ? 140 : 124;
  // Altura livre entre o logo e o rodapé.
  const meio = DIMENSOES[formato].altura - 2 * m.vertical - 280;
  return {
    css: `
      body { background: ${cores.primaria}; color: ${sobrePrimaria}; }
      .circulo { position: absolute; width: 760px; height: 760px; border-radius: 50%;
        background: ${cores.secundaria}; opacity: .55; top: -260px; right: -300px; }
      .faixa { position: absolute; left: 0; bottom: 0; width: 100%; height: 22px; background: ${cores.destaque}; }
      .conteudo { position: absolute; inset: ${m.vertical}px ${m.lateral}px; display: flex; flex-direction: column; }
      .meio { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 36px; min-height: 0; }
      .titulo { font-family: var(--fonte-titulo); font-weight: 800; line-height: 1.02;
        letter-spacing: -0.02em; }
      .subtitulo { font-family: var(--fonte-corpo); font-size: 44px; line-height: 1.3; opacity: .92; }
      .rodape { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
      .chamada { background: ${cores.destaque}; color: ${sobreDestaque}; font-family: var(--fonte-corpo);
        font-weight: 700; font-size: 38px; padding: 22px 40px; border-radius: 999px; }
      .arroba { font-family: var(--fonte-corpo); font-size: 34px; opacity: .85; }
      .logo-texto { color: ${sobrePrimaria}; }
    `,
    html: `
      <div class="circulo"></div>
      <div class="conteudo">
        <div>${logo(cliente, 120)}</div>
        <div class="meio">
          <div class="titulo" data-ajustar="${tituloInicial}" data-minimo="56" data-max="${Math.round(meio * 0.66)}">${escapar(arte.titulo)}</div>
          ${arte.subtitulo ? `<div class="subtitulo" data-ajustar="44" data-minimo="30" data-max="${Math.round(meio * 0.28)}">${escapar(arte.subtitulo)}</div>` : ""}
        </div>
        <div class="rodape">
          ${arte.chamada ? `<div class="chamada">${escapar(arte.chamada)}</div>` : "<div></div>"}
          ${instagram(cliente)}
        </div>
      </div>
      <div class="faixa"></div>
    `,
  };
}

function corpoFoto({ cliente, arte, formato }: EntradaArte) {
  const { cores } = cliente;
  const sobrePrimaria = corDeContraste(cores.primaria);
  const sobreDestaque = corDeContraste(cores.destaque);
  const m = margens(formato);
  const fundo = arte.imagemUrl
    ? `url("${escapar(arte.imagemUrl)}") center / cover no-repeat`
    : `linear-gradient(135deg, ${cores.secundaria}, ${cores.primaria})`;
  const livre = DIMENSOES[formato].altura - 2 * m.vertical;
  return {
    css: `
      body { background: ${fundo}; color: ${sobrePrimaria}; }
      .veu { position: absolute; inset: 0; background: linear-gradient(to top,
        ${rgba(cores.primaria, 0.96)} 0%, ${rgba(cores.primaria, 0.85)} 30%, ${rgba(cores.primaria, 0)} 68%); }
      .conteudo { position: absolute; inset: ${m.vertical}px ${m.lateral}px; display: flex; flex-direction: column; }
      .topo { flex: 1; }
      .bloco { display: flex; flex-direction: column; gap: 28px; }
      .marcador { width: 120px; height: 14px; background: ${cores.destaque}; border-radius: 8px; }
      .titulo { font-family: var(--fonte-titulo); font-weight: 800; line-height: 1.05;
        letter-spacing: -0.015em; }
      .subtitulo { font-family: var(--fonte-corpo); font-size: 40px; line-height: 1.3; opacity: .95; }
      .rodape { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
      .chamada { color: ${sobreDestaque}; background: ${cores.destaque}; font-family: var(--fonte-corpo);
        font-weight: 700; font-size: 34px; padding: 18px 34px; border-radius: 14px; }
      .arroba { font-family: var(--fonte-corpo); font-size: 32px; opacity: .9; }
      .logo { filter: drop-shadow(0 4px 18px rgba(0,0,0,.35)); }
      .logo-texto { color: #fff; text-shadow: 0 4px 18px rgba(0,0,0,.45); }
    `,
    html: `
      <div class="veu"></div>
      <div class="conteudo">
        <div class="topo">${logo(cliente, 110)}</div>
        <div class="bloco">
          <div class="marcador"></div>
          <div class="titulo" data-ajustar="${formato === "story" ? 112 : 104}" data-minimo="48" data-max="${Math.round(livre * 0.36)}">${escapar(arte.titulo)}</div>
          ${arte.subtitulo ? `<div class="subtitulo" data-ajustar="40" data-minimo="28" data-max="${Math.round(livre * 0.16)}">${escapar(arte.subtitulo)}</div>` : ""}
          <div class="rodape">
            ${arte.chamada ? `<div class="chamada">${escapar(arte.chamada)}</div>` : "<div></div>"}
            ${instagram(cliente)}
          </div>
        </div>
      </div>
    `,
  };
}

function corpoCitacao({ cliente, arte, formato }: EntradaArte) {
  const { cores } = cliente;
  const sobrePrimaria = corDeContraste(cores.primaria);
  const m = margens(formato);
  const alturaBarra = formato === "story" ? 360 : 190;
  const livre = DIMENSOES[formato].altura - m.vertical - (alturaBarra + 60) - 120 - 60;
  return {
    css: `
      body { background: ${cores.fundo}; color: ${cores.texto}; }
      .conteudo { position: absolute; top: ${m.vertical}px; left: ${m.lateral}px; right: ${m.lateral}px;
        bottom: ${alturaBarra + 60}px; display: flex; flex-direction: column; justify-content: center; gap: 30px; }
      .aspas { font-family: Georgia, serif; font-size: 260px; line-height: .6; height: 120px; color: ${cores.destaque}; }
      .titulo { font-family: var(--fonte-titulo); font-weight: 700; line-height: 1.15; }
      .subtitulo { font-family: var(--fonte-corpo); font-size: 40px; color: ${cores.primaria}; font-weight: 600; }
      .barra { position: absolute; left: 0; right: 0; bottom: 0; height: ${alturaBarra}px; background: ${cores.primaria};
        color: ${sobrePrimaria}; display: flex; align-items: center; justify-content: space-between;
        padding: ${formato === "story" ? "0 96px 170px" : "0 96px"}; gap: 24px; }
      .chamada { font-family: var(--fonte-corpo); font-weight: 700; font-size: 36px; text-align: right; }
      .logo-texto { color: ${sobrePrimaria}; }
    `,
    html: `
      <div class="conteudo">
        <div class="aspas">“</div>
        <div class="titulo" data-ajustar="${formato === "story" ? 96 : 84}" data-minimo="40" data-max="${Math.round(livre * 0.72)}">${escapar(arte.titulo)}</div>
        ${arte.subtitulo ? `<div class="subtitulo" data-ajustar="40" data-minimo="28" data-max="110">— ${escapar(arte.subtitulo)}</div>` : ""}
      </div>
      <div class="barra">
        <div>${logo(cliente, 100)}</div>
        ${arte.chamada ? `<div class="chamada">${escapar(arte.chamada)}</div>` : instagram(cliente)}
      </div>
    `,
  };
}

const CORPOS: Record<Modelo, (e: EntradaArte) => { css: string; html: string }> = {
  destaque: corpoDestaque,
  foto: corpoFoto,
  citacao: corpoCitacao,
};

export function montarHtmlArte(entrada: EntradaArte) {
  const { largura, altura } = DIMENSOES[entrada.formato];
  const { fontes } = entrada.cliente;
  const corpo = CORPOS[entrada.modelo](entrada);
  const base = entrada.baseUrl ? `<base href="${escapar(entrada.baseUrl)}/">` : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
${base}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${linksDeFontes(fontes)}
<style>
  :root { --fonte-titulo: "${fontes.titulo}", "Helvetica Neue", Arial, sans-serif;
          --fonte-corpo: "${fontes.corpo}", "Helvetica Neue", Arial, sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${largura}px; height: ${altura}px; overflow: hidden; }
  body { position: relative; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
  .logo { display: block; max-width: 420px; object-fit: contain; }
  .logo-texto { font-family: var(--fonte-titulo); font-weight: 800; font-size: 44px; }
  ${corpo.css}
</style>
</head>
<body>
${corpo.html}
${SCRIPT_AJUSTE}
</body>
</html>`;
}
