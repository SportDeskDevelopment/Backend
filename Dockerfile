FROM node:20.17 AS base

FROM base AS builder

WORKDIR /home/node
COPY package*.json ./

COPY . .
RUN npm ci
RUN npm run build

FROM base AS runtime

ENV NODE_ENV=production

WORKDIR /home/node
COPY package*.json  ./

RUN npm install --production
COPY --from=builder /home/node/prisma ./prisma
COPY --from=builder /home/node/dist ./dist
COPY --from=builder /home/node/build ./build

RUN npx prisma generate

EXPOSE 4321

CMD ["node", "dist/src/main.js"]
