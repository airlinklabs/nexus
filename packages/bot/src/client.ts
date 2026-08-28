import {
  Client,
  GatewayIntentBits,
  Partials,
} from 'discord.js';

// Single client instance for the entire process.
// Do not create additional Client instances anywhere in the codebase.
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});
