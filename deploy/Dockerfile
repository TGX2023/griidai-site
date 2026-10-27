FROM node:22-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

WORKDIR /app

COPY --chown=node:node server.cjs ./server.cjs
COPY --chown=node:node scripts/ ./scripts/
COPY --chown=node:node dist/ ./dist/

USER node
EXPOSE 8080

CMD ["node", "server.cjs"]
