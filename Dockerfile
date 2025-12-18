FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

