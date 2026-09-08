# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**, with RSVP and guestbook APIs.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- Vercel Private Blob for durable RSVP + guestbook persistence
- GitHub Actions for CI
- Vercel native Git integration for deployments

Each submission is stored as its own private JSON blob. This keeps RSVP contact details out of public storage while allowing the guestbook to be exposed only through the API.

## CI/CD

### CI

`.github/workflows/ci.yml` runs on pull requests and every push to `main`:

- installs dependencies
- runs validation tests
- syntax-checks the serverless functions

### Production deploy

The Vercel project is connected directly to `longnt27/graduation-landing`.

- pushes to `main` trigger production deployments automatically
- non-production branches can create preview deployments through Vercel Git integration
- no `VERCEL_TOKEN` GitHub secret is required

The old custom GitHub Actions deployment workflow was removed after native Git integration was enabled.

### Storage

The backend requires a **Private Vercel Blob** store connected to the project. Create one from the Vercel project Storage tab if none is connected yet. The API uses the project runtime credentials automatically once the store is attached.

`ADMIN_TOKEN` is optional and only needed if the private RSVP JSON/CSV export endpoint should be enabled.

## API

- `POST /api/rsvp` — save RSVP privately
- `GET /api/rsvp` — private RSVP JSON export; header `Authorization: Bearer <ADMIN_TOKEN>`
- `GET /api/rsvp?format=csv` — private CSV export with the same admin header
- `GET /api/guestbook` — list public guestbook messages through the API
- `POST /api/guestbook` — save a guestbook message to private storage
- `GET /api/health` — storage health check

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
