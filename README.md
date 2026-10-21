# Automkt

Aplicação do estúdio para produzir conteúdo de redes sociais:

1. **Clientes**: cadastro com guia de voz, pilares editoriais, cores, fontes (Google Fonts) e logo.
2. **Pautas**: o Claude pesquisa na web notícias, datas e tendências do momento e sugere pautas com fontes.
3. **Posts**: a partir de uma pauta ou de um tema livre, o Claude escreve a legenda, as hashtags e o texto da arte na voz do cliente.
4. **Artes**: modelos em HTML/CSS preenchidos com a identidade do cliente e exportados como PNG pelo Chromium (Playwright). Não depende do Canva.

## Como rodar no computador

Requisitos: Node.js 22 ou mais novo.

```bash
npm install
npx playwright install chromium   # navegador que gera as artes
cp .env.example .env.local        # e preencha ANTHROPIC_API_KEY
npm run dev
```

Abra http://localhost:3000.

Sem as variáveis do Supabase, o app roda em **modo local** e guarda tudo na pasta `data/`
(banco em `data/banco.json`, imagens em `data/uploads/`). Serve para testar e para uso numa máquina só.

## Usar o Supabase (recomendado em produção)

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode o conteúdo de `supabase/migrations/0001_inicial.sql`.
   Ele cria as tabelas e o bucket público `arquivos` para logos e fotos.
3. Em **Project Settings → API**, copie a URL e a `service_role key` para o `.env.local`:
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

A service role key fica só no servidor; o navegador nunca fala direto com o banco.

## Publicar

O gerador de artes abre um Chromium no servidor, então o jeito mais simples é usar o `Dockerfile`
(baseado na imagem oficial do Playwright) num serviço que rode contêineres: Railway, Render, Fly.io
ou uma VPS. Configure as variáveis de ambiente do `.env.example` no painel do serviço.

**Defina `APP_SENHA`** antes de colocar na internet: sem ela, qualquer pessoa com o endereço
consegue usar o app e gastar créditos da API do Claude.

> Vercel: funciona para as telas e para o Claude, mas o Chromium não cabe nas funções padrão.
> Seria preciso trocar a abertura do navegador em `src/lib/renderizar.ts` pelo pacote
> `@sparticuz/chromium`.

## Onde mexer

| O quê | Arquivo |
|---|---|
| Modelos de arte (layout, tamanhos, formatos) | `src/lib/modelos/index.ts` |
| Instruções do Claude para pautas e textos | `src/lib/claude.ts` |
| Geração do PNG | `src/lib/renderizar.ts` |
| Banco de dados | `src/lib/store/` e `supabase/migrations/` |
| Telas | `src/app/` |

Para criar um modelo novo: escreva uma função `corpoXxx` em `src/lib/modelos/index.ts`
(seguindo `corpoDestaque`), registre em `CORPOS` e `ROTULOS_MODELO`, e adicione o nome em `MODELOS`
(`src/lib/tipos.ts`). Ele aparece no editor e no gerador de PNG automaticamente.

## Uso do Claude

- Modelo: `claude-opus-5-5`, com busca na web para as pautas.
- Uma pesquisa de pautas faz várias buscas e leva de 1 a 3 minutos; gerar um post leva alguns segundos.
- Se o modelo recusar um pedido por engano, a API refaz o pedido automaticamente em outro modelo
  (parâmetro `fallbacks: "default"`).

## Próximos passos sugeridos

- Carrossel (várias artes numa sequência).
- Geração de imagens de fundo por IA para o modelo "Foto".
- Calendário editorial com datas de publicação.
- Link de aprovação para o cliente e histórico de versões.
- Login por pessoa (Supabase Auth) no lugar da senha única.
- Publicação direta no Instagram pela API da Meta.
