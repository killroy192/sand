const fs = require("node:fs");

const trim = (s) => s?.trim();
const ENV_SEPARATOR = ",";

const readEnvs = () => {
  const envs = {
    bind: process.env.OPENCLAW_GATEWAY_BIND,
    proxies: trim(process.env.OPENCLAW_TRUSTED_PROXY_IPS)
      .split(ENV_SEPARATOR)
      .map(trim)
      .filter(Boolean),
    allowUsers: trim(process.env.OPENCLAW_TRUSTED_PROXY_ALLOW_USERS)
      .split(ENV_SEPARATOR)
      .map(trim)
      .filter(Boolean),
    allowedOrigins: trim(process.env.OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS)
      .split(ENV_SEPARATOR)
      .map(trim)
      .filter(Boolean),
    browserEnabled: trim(process.env.OPENCLAW_BROWSER_ENABLED) ?? "0",
  };

  Object.entries(envs).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return envs;
};

const { bind, proxies, allowUsers, allowedOrigins, browserEnabled } =
  readEnvs();
const configFile = "/app/files/state/openclaw.json";
const telegramToken = trim(process.env.TELEGRAM_BOT_TOKEN || "");

if (!fs.existsSync()) {
  process.exit(0);
}

const raw = fs.readFileSync(configFile, "utf8");
const cfg = JSON.parse(raw);
cfg.gateway = cfg.gateway || {};

cfg.gateway.auth = cfg.gateway.auth || {};
cfg.gateway.auth.mode = "trusted-proxy";
cfg.gateway.auth.trustedProxy = {
  userHeader: "x-forwarded-user",
  allowUsers,
};

cfg.gateway.trustedProxies = proxies;
cfg.gateway.nodes = cfg.gateway.nodes || {};
cfg.gateway.nodes.browser = cfg.gateway.nodes.browser || {};
cfg.gateway.nodes.browser.mode = "off";

if (cfg.gateway.auth.token) {
  delete cfg.gateway.auth.token;
}

cfg.browser = cfg.browser || {};
cfg.browser.enabled =
  browserEnabled === "1" || browserEnabled.toLowerCase() === "true";
if (!cfg.browser.enabled && cfg.browser.defaultProfile) {
  delete cfg.browser.defaultProfile;
}

// Telegram channel (optional; only if TELEGRAM_BOT_TOKEN is set)
if (telegramToken) {
  cfg.channels = cfg.channels || {};
  cfg.channels.telegram = cfg.channels.telegram || {};
  cfg.channels.telegram.enabled = true;
  cfg.channels.telegram.botToken = "env:TELEGRAM_BOT_TOKEN";
  if (!cfg.channels.telegram.dmPolicy) {
    cfg.channels.telegram.dmPolicy = "pairing";
  }
}

if (bind !== "loopback") {
  cfg.gateway.controlUi = cfg.gateway.controlUi || {};

  if (allowedOrigins.length > 0) {
    cfg.gateway.controlUi.allowedOrigins = allowedOrigins;
  }
  if (cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback === true) {
    delete cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback;
  }
}

fs.writeFileSync(configFile, `${JSON.stringify(cfg, null, 2)}\n`);
