"use client";

import { useEffect, useRef, useState } from "react";

/** Mostra o HTML da arte em tamanho real dentro de um iframe, reduzido para caber na coluna. */
export default function Previa({ html, largura, altura }: { html: string; largura: number; altura: number }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.4);
  const [conteudo, setConteudo] = useState(html);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => setEscala(entrada.contentRect.width / largura));
    observador.observe(el);
    return () => observador.disconnect();
  }, [largura]);

  // Espera a pessoa parar de digitar para não recarregar a cada tecla.
  useEffect(() => {
    const espera = setTimeout(() => setConteudo(html), 350);
    return () => clearTimeout(espera);
  }, [html]);

  return (
    <div ref={caixa} className="previa" style={{ width: "100%", maxWidth: largura, height: altura * escala }}>
      <iframe
        title="Pré-visualização da arte"
        srcDoc={conteudo}
        sandbox="allow-scripts"
        width={largura}
        height={altura}
        style={{ transform: `scale(${escala})` }}
      />
    </div>
  );
}
