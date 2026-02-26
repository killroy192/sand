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

node /app/prepare.js

exec npx openclaw gateway run --port "${OPENCLAW_GATEWAY_PORT:-18789}" --bind "${OPENCLAW_GATEWAY_BIND:-lan}"
