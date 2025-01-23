FROM node:20.14.0-alpine as env-amd64
# FROM node:20.14.0-alpine as env-arm64
# FROM arm32v7/node:20.14.0 as env-arm

# ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# ENV PRISMA_QUERY_ENGINE_BINARY=/app/prisma/engines/query-engine
# ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/prisma/engines/libquery_engine.so.node
# ENV PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma/engines/schema-engine

# 添加时区环境变量，亚洲，上海
ENV TimeZone=Asia/Shanghai

FROM env-amd64 as base
WORKDIR /app
ARG TARGETARCH

# 使用软连接，并且将时区配置覆盖/etc/timezone
RUN ln -snf /usr/share/zoneinfo/$TimeZone /etc/localtime && echo $TimeZone > /etc/timezone

FROM base as runtime
COPY . .
#RUN [ ! "$TARGETARCH" = "arm" ] && rm -rf ./prisma/engines || true
RUN target=/root/.npm \
    npm install -g pnpm@9.1.1
RUN target=/root/.local/share/pnpm/store \
    pnpm install --production && pnpm prisma generate

FROM runtime as dist
RUN pnpm install && pnpm tsup

FROM base as release

COPY app.js .
COPY package.json .
COPY migpt.js .
COPY env.yml .
COPY frontend/dist ./frontend/dist

COPY --from=dist /app/dist ./dist
COPY --from=dist /app/prisma ./prisma
COPY --from=runtime /app/node_modules ./node_modules

CMD npm run start
