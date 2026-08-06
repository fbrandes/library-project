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

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('node:http').get('http://127.0.0.1:8080/users/healthcheck',response=>process.exit(response.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
