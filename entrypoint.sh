#!/usr/bin/env sh
set -eu

mkdir -p "${OPENCLAW_HOME}"

CONFIG_FILE="${OPENCLAW_HOME}/openclaw.json"

if [ ! -f "${CONFIG_FILE}" ]; then
  if [ -z "${OPENCLAW_AUTH_CHOICE:-}" ]; then
    echo "Missing OPENCLAW_AUTH_CHOICE for first-run onboarding."
    echo "Example: OPENCLAW_AUTH_CHOICE=anthropic-api-key and ANTHROPIC_API_KEY=..."
    exit 1
  fi

  ONBOARD_ARGS="--non-interactive --accept-risk --mode local --flow quickstart --gateway-port 18789 --gateway-bind lan --skip-skills --auth-choice ${OPENCLAW_AUTH_CHOICE}"
  # In containers there is no systemd/daemon; skip --install-daemon to avoid a spurious failure.
  if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then
    : # already set for non-daemon
  else
    ONBOARD_ARGS="${ONBOARD_ARGS} --install-daemon --daemon-runtime node"
  fi

  echo "Running initial OpenClaw onboarding..."
  if ! sh -lc "npx openclaw onboard ${ONBOARD_ARGS}"; then
    if [ -f "${CONFIG_FILE}" ]; then
      echo "Onboarding returned non-zero, but config exists at ${CONFIG_FILE}; continuing startup."
    else
      echo "Onboarding failed and config was not created."
      exit 1
    fi
  fi
  echo "Updating config..."
  node /app/config.js
  echo "Config updated."
fi

exec npx openclaw gateway run --port 18789 --bind lan
