# Build from the repo root:  docker build -f apps/backend/Dockerfile -t quickhotels-backend .

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml nx.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
# yarn.lock lists every workspace, so each one's package.json must be here for
# the lockfile to match; only the backend's dependencies are installed.
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN yarn workspaces focus @quickhotels/backend
# The backend's build script runs `prisma generate` first.
RUN yarn workspace @quickhotels/backend build
RUN yarn workspaces focus @quickhotels/backend --production

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/backend/package.json /repo/apps/backend/prisma.config.ts ./
COPY --from=build /repo/apps/backend/dist ./dist
# Migrations ship with the image and run at every start, before the server
# (needs DIRECT_URL; does nothing when there is nothing new to apply).
COPY --from=build /repo/apps/backend/prisma ./prisma
COPY --from=build /repo/apps/backend/database ./database
USER node
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node dist/main.js"]
