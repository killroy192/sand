# OpenClaw Container Bootstrap

This container auto-runs first-time onboarding on startup when no config exists in `./files/state/openclaw.json`.

Set provider/auth via environment variables before running:

```bash
cp .env.example .env
```

Create image:

```bash
docker compose up --build
```

First startup tries:

```bash
npx openclaw onboard --non-interactive --accept-risk --mode local --flow quickstart --install-daemon --daemon-runtime node --skip-skills
```

If daemon install is unsupported in container runtime, startup falls back to non-daemon onboarding and still starts the gateway process.

For browser access from host, keep `OPENCLAW_GATEWAY_BIND=lan` in `.env` (container default). `loopback` only listens inside the container.

When bind is non-loopback, Control UI origin checks are enforced. Defaults in `.env`:

- `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS=http://localhost:18789,http://127.0.0.1:18789`
- `OPENCLAW_CONTROL_UI_ALLOW_HOST_HEADER_FALLBACK=0`

Gateway auth token:

- Set `OPENCLAW_GATEWAY_TOKEN` in `.env` to use a fixed token.
- If left empty, onboarding-generated token from `./files/state/openclaw.json` is used.
- In Control UI, paste the token in Gateway Access on first connect.
