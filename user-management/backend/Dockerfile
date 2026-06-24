FROM node:22-alpine AS build

WORKDIR /workspace/user-management/backend

COPY user-management/backend/package.json user-management/backend/pnpm-lock.yaml* ./

RUN corepack enable \
    && pnpm install --frozen-lockfile=false

COPY user-management/backend/tsconfig.json user-management/backend/tsconfig.build.json user-management/backend/vitest.config.ts ./
COPY user-management/backend/src src
COPY user-management/scripts /workspace/user-management/scripts
COPY api/spec/user-management.json /workspace/api/spec/user-management.json

RUN pnpm build

FROM node:22-alpine

WORKDIR /workspace/user-management/backend
ENV NODE_ENV=production

COPY user-management/backend/package.json user-management/backend/pnpm-lock.yaml* ./

RUN corepack enable \
    && pnpm install --prod --frozen-lockfile=false

COPY --from=build /workspace/user-management/backend/dist dist

EXPOSE 8080

CMD ["node", "dist/main.js"]
