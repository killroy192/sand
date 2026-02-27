# OpenClaw multi-worker behind nginx

Run multiple OpenClaw gateways (workers) in separate containers behind one nginx. Each worker has its own port, config, and state. Login is at the proxy (HTTP Basic Auth); OpenClaw uses trusted-proxy auth.

## Setup

### 1. Env files

**Nginx (shared):**

```bash
cp nginx.env.example nginx.env
# Edit nginx.env: set PROXY_BASIC_AUTH_USER and PROXY_BASIC_AUTH_PASS
```

**Per worker:**

```bash
cp agents/worker_0/.env.example agents/worker_0/.env
cp agents/worker_1/.env.example agents/worker_1/.env
```

Edit each `.env`:

- **Required:** `ANTHROPIC_API_KEY` (or your provider), `OPENCLAW_AUTH_CHOICE`, `OPENCLAW_TRUSTED_PROXY_ALLOW_USERS` (must include the nginx username, e.g. `admin`).
- **worker_0:** `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS` should include `http://localhost:18789`, `http://127.0.0.1:18789`.
- **worker_1:** add `http://localhost:18790`, `http://127.0.0.1:18790` to `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS`.

### 2. Worker config (optional)

Each worker has its own `config.js` (and optional `config.example.js`). The image uses `core/setup.js` to merge env-driven settings (trusted-proxy, allowed origins, etc.) into OpenClaw’s config on every start. Customize per worker:

- `agents/worker_0/config.js`
- `agents/worker_1/config.js`

### 3. Build and run

```bash
docker compose up --build
```

First run: each worker runs onboarding (creates `agents/<name>/files/.openclaw/openclaw.json`), then `config.js` applies proxy/origin settings.

## Access

| Port   | Worker   | URL                     |
|--------|----------|-------------------------|
| 18789  | worker_0 | http://localhost:18789  |
| 18790  | worker_1 | http://localhost:18790  |

Sign in with `PROXY_BASIC_AUTH_USER` / `PROXY_BASIC_AUTH_PASS` from `nginx.env`. On first connect the Control UI may ask for device pairing; approve from the host:

```bash
docker compose exec operator-worker_0 npx openclaw devices list
docker compose exec operator-worker_0 npx openclaw devices approve <requestId>
```

(Use `operator-worker_1` for worker_1.)

## Layout

- **nginx** – One container; listens on 80 (→ worker_0) and 81 (→ worker_1), published as 18789 and 18790. Resolves worker hostnames at request time so it can start before workers.
- **worker_0 / worker_1** – OpenClaw gateway per container; `OPENCLAW_PROXY_HOST=nginx` so trusted-proxy IP is resolved at startup. State and config live under `agents/<name>/files/`.

## Adding another worker

1. Add a `worker_2` service in `docker-compose.yml` (same pattern as worker_1: env from `agents/worker_2/.env`, volumes for `agents/worker_2/files` and `agents/worker_2/config.js`, `OPENCLAW_PROXY_HOST=nginx`, `OPENCLAW_DISABLE_BONJOUR=1`).
2. In `nginx/nginx.conf`, add a `server { listen 82; ... }` block proxying to `worker_2:18789`, and in `docker-compose.yml` add `"18791:82"` under nginx `ports`.
3. Create `agents/worker_2/.env` (from worker_0’s example) and `agents/worker_2/config.js`, and include `http://localhost:18791` in that worker’s `OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS`.

## Notes

- Onboarding runs automatically when a worker’s config file is missing.
- Only nginx is exposed to the host; workers are not.
- Trusted-proxy: nginx forwards `X-Forwarded-User`; OpenClaw allows only users in `OPENCLAW_TRUSTED_PROXY_ALLOW_USERS` from the proxy IP.
- Bonjour is disabled in workers (`OPENCLAW_DISABLE_BONJOUR=1`) to avoid name conflicts.
