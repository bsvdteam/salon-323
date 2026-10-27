# NOIR · salon-323

Website für **Salon 323**.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **shadcn/ui** (Base UI) · **lucide-react**
- **Supabase** (`@supabase/ssr`) für Auth & Daten
- **react-hook-form + zod** · **TanStack Query**
- **Prettier** · **ESLint** · Deployment auf **Vercel**

## Setup

```bash
pnpm install
cp .env.example .env.local   # dann Supabase-Keys eintragen
pnpm dev                     # http://localhost:3000
```

Supabase-Werte findest du im Dashboard unter **Project Settings → API**.

## Scripts

| Befehl           | Zweck                  |
| ---------------- | ---------------------- |
| `pnpm dev`       | Dev-Server (Turbopack) |
| `pnpm build`     | Production-Build       |
| `pnpm start`     | Production-Server      |
| `pnpm lint`      | ESLint                 |
| `pnpm typecheck` | TypeScript prüfen      |
| `pnpm format`    | Prettier (schreibt)    |

## Ordnerstruktur

```
src/
├── app/                    # Routing (App Router)
│   ├── (marketing)/        # öffentliche Seiten (Home …)
│   ├── api/                # Route Handlers
│   ├── layout.tsx          # Root-Layout (Providers, Metadaten)
│   └── globals.css         # Tailwind + Theme-Tokens
├── components/
│   ├── ui/                 # shadcn/ui-Primitives (Button, Input …)
│   ├── sections/           # Seiten-Bausteine (Hero …)
│   ├── layout/             # Header, Footer, Nav
│   └── providers.tsx       # Client-Provider (TanStack Query)
├── config/
│   └── site.ts             # zentrale Website-Config (Name, Nav, Buchung)
├── hooks/                  # eigene React-Hooks
├── lib/
│   ├── supabase/           # Browser-/Server-/Proxy-Clients
│   ├── env.ts              # typisierter Env-Zugriff
│   ├── constants.ts        # App-weite Konstanten
│   └── utils.ts            # Helfer (cn …)
├── types/                  # projektweite TypeScript-Typen
└── proxy.ts                # Session-Refresh (Next 16 "proxy")

supabase/                   # Supabase-CLI: config.toml, migrations/
public/                     # statische Assets (images/ …)
```

## Konventionen

- **Pro Projekt anpassen:** `src/config/site.ts` (Name, Navigation, Buchung).
- **Secrets** nur in `.env.local` (git-ignoriert). `.env.example` hält die Vorlage aktuell.
- **UI-Primitives** kommen aus `components/ui/` (shadcn) — nicht per Hand nachbauen.
- **Sektionen** (Hero, Features …) leben in `components/sections/`.
