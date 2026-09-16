# Guestbook Privacy and Telegram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public/private guestbook delivery, Telegram text/photo notifications, and one exact legacy-message migration.

**Architecture:** Keep Vercel Blob as the public guestbook source of truth. Telegram is the private inbox and notification channel. New private notes never persist to guestbook storage; public notes persist after Telegram delivery. A temporary fixed-scope migration endpoint moves only the exact `Bố mày đây` record to private visibility.

**Tech Stack:** Static HTML/JS, Vercel Functions, Vercel Private Blob, Telegram Bot API, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-guestbook-privacy-telegram-design.md`

## Global Constraints
- Reuse existing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- Existing rows without `visibility` remain public.
- Only exact `name === "Bố mày đây"` is migrated; duplicate/zero matches abort.
- The legacy photo is sent to Telegram before the record becomes private.
- New private messages are not persisted to guestbook storage.

---

### Task 1: Guestbook visibility policy
**Files:** `lib/validation.js`, `lib/guestbook-policy.js`, `tests/guestbook-privacy.test.js`
- [x] Add failing tests for default-public and explicit-private validation.
- [x] Add failing tests for backward-compatible public filtering and exact migration selection.
- [x] Implement visibility parsing and policy helpers.
- [x] Run tests and confirm green.

### Task 2: Telegram guestbook delivery
**Files:** `lib/telegram.js`, `lib/guestbook-service.js`, `tests/guestbook-privacy.test.js`, `tests/guestbook-service.test.js`
- [x] Add failing tests for text/photo Telegram calls and public/private labels.
- [x] Add failing tests proving private submissions do not persist and public submissions do.
- [x] Implement Telegram and guestbook service helpers.
- [x] Run tests and confirm green.

### Task 3: API and storage integration
**Files:** `api/guestbook.js`, `api/migrate-guestbook.js`, `lib/store.js`
- [x] Add overwrite/fresh-read storage support required for migration checkpoints.
- [x] Route new guestbook submissions through Telegram delivery and visibility policy.
- [x] Filter private rows from `GET /api/guestbook`.
- [x] Add fixed-scope one-time migration endpoint.
- [x] Syntax-check all changed server modules.

### Task 4: Frontend checkbox
**Files:** `assets/guestbook-privacy.js`, `index.html`
- [x] Add a checked-by-default public/private control with theme-matched styling.
- [x] Inject `isPublic` into the existing guestbook POST payload without duplicating the existing form handler.
- [x] Adapt the existing success copy for private delivery.
- [ ] Load the new script before application initialization with a fresh asset URL.

### Task 5: Production migration and cleanup
**Files:** `.github/workflows/ci.yml`, temporary `api/migrate-guestbook.js`
- [ ] Push verified changes directly to `main`.
- [ ] Wait for the Vercel deployment check to succeed.
- [ ] Trigger the fixed migration from CI against `https://graduation-landing.vercel.app` and verify HTTP 200.
- [ ] Verify CI response reports the exact migrated record and photo presence.
- [ ] Remove the temporary migration trigger/endpoint after success and push cleanup to `main`.
