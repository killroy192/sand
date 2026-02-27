import setup from "./core/setup.js";

setup((envs) => ({
  session: {
    dmScope: "per-channel-peer",
  },
  bindings: [
    {
      match: {
        channel: "telegram",
        peer: {
          kind: "group",
          id: "-100548135567",
        },
      },
    },
    {
      match: {
        channel: "telegram",
        peer: {
          kind: "direct",
          id: "64324324324",
        },
      },
    },
  ],
  channels: {
    telegram: {
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
  },
  skills: {
    entries: {
      notion: {
        apiKey:
          "ntn_0000000000000000000000000000000000000000000000000000000000000000",
      },
    },
  },
}));
