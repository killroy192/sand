import fs from "node:fs";
import merge from "lodash.merge";

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
    configFile: `${process.env.OPENCLAW_HOME}/openclaw.json`,
    openclawHome: process.env.OPENCLAW_HOME,
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

export default function setup(configFunction) {
  const envs = readEnvs();
  if (!fs.existsSync(envs.configFile)) {
    process.exit(0);
  }
  const raw = fs.readFileSync(envs.configFile, "utf8");
  const systemConfig = JSON.parse(raw);
  const userConfig = configFunction(envs);

  // deep merge systemConfig and userConfig
  const cfg = merge(systemConfig, userConfig);

  const { proxies, allowUsers, allowedOrigins, configFile } = envs;

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
}
