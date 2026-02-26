#!/usr/bin/env sh
set -eu

mkdir -p \
  /app/files/home \
  /app/files/state \
  /app/files/cache \
  /app/files/config \
  /app/files/data

CONFIG_FILE="${OPENCLAW_CONFIG_PATH:-/app/files/state/openclaw.json}"

if [ ! -f "${CONFIG_FILE}" ]; then
  if [ "${OPENCLAW_BOOTSTRAP:-1}" = "1" ]; then
    if [ -z "${OPENCLAW_AUTH_CHOICE:-}" ]; then
      echo "Missing OPENCLAW_AUTH_CHOICE for first-run onboarding."
      echo "Example: OPENCLAW_AUTH_CHOICE=anthropic-api-key and ANTHROPIC_API_KEY=..."
      exit 1
    fi

    ACCEPT_RISK_ARGS=""
    if [ "${OPENCLAW_ACCEPT_RISK:-1}" = "1" ]; then
      ACCEPT_RISK_ARGS="--accept-risk"
    fi

    ONBOARD_BASE_ARGS="--non-interactive ${ACCEPT_RISK_ARGS} --mode local --flow quickstart --gateway-port ${OPENCLAW_GATEWAY_PORT:-18789} --gateway-bind ${OPENCLAW_GATEWAY_BIND:-lan} --skip-skills --auth-choice ${OPENCLAW_AUTH_CHOICE}"
    ONBOARD_DAEMON_ARGS="${ONBOARD_BASE_ARGS} --install-daemon --daemon-runtime node"

    echo "Running initial OpenClaw onboarding with daemon install..."
    if ! sh -lc "npx openclaw onboard ${ONBOARD_DAEMON_ARGS}"; then
      echo "Daemon install step failed in container environment; continuing with non-daemon onboarding."
      if ! sh -lc "npx openclaw onboard ${ONBOARD_BASE_ARGS}"; then
        if [ -f "${CONFIG_FILE}" ]; then
          echo "Onboarding returned non-zero, but config exists at ${CONFIG_FILE}; continuing startup."
        else
          echo "Onboarding failed and config was not created."
          exit 1
        fi
      fi
    fi
  fi
fi

node <<'EOF'
const fs = require("node:fs");

const configFile = process.env.OPENCLAW_CONFIG_PATH || "/app/files/state/openclaw.json";
const bind = (process.env.OPENCLAW_GATEWAY_BIND || "lan").trim();

if (!fs.existsSync(configFile)) {
  process.exit(0);
}

const raw = fs.readFileSync(configFile, "utf8");
const cfg = JSON.parse(raw);
cfg.gateway = cfg.gateway || {};

const forcedToken = (process.env.OPENCLAW_GATEWAY_TOKEN || "").trim();
if (forcedToken) {
  cfg.gateway.auth = cfg.gateway.auth || {};
  cfg.gateway.auth.mode = "token";
  cfg.gateway.auth.token = forcedToken;
}

if (bind !== "loopback") {
  cfg.gateway.controlUi = cfg.gateway.controlUi || {};

  const fallback = (process.env.OPENCLAW_CONTROL_UI_ALLOW_HOST_HEADER_FALLBACK || "").trim();
  if (fallback === "1" || fallback.toLowerCase() === "true") {
    cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback = true;
  } else {
    const csv = (process.env.OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS || "http://localhost:18789,http://127.0.0.1:18789").trim();
    const origins = csv.split(",").map((s) => s.trim()).filter(Boolean);
    if (origins.length > 0) {
      cfg.gateway.controlUi.allowedOrigins = origins;
    }
    if (cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback === true) {
      delete cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback;
    }
  }
}

fs.writeFileSync(configFile, `${JSON.stringify(cfg, null, 2)}\n`);
EOF

exec npx openclaw gateway run --port "${OPENCLAW_GATEWAY_PORT:-18789}" --bind "${OPENCLAW_GATEWAY_BIND:-lan}"
