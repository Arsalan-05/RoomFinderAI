![RoomFinderAI](frontend/favicon.svg)

# RoomFinderAI

**AI rental market analysis and negotiation platform, co-built with a co-founder. This repo holds the web, iOS and Android apps.**

RoomFinderAI gives renters the market research and negotiation leverage landlords normally have and they don't: true rental cost analysis, market intelligence, and an LLM-driven negotiation engine.

🌐 **Web:** [roomfinderai.com](https://www.roomfinderai.com)

📖 **Full documentation:** [`DOCUMENTATION.md`](DOCUMENTATION.md)  
🎓 **Interview learning plan:** [`docs/INTERVIEW_LEARNING_PLAN.md`](docs/INTERVIEW_LEARNING_PLAN.md)

---

## Platforms

| Platform | Path | Notes |
|----------|------|-------|
| **Web** | [`frontend/`](frontend/) + [`backend/`](backend/) | Site: [roomfinderai.com](https://www.roomfinderai.com) (Railway config in `railway.json`) |
| **iOS** | [`ios/`](ios/) | Native SwiftUI app |
| **Android** | [`android/`](android/) | Native Android app |

Public status page: **[/platform-status.html](https://www.roomfinderai.com/platform-status.html)** · API: `GET /api/platform-status`

---

## Features

- **LLM negotiation engine:** multi-phase conversation flow, landlord personality modeling, and a learning module for negotiation templates (`ai-learning/`)
- **True rental cost:** external data sources per listing, including RentCast, FEMA, BLS and Google Distance Matrix
- **Real-time chat:** Supabase Realtime, with push notifications
- **Marketplace:** authentication and Stripe payments
- **Backend:** Express REST API and SQL migrations

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js · Express |
| Database | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime |
| AI | LLM APIs · prompt-engineered negotiation flows |
| Payments | Stripe |
| Web | HTML · CSS · JavaScript (PWA) |
| iOS | SwiftUI |
| Android | Native Android |
| Infrastructure | Railway (Nixpacks) · Cloudflare Workers |

---

## Quick start (web)

```bash
cp .env.example .env    # fill in Supabase + API keys
npm install
npm run validate
npm start               # http://localhost:3000
```

See [`docs/guides/SETUP_GUIDE.md`](docs/guides/SETUP_GUIDE.md) for full setup. Mobile setup: [`ios/README.md`](ios/README.md) · [`android/README.md`](android/README.md).

## Project layout

```
RoomFinderAI/
├── backend/              # Express API server (entry: backend/server.js)
├── frontend/             # Web UI (HTML/CSS/JS, PWA)
├── ios/                  # Native iOS app (SwiftUI)
├── android/              # Native Android app
├── database/
│   ├── migrations/       # Supabase schema migrations
│   └── sql/              # One-off SQL scripts
├── scripts/
│   ├── maintenance/      # Debug & test scripts
│   ├── migrations/       # Data migration scripts
│   └── tools/            # Config encrypt/decrypt, utilities
├── docs/
│   └── guides/           # Setup, implementation, and ops docs
├── ai-learning/          # Negotiation learning module
├── cloudflare-worker/    # Edge worker
├── tests/                # Integration tests
├── archive/              # Legacy code and superseded apps (reference only)
└── 3D House Models/      # Static 3D assets served by web
```

## Hosting

The web app is configured for **Railway** via Nixpacks (`railway.json` → `node backend/server.js`).

Health check: `GET /health`
