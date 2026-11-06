# Build from the repo root:  docker build -f apps/frontend/Dockerfile -t quickhotels-frontend .
# NEXT_PUBLIC_* values are baked into the browser code, so pass them at build time:
#   --build-arg NEXT_PUBLIC_API_URL=https://api.quickhotels247.com
#   --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json yarn.lock .yarnrc.yml nx.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend
RUN yarn install --immutable
RUN yarn nx run @quickhotels/frontend:build
RUN yarn workspaces focus @quickhotels/frontend --production

FROM node:22-alpine
WORKDIR /app/apps/frontend
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/packages /app/packages
COPY --from=build /repo/apps/frontend/package.json /repo/apps/frontend/next.config.ts ./
COPY --from=build /repo/apps/frontend/public ./public
COPY --from=build /repo/apps/frontend/.next ./.next
USER node
EXPOSE 3000
CMD ["node", "/app/node_modules/next/dist/bin/next", "start", "--port", "3000"]
