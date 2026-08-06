FROM node:26-alpine AS build

WORKDIR /workspace

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./frontend/
WORKDIR /workspace/frontend
RUN corepack enable && pnpm install --frozen-lockfile

WORKDIR /workspace
COPY bookinfo/frontend/src ./bookinfo/frontend/src
COPY renting/frontend/src ./renting/frontend/src
COPY user-management/frontend/src ./user-management/frontend/src
COPY frontend ./frontend

WORKDIR /workspace/frontend
RUN pnpm run build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1
