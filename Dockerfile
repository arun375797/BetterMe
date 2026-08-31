FROM node:22-alpine AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/
RUN npm ci --omit=dev --prefix server && npm ci --prefix client

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY client ./client
RUN npm run build --prefix client

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY --from=build /app/client/dist ./client/dist
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
