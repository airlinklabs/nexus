# Nexus

Nexus is a Discord bot that lets server administrators build interactive UI components — dialogs, menus, polls, wizards, persistent panels — without writing bot code. A React dashboard manages per-server configuration.

## Prerequisites

- Node.js 20+
- pnpm 9+
- A Discord application (bot token + OAuth2 credentials)
- A Railway account (for the bot)
- A Cloudflare account (for the dashboard)

## Local setup

```bash
git clone https://github.com/airlinklabs/nexus.git
cd nexus
pnpm install
cp .env.example .env
```

Fill in `.env` with your Discord credentials and a random `API_SECRET`. Then register the slash commands and start the bot:

```bash
pnpm deploy:commands
pnpm dev:bot
```

The dashboard runs separately:

```bash
pnpm --filter dashboard dev
```

Visit `http://localhost:5173`.

## Deploying the bot

Connect the repo to Railway. Set the same environment variables from `.env` in Railway's dashboard. The `railway.toml` handles build and start commands. The bot exposes a `/health` endpoint on the API port for uptime checks.

## Deploying the dashboard

Connect the repo to Cloudflare Pages with these settings:

- **Build command**: `cd packages/dashboard && pnpm build`
- **Build output directory**: `packages/dashboard/dist`
- **Root directory**: `/`
- **Environment variable**: `VITE_API_BASE_URL` = your Railway bot URL

After deployment, update the CORS origin in `packages/bot/src/api/server.ts` and the redirect URLs in `packages/bot/src/api/routes/auth.ts` to match your `.pages.dev` URL.

## Writing a definition

Definitions are JavaScript objects (or URLs pointing to them) that describe what the bot sends to Discord.

**Inline definition:**

```javascript
module.exports = {
  meta: {},
  embeds: [{ title: 'Hello!', description: 'Click a button below.', color: 0x5865f2 }],
  components: [[
    { type: 'button', id: 'greet', label: 'Say hi', style: 'primary' },
  ]],
};
```

**URL definition** (host on GitHub Gist or raw content):

```bash
/ui dialog https://raw.githubusercontent.com/you/gist/definition.js
```

**Poll definition:**

```javascript
module.exports = {
  meta: { allowMultipleVotes: false, showPercentages: true },
  embeds: [{ title: 'What should we play?', description: 'Vote below.', color: 0x5865f2 }],
  components: [[
    { type: 'button', id: 'vote:valorant', label: 'Valorant', style: 'secondary' },
    { type: 'button', id: 'vote:minecraft', label: 'Minecraft', style: 'secondary' },
  ]],
};
```

## Permission setup

Use `/ui-config` commands to control who can use which `/ui` subcommands:

- `/ui-config set-roles command:dialog roles:@Moderator` — only users with the Moderator role can run `/ui dialog`
- `/ui-config trust-domain domain:raw.githubusercontent.com` — allow definitions from that domain

The dashboard at `/dashboard/:guildId` provides a visual interface for the same settings.

## Architecture

Nexus is a pnpm monorepo with three packages. `packages/shared` contains TypeScript types used by both the bot and the dashboard — UI component shapes, permission models, API error schemas. `packages/bot` is the Discord bot: it connects to Discord, evaluates user-submitted JavaScript definitions in a sandboxed VM, builds Discord messages from them, and handles all interactions (button clicks, select menus, modals). A Fastify API server runs in the same process, providing OAuth login and a REST API for the dashboard. `packages/dashboard` is a Vite + React single-page app deployed to Cloudflare Pages.

Definitions go through a pipeline: resolve (inline or fetch URL) → evaluate in sandbox → build Discord message components → send → store in SQLite → dispatch interactions back to handlers. The sandbox uses Node.js `vm` with a restricted global set — no `require`, no `process`, no network access. State is stored per-message in SQLite and passed to handlers on each interaction.

Polls extend this with automatic vote tracking: the bot intercepts `vote:` prefixed buttons, manages an in-memory vote tally that persists to the database, and rebuilds the result embed after each vote. Persistent panels bypass the expiry system entirely — they're stored in a dedicated table and restored from the database when the bot restarts.

## Contributing

```bash
pnpm test              # run all tests
pnpm --filter bot build  # type-check the bot
```

Tests use Vitest. Run `pnpm test:watch` during development for auto-rerun on file changes.
