FROM node:22-bookworm-slim

WORKDIR /app

# Install OpenClaw from package.json using npm install.
COPY package*.json ./
RUN npm install

COPY entrypoint.sh /app/entrypoint.sh
COPY prepare.js /app/prepare.js
RUN chmod +x /app/entrypoint.sh

# Route OpenClaw and Node runtime files into /app/files.
ENV HOME=/app/files/home \
    OPENCLAW_HOME=/app/files/home \
    OPENCLAW_STATE_DIR=/app/files/state \
    XDG_CACHE_HOME=/app/files/cache \
    XDG_CONFIG_HOME=/app/files/config \
    XDG_DATA_HOME=/app/files/data \
    NPM_CONFIG_CACHE=/app/files/cache/npm

ENTRYPOINT ["/app/entrypoint.sh"]
