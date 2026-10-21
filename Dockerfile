# Imagem oficial do Playwright: já traz o Chromium e as dependências do sistema.
# A versão precisa ser a mesma do playwright-core no package.json.
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# No modo local (sem Supabase) os dados ficam aqui: monte um volume.
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server.js"]
