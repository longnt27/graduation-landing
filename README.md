# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- RSVP and guestbook notifications delivered through Telegram Bot API
- Vercel Private Blob for public guestbook persistence
- GitHub Actions for CI
- Vercel native Git integration for production deploys

## CI/CD

- pull requests and pushes to `main` run CI
- the Vercel project is connected directly to `longnt27/graduation-landing`
- every push to `main` automatically creates a production deployment

## Telegram

`POST /api/rsvp` validates the RSVP form and calls Telegram `sendMessage`.

`POST /api/guestbook` always delivers the guestbook message to Telegram. Public messages are also persisted in Vercel Private Blob and rendered on the landing page. Private messages are sent to Telegram only and are not stored as guestbook records.

Guestbook photos are delivered through Telegram `sendPhoto`. Public photos are also persisted in Vercel Private Blob so the landing page can render them.

Configure these Vercel environment variables for Production:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Never expose the bot token in client-side code or commit it to GitHub.

## Guestbook

The guestbook form contains a checked-by-default `Hiển thị lời nhắn công khai` option.

- checked: Telegram + public guestbook persistence
- unchecked: Telegram only
- `GET /api/guestbook` returns public guestbook messages only
- `POST /api/guestbook` creates and delivers a guestbook message
- `GET /api/health` checks guestbook storage availability

## Event details

Edit the event configuration/compatibility scripts under `assets/` when changing time, location, map URL or timeline, and keep the rendered HTML values in sync.

## Checks

```bash
npm test
node --check api/rsvp.js
node --check api/guestbook.js
node --check api/health.js
node --check lib/store.js
node --check lib/telegram.js
node --check lib/guestbook-policy.js
node --check lib/guestbook-service.js
node --check assets/guestbook-privacy.js
```
