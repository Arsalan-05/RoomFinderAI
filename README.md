![RoomFinderAI](frontend/favicon.svg)

# RoomFinderAI

**AI-powered rental search, negotiation, and marketplace platform: live on web, iOS, and Android.**

RoomFinderAI gives renters the market research and negotiation leverage landlords normally have and they don't: true rental cost analysis, live market intelligence, and an LLM-driven negotiation engine.

🌐 **Web:** [roomfinderai.com](https://www.roomfinderai.com) · 🍎 **iOS:** [App Store](APP_STORE_LINK) · 🤖 **Android:** [Google Play](PLAY_STORE_LINK)

📖 **Full documentation:** [`DOCUMENTATION.md`](DOCUMENTATION.md)

---

## Platforms

| Platform | Path | Status |
|----------|------|--------|
| **Web** | [`frontend/`](frontend/) + [`backend/`](backend/) | ✅ **Live** at [roomfinderai.com](https://www.roomfinderai.com) (Railway) |
| **iOS** | [`ios/`](ios/) | ✅ **Live** on the [App Store](APP_STORE_LINK) (native SwiftUI) |
| **Android** | [`android/`](android/) | ✅ **Live** on [Google Play](PLAY_STORE_LINK) |

Public status page: **[/platform-status.html](https://www.roomfinderai.com/platform-status.html)** · API: `GET /api/platform-status`

---

## Features

- **LLM negotiation engine:** 8-phase conversation flow, landlord personality modeling, and a learning loop that improves negotiation templates over time
- **True rental cost:** 15+ external data sources per listing (RentCast, FEMA, BLS, Google Distance Matrix)
- **Real-time chat:** Supabase Realtime, with push notifications
- **Marketplace:** full authentication, Stripe payments, and identity verification
- **Backend:** 60+ REST API endpoints and 27 SQL migrations

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
├── backend/              # Express API server (production entry: backend/server.js)
├── frontend/             # Web UI (HTML/CSS/JS, PWA)
├── ios/                  # Native iOS app (SwiftUI), live on the App Store
├── android/              # Native Android app, live on Google Play
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

## Deploy

Production web runs on **Railway** via Nixpacks (`railway.json` → `node backend/server.js`).

Health check: `GET /health`
