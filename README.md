# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**, with real RSVP and guestbook APIs.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- Vercel Private Blob for durable RSVP + guestbook persistence

Each submission is stored as its own private JSON blob. This avoids concurrent-write problems and keeps RSVP contact details out of public storage.

## Vercel setup

1. Deploy/import this repository to Vercel.
2. In the project, create/connect a **Private Vercel Blob** store (for example `long-graduation-data`).
3. Add `ADMIN_TOKEN` as a production environment variable.
4. Production branch is `main`; Vercel Git integration auto-deploys every push to `main`.

## API

- `POST /api/rsvp` — save RSVP privately
- `GET /api/rsvp` — private RSVP JSON export; header `Authorization: Bearer <ADMIN_TOKEN>`
- `GET /api/rsvp?format=csv` — private CSV export with the same admin header
- `GET /api/guestbook` — list public guestbook messages through the API
- `POST /api/guestbook` — save a guestbook message to private storage
- `GET /api/health` — storage health check

## Event details

Edit `CONFIG` near the end of `index.html` to change time, location, map URL and timeline.

## Checks

```bash
npm test
node --check api/rsvp.js
node --check api/guestbook.js
node --check lib/store.js
```
