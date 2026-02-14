# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Happy Coder is a mobile and web client for Claude Code & Codex with end-to-end encryption. It lets users control AI coding agents from their phone or browser with real-time sync and push notifications.

## Monorepo Structure

Yarn 1.22.22 workspaces monorepo with five packages:

- **happy-app** — React Native + Expo SDK 54 client (iOS, Android, Web, macOS via Tauri)
- **happy-cli** — Node.js CLI wrapper for Claude Code/Codex with daemon mode
- **happy-server** — Fastify 5 backend with PostgreSQL/Prisma, Redis, Socket.io
- **happy-wire** — Shared Zod schemas and message types for wire protocol
- **happy-agent** — Remote agent control CLI

Each package has its own `CLAUDE.md` with package-specific guidelines. Always read the relevant package's CLAUDE.md before working in it.

## Common Commands

```bash
# Install dependencies
yarn

# Run CLI from source
yarn cli                    # starts happy CLI
yarn cli codex              # starts codex mode
yarn cli --help             # CLI help

# Run web app
yarn web                    # starts Expo web dev server

# Release (maintainers)
yarn release

# Package-specific (run from package directory or use yarn workspace)
yarn workspace happy-app typecheck
yarn workspace happy-app test
yarn workspace happy-server build      # TypeScript type checking
yarn workspace happy-server start
yarn workspace happy-server test
yarn workspace happy-server migrate    # Prisma migrations
yarn workspace happy-server generate   # Generate Prisma client
yarn workspace happy-server db         # Start local PostgreSQL in Docker
```

## Architecture Overview

### Data Flow

1. **Authentication**: QR code scanned by mobile app → challenge-response via TweetNaCl signatures → JWT token
2. **Session lifecycle**: CLI creates encrypted session → WebSocket connection to server → real-time sync to mobile/web app
3. **Dual mode operation**: CLI runs Claude in interactive mode (PTY terminal) or remote mode (SDK, controlled from mobile)
4. **Permissions**: Claude requests permission → MCP server intercepts → forwards to mobile app → mobile responds → MCP approves/denies

### Encryption

All sensitive data is end-to-end encrypted before leaving devices:
- **App**: libsodium (`@more-tech/react-native-libsodium`) for public-key crypto
- **CLI/Server**: TweetNaCl for signing, verification, and encryption
- **Encoding**: Always use `privacyKit.decodeBase64`/`privacyKit.encodeBase64` from `privacy-kit` (not Buffer)

### Real-time Sync

- Socket.io WebSocket connections between all components
- Server acts as encrypted relay — cannot read message contents
- Optimistic concurrency control with versioned state updates
- Client-side sync engine with automatic reconnection

### Wire Protocol

`happy-wire` defines shared Zod schemas imported by all packages. It is built automatically on `yarn` (via postinstall). Contains session protocol messages, legacy protocol types, and message metadata.

## Cross-Package Conventions

- **Yarn only** — never npm. Enforced via `packageManager` field.
- **TypeScript strict mode** in all packages
- **Path alias**: `@/*` maps to each package's source directory
- **Imports**: Always use `@/` prefix for internal imports, all imports at top of file
- **Testing**: Vitest across all packages; no mocking — tests make real API calls. Test files colocated with source (`.test.ts` or `.spec.ts`)
- **No backward compatibility** unless explicitly requested
- **4 spaces** for indentation (all packages)
- **Functional style**: Prefer functions over classes, avoid enums (use maps)
- **Logging**: File-based logging in CLI to avoid disturbing terminal UI; no console logging in server unless asked
- **No unnecessary files**: Prefer editing existing files over creating new ones

## Key Architectural Decisions

- **No loading errors shown to users** — always retry silently
- **Sync operations** go through SyncSocket/SyncSession classes, triggered via `invalidateSync`
- **Daemon mode** in CLI enables persistent background sessions, auto-updates on version change, and remote spawn from mobile
- **Server is a relay** — it never decrypts user data, only routes encrypted blobs
- **Prisma migrations are human-only** — never create migrations, only run `yarn generate` when needed
