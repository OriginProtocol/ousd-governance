FROM node:lts as dependencies
WORKDIR /client
COPY package.json ./
RUN yarn install

FROM node:lts as builder
WORKDIR /client
ENV NEXT_PUBLIC_NETWORK_ID 4
COPY ./client .
COPY --from=dependencies /client/node_modules ./node_modules
RUN yarn add @swc/cli @swc/core
RUN yarn build

FROM node:lts as runner
WORKDIR /client
ENV NODE_ENV production
COPY --from=builder /client/prisma ./prisma
COPY --from=builder /client/public ./public
COPY --from=builder /client/.next ./.next
COPY --from=builder /client/node_modules ./node_modules
COPY --from=builder /client/package.json ./package.json

EXPOSE 3000
