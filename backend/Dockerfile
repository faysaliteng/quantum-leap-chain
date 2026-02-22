FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
RUN npm install @nestjs/websockets@^10.4.0 @nestjs/platform-socket.io@^10.4.0 socket.io@^4.7.0 @nestjs/bullmq@^10.2.0 @types/qrcode@^1.5.0 --save --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build
# Debug: verify dist structure
RUN ls -la dist/ && ls -la dist/main* || ls -la dist/src/main* || echo "WARN: main not found in expected paths"

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
