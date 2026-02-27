import setup from "./core/setup.js";

setup((envs) => ({
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    list: [
      {
        id: "alex",
        name: "alex",
        workspace: `${envs.openclawHome}/workspace-alex`,
      },
      {
        id: "mia",
        name: "mia",
        workspace: `${envs.openclawHome}/workspace-mia`,
      },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: {
        channel: "telegram",
        accountId: "tgalex",
        peer: {
          kind: "group",
          id: "-100548135567",
        },
      },
    },
    {
      agentId: "alex",
      match: {
        channel: "telegram",
        accountId: "tgalex",
        peer: {
          kind: "direct",
          id: "64324324324",
        },
      },
    },
    {
      agentId: "mia",
      match: {
        channel: "telegram",
        accountId: "tgmia",
        peer: {
          kind: "group",
          id: "-100548135567",
        },
      },
    },
  ],
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
      accounts: {
        tgalex: {
          enabled: true,
          dmPolicy: "pairing",
          botToken: "64324324324:AAH-1234567890",
          groups: {
            "-100548135567": {
              requireMention: true,
              groupPolicy: "open",
            },
          },
          groupPolicy: "allowlist",
          streaming: "off",
        },
        tgmia: {
          enabled: true,
          dmPolicy: "pairing",
          botToken: "21334334324:AAH-1234567890",
          groups: {
            "-100548135567": {
              requireMention: true,
              groupPolicy: "open",
            },
          },
          groupPolicy: "allowlist",
          streaming: "off",
        },
      },
      streaming: "off",
    },
  },
}));
