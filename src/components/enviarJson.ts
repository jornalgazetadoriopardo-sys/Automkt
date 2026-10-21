/** fetch com JSON que transforma a resposta de erro da API em exceção legível. */
export async function enviarJson<T>(url: string, metodo: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro ?? `Erro ${resposta.status}`);
  return dados as T;
}
