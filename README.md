# Long Graduation Invitation

Responsive graduation invitation for **27/09/2026**, with real RSVP and guestbook APIs.

## Stack

- Static HTML/CSS/JS frontend
- Vercel Functions (`/api`)
- Vercel Private Blob for durable RSVP + guestbook persistence
- GitHub Actions CI + production deployment

Each submission is stored as its own private JSON blob. This avoids concurrent-write problems and keeps RSVP contact details out of public storage.

## CI/CD

### CI

`.github/workflows/ci.yml` runs on pull requests and every push to `main`:

- installs dependencies
- runs validation tests
- syntax-checks the serverless functions

### Production deploy

`.github/workflows/deploy.yml` runs only after the `CI` workflow succeeds on `main`.

The deploy job:

1. links the repository checkout to the existing Vercel project `graduation-landing`
2. creates a private Blob store named `long-graduation-data` if it does not exist
3. pulls the production environment
4. builds with Vercel
5. deploys the tested commit to production

The workflow needs exactly one GitHub Actions repository secret:

```text
VERCEL_TOKEN
```

Create a Vercel access token, then add it at:

`GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

After adding the secret, re-run the failed **Deploy production** workflow once. Future pushes to `main` deploy automatically after CI passes.

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
