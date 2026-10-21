FROM node:24-alpine

WORKDIR /app/auth-service

COPY auth-service/package*.json ./
RUN npm ci --omit=dev

COPY auth-service/src ./src
COPY auth-service/init-db.cjs ./init-db.cjs
COPY proto /app/proto

EXPOSE 50051

CMD ["sh", "-c", "node init-db.cjs && node src/server.js"]