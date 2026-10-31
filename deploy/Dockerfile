FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app
COPY --chown=node:node cms-server.cjs ./cms-server.cjs
COPY --chown=node:node scripts/ ./scripts/
COPY --chown=node:node shared/ ./shared/
COPY --chown=node:node dist/ ./dist/
USER node
EXPOSE 8080
CMD ["node", "cms-server.cjs"]
