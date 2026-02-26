# OpenClaw + nginx trusted-proxy

This setup runs OpenClaw behind nginx with login at the proxy layer. OpenClaw is configured to use `gateway.auth.mode=trusted-proxy` only, so token auth is not used.

## Quick start

1. Copy env templates:

```bash
cp openclaw.env.example openclaw.env
cp nginx.env.example nginx.env
```

1. Set at least:

- In `openclaw.env`:
  - `ANTHROPIC_API_KEY` (or your provider key)
  - `OPENCLAW_AUTH_CHOICE` (provider auth flow used during bootstrap)
  - `OPENCLAW_TRUSTED_PROXY_ALLOW_USERS` (must include your proxy username)
- In `nginx.env`:
  - `PROXY_BASIC_AUTH_USER`
  - `PROXY_BASIC_AUTH_PASS`

1. Build and start:

```bash
docker compose up --build
```

This builds both images:

- `openclaw` (Node runtime)
- `nginx` (with `openssl` for startup htpasswd generation)

1. Open `http://localhost:18789` and sign in via nginx basic auth.

## Notes

- OpenClaw onboarding is still automatic on first run.
- OpenClaw is not exposed directly to host; nginx is the only published entrypoint.
- OpenClaw and nginx use separate env files. OpenClaw container does not receive nginx auth secrets.
- Static deployment defaults are pinned in `docker-compose.yml` (bootstrap, gateway bind/port, browser disabled, trusted proxy header/source).
- Trusted proxy list defaults to nginx static container IP `172.28.0.2`.
- Access is granted only through successful nginx login + trusted-proxy checks.
- Browser relay is disabled by default (`OPENCLAW_BROWSER_ENABLED=0`) to avoid token-only chrome relay startup paths.
- Control UI origins remain restricted by:
  - `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS`
  - `OPENCLAW_CONTROL_UI_ALLOW_HOST_HEADER_FALLBACK`
