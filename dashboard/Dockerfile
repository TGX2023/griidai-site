FROM node:22-bookworm-slim
WORKDIR /app/cms
ENV STRAPI_TELEMETRY_DISABLED=true
COPY cms/package.json cms/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY cms ./
COPY shared /app/shared
RUN npm run build
ENV NODE_ENV=production HOST=0.0.0.0 PORT=1337
RUN chown -R node:node /app
USER node
EXPOSE 1337
CMD ["npm", "start"]
