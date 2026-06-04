FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV PORT=4173
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./

EXPOSE 4173
CMD ["node", ".output/server/index.mjs"]
