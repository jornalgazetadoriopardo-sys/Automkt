import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import PostEditor from "./PostEditor";

export const dynamic = "force-dynamic";

export default async function PaginaPost({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  const post = await store.obterPost(id);
  if (!post) notFound();
  const cliente = await store.obterCliente(post.clienteId);
  if (!cliente) notFound();
  const pauta = post.pautaId ? await store.obterPauta(post.pautaId) : null;

  return (
    <>
      <p className="suave pequeno" style={{ margin: "0 0 4px" }}>
        <Link href={`/clientes/${cliente.id}`}>{cliente.nome}</Link>
        {pauta && <> · pauta: {pauta.titulo}</>}
      </p>
      <h1 style={{ marginBottom: 20 }}>{post.tema}</h1>
      <PostEditor postInicial={post} cliente={cliente} />
    </>
  );
}
