const fs = require("node:fs");

const trim = (s) => s?.trim();
const ENV_SEPARATOR = ",";

const readEnvs = () => {
  const envs = {
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

const { proxies, allowUsers, allowedOrigins } = readEnvs();
const configFile = "/app/files/state/openclaw.json";

if (!fs.existsSync()) {
  process.exit(0);
}

const raw = fs.readFileSync(configFile, "utf8");
const cfg = JSON.parse(raw);
cfg.gateway = cfg.gateway || {};

cfg.gateway.auth = {
  mode: "trusted-proxy",
  trustedProxy: {
    userHeader: "x-forwarded-user",
    allowUsers,
  },
};

cfg.gateway.trustedProxies = proxies;
cfg.gateway.nodes = {
  browser: {
    mode: "off",
  },
};

cfg.browser = {
  enabled: false,
};

cfg.gateway.controlUi = cfg.gateway.controlUi || {};
cfg.gateway.controlUi.allowedOrigins = allowedOrigins;
delete cfg.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback;

fs.writeFileSync(configFile, `${JSON.stringify(cfg, null, 2)}\n`);
