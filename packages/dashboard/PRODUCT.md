# Nexus Dashboard

## What it is
A configuration dashboard for the Nexus Discord UI bot. Server administrators log in with Discord OAuth and manage per-server settings: which roles can invoke which commands, which domains are trusted for remote JS definitions, and an audit log of all interactions.

## Who uses it
Discord server administrators and moderators who have the Administrator permission in their server.

## Core surfaces
- /login — Discord OAuth entry point
- /dashboard — guild list (servers the user admins)
- /dashboard/:guildId — server config panel
- /dashboard/:guildId/log — interaction log viewer

## Design direction
Dark, precise, developer-tool aesthetic. Monospace accents. Information-dense without feeling cluttered. The user is technical — don't explain obvious things, don't use marketing language. Think: a polished version of a terminal dashboard.
