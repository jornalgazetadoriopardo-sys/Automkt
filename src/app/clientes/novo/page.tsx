import { clienteEmBranco } from "@/lib/util";
import ClienteForm from "../ClienteForm";

export default function NovoCliente() {
  return (
    <>
      <h1>Novo cliente</h1>
      <p className="subtitulo-pagina">Essas informações alimentam as pautas, os textos e as artes.</p>
      <ClienteForm cliente={clienteEmBranco()} />
    </>
  );
}
