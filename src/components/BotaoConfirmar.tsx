"use client";

export default function BotaoConfirmar({ mensagem, children }: { mensagem: string; children: React.ReactNode }) {
  return (
    <button className="botao perigo" onClick={(e) => { if (!confirm(mensagem)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
