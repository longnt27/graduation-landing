# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- RSVP notifications delivered directly through Telegram Bot API
- Vercel Private Blob only for guestbook persistence
- GitHub Actions for CI
- Vercel native Git integration for production deploys

## CI/CD

- pull requests and pushes to `main` run CI
- the Vercel project is connected directly to `longnt27/graduation-landing`
- every push to `main` automatically creates a production deployment

## RSVP -> Telegram

`POST /api/rsvp` validates the form and calls Telegram `sendMessage`. The form only reports success after Telegram accepts the message.

Configure these Vercel environment variables for Production:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Never expose the bot token in client-side code or commit it to GitHub.

## Guestbook

The public guestbook still uses a **Private Vercel Blob** store because messages must persist and be readable back on the landing page.

- `GET /api/guestbook` — list guestbook messages
- `POST /api/guestbook` — create a guestbook message
- `GET /api/health` — check guestbook storage availability

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
