# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**, with Telegram RSVP delivery and a public guestbook.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- Telegram Bot API for RSVP notifications
- Vercel Private Blob for guestbook persistence
- GitHub Actions for CI
- Vercel native Git integration for deployments

## CI/CD

`.github/workflows/ci.yml` runs on pull requests and every push to `main`. The Vercel project is connected directly to `longnt27/graduation-landing`, so every push to `main` triggers a production deployment automatically.

## RSVP → Telegram

`POST /api/rsvp` validates the form and sends the RSVP directly to Telegram. RSVP data is not stored in Vercel Blob and there is no admin inbox.

Add these **Production** environment variables in the Vercel project:

```text
TELEGRAM_BOT_TOKEN=<your existing bot token>
TELEGRAM_CHAT_ID=<the private chat/group/channel that should receive RSVPs>
```

Never put the real bot token in the repository or client-side JavaScript.

## Guestbook

Guestbook messages remain persistent because they are shown publicly on the invitation page. Connect a **Private Vercel Blob** store to the project. The API uses the project runtime credentials automatically once the store is attached.

## API

- `POST /api/rsvp` — validate RSVP and deliver it to Telegram
- `GET /api/guestbook` — list public guestbook messages
- `POST /api/guestbook` — save a guestbook message to private Blob storage
- `GET /api/health` — storage health check for the guestbook backend

## Event details

Edit `CONFIG` in `assets/app.js` to change time, location, map URL and timeline.

## Checks

```bash
npm test
node --check api/rsvp.js
node --check api/guestbook.js
node --check api/health.js
node --check lib/store.js
```
