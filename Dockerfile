FROM node:22-bookworm-slim

WORKDIR /app

# Install OpenClaw from package.json using npm install.
COPY package*.json ./
RUN npm install

COPY entrypoint.sh /app/entrypoint.sh
COPY core/ /app/core/
RUN chmod +x /app/entrypoint.sh

# Route OpenClaw and Node runtime files into /app/files.
ENV HOME=/app/files \
    OPENCLAW_HOME=/app/files/openclaw

ENTRYPOINT ["/app/entrypoint.sh"]
