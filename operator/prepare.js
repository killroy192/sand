const fs = require("node:fs");

const trim = (s) => s?.trim();
const ENV_SEPARATOR = ",";

const readEnvs = () => {
  const envs = {
    configFile: process.env.OPENCLAW_CONFIG_PATH,
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

const {
  configFile,
  bind,
  proxies,
  allowUsers,
  allowedOrigins,
  browserEnabled,
} = readEnvs();

if (!fs.existsSync(configFile)) {
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
