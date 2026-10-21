import "server-only";
import { chromium, type Browser } from "playwright-core";
import { DIMENSOES, montarHtmlArte, type EntradaArte } from "./modelos";

// Um navegador só, reaproveitado entre pedidos: abrir o Chromium leva ~1s.
let navegador: Promise<Browser> | null = null;

function obterNavegador() {
  if (!navegador) {
    navegador = chromium
      .launch({
        executablePath: process.env.CHROMIUM_PATH || undefined,
        args: ["--no-sandbox", "--font-render-hinting=none"],
      })
      .catch((erro) => {
        navegador = null;
        throw new Error(
          `Não consegui abrir o Chromium para gerar a arte. Instale com ` +
            `"npx playwright install chromium" ou defina CHROMIUM_PATH. (${erro.message})`,
        );
      });
  }
  return navegador;
}

export async function renderizarPng(entrada: EntradaArte): Promise<Buffer> {
  const { largura, altura } = DIMENSOES[entrada.formato];
  const browser = await obterNavegador();
  const pagina = await browser.newPage({ viewport: { width: largura, height: altura } });
  try {
    await pagina.setContent(montarHtmlArte(entrada), { waitUntil: "networkidle", timeout: 30_000 });
    await pagina.waitForFunction("window.__artePronta === true", undefined, { timeout: 15_000 });
    return await pagina.screenshot({ type: "png" });
  } finally {
    await pagina.close();
  }
}
