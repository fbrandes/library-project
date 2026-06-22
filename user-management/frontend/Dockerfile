FROM node:22-alpine AS build

WORKDIR /workspace/user-management/frontend

COPY user-management/frontend/package.json user-management/frontend/pnpm-lock.yaml* ./

RUN corepack enable \
    && pnpm install --frozen-lockfile=false

COPY user-management/frontend/index.html user-management/frontend/tsconfig.json user-management/frontend/tsconfig.app.json user-management/frontend/tsconfig.node.json user-management/frontend/vite.config.ts ./
COPY user-management/frontend/src src
COPY user-management/scripts /workspace/user-management/scripts
COPY api/spec/user-management.json /workspace/api/spec/user-management.json

RUN pnpm build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/user-management/frontend/dist /usr/share/nginx/html

EXPOSE 80
