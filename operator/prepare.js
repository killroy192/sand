const fs = require("node:fs");

const configFile = process.env.OPENCLAW_CONFIG_PATH || "/app/files/state/openclaw.json";
const bind = (process.env.OPENCLAW_GATEWAY_BIND || "lan").trim();

if (!fs.existsSync(configFile)) {
  process.exit(0);
}

const raw = fs.readFileSync(configFile, "utf8");
const cfg = JSON.parse(raw);
cfg.gateway = cfg.gateway || {};
cfg.gateway.auth = cfg.gateway.auth || {};

const proxiesCsv = (process.env.OPENCLAW_TRUSTED_PROXY_IPS || "172.28.0.2").trim();
const proxies = proxiesCsv.split(",").map((s) => s.trim()).filter(Boolean);
const allowUsersCsv = (process.env.OPENCLAW_TRUSTED_PROXY_ALLOW_USERS || "").trim();
const allowUsers = allowUsersCsv.split(",").map((s) => s.trim()).filter(Boolean);

cfg.gateway.auth.mode = "trusted-proxy";
cfg.gateway.auth.trustedProxy = {
  userHeader: (process.env.OPENCLAW_TRUSTED_PROXY_USER_HEADER || "x-forwarded-user").trim(),
};
if (allowUsers.length > 0) {
  cfg.gateway.auth.trustedProxy.allowUsers = allowUsers;
}
cfg.gateway.trustedProxies = proxies;
cfg.gateway.nodes = cfg.gateway.nodes || {};
cfg.gateway.nodes.browser = cfg.gateway.nodes.browser || {};
cfg.gateway.nodes.browser.mode = "off";

if (cfg.gateway.auth.token) {
  delete cfg.gateway.auth.token;
}

const browserEnabled = (process.env.OPENCLAW_BROWSER_ENABLED || "0").trim();
cfg.browser = cfg.browser || {};
cfg.browser.enabled = browserEnabled === "1" || browserEnabled.toLowerCase() === "true";
if (!cfg.browser.enabled && cfg.browser.defaultProfile) {
  delete cfg.browser.defaultProfile;
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
