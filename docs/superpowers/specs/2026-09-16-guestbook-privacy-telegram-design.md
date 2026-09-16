# Guestbook Privacy and Telegram Design

## Goal
Allow each new guestbook message to be public or private, deliver every new message to Telegram, and migrate only the existing message authored exactly as `Bố mày đây` (including its photo) to private Telegram delivery while leaving every other existing message public.

## Data model
- Existing records without `visibility` remain public for backward compatibility.
- New public records store `visibility: "public"` in Vercel Private Blob and remain visible through `GET /api/guestbook`.
- New private messages are delivered to Telegram only and are not stored as guestbook records or image blobs.
- A record with `visibility: "private"` is never returned by the public guestbook endpoint.

## Telegram delivery
- Reuse `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` already configured for RSVP.
- Send guestbook text with Telegram `sendMessage`.
- Send attached photos separately with `sendPhoto`, using the same guestbook ID in the caption.
- A new submission is successful only after Telegram accepts all required delivery calls.

## Existing-message migration
- Match records by exact `name === "Bố mày đây"` and require exactly one match.
- Deliver the original text and photo to Telegram.
- Track text/photo migration checkpoints on the record so a retry can resume without intentionally re-sending completed parts.
- Set `visibility: "private"` only after required Telegram deliveries succeed.
- Preserve the original record and image blob as a backup.

## UI
- Add a checked-by-default checkbox: `Hiển thị lời nhắn công khai`.
- Checked means public + Telegram notification.
- Unchecked means Telegram-only private delivery.
- Keep the existing guestbook form and public feed for all other messages.

## Failure behavior
- Telegram failure returns a visible submission error and does not report success.
- Migration aborts if zero or multiple exact legacy-name matches are found.
