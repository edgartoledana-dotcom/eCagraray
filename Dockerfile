FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist

RUN npm install --production

EXPOSE 4173
CMD ["node", "dist/server/server.js"]
