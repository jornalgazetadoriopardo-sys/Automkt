import type { Metadata } from "next";
import Link from "next/link";
import { modo } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automkt",
  description: "Pesquisa de pautas, textos e artes para redes sociais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topo">
          <div className="topo-interno">
            <Link href="/" className="marca">
              Automkt
            </Link>
            <nav className="nav">
              <Link href="/">Painel</Link>
              <Link href="/clientes">Clientes</Link>
              <Link href="/pautas">Pautas</Link>
            </nav>
            <span className="selo" title={modo === "local" ? "Dados salvos na pasta ./data" : "Dados no Supabase"}>
              {modo === "local" ? "Modo local" : "Supabase"}
            </span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
