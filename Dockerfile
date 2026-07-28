FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache sqlite

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./public

RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/chatfirst.db

CMD ["node", "dist/index.js"]
