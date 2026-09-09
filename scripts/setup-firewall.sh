#!/usr/bin/env bash
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install it first: npm i -g vercel"
  exit 1
fi

echo "Current firewall overview:"
vercel firewall overview || true

echo

echo "Adding production rate-limit rules. Run this script once per project."

vercel firewall rules add "Graduation RSVP POST rate limit" \
  --condition '{"type":"environment","op":"eq","value":"production"}' \
  --condition '{"type":"path","op":"eq","value":"/api/rsvp"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 20 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --description "Protect Telegram RSVP from scripted spam" \
  --yes

vercel firewall rules add "Graduation guestbook POST rate limit" \
  --condition '{"type":"environment","op":"eq","value":"production"}' \
  --condition '{"type":"path","op":"eq","value":"/api/guestbook"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 600 \
  --rate-limit-requests 30 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --description "Protect Blob writes and image uploads from spam" \
  --yes

vercel firewall rules add "Graduation guestbook GET rate limit" \
  --condition '{"type":"environment","op":"eq","value":"production"}' \
  --condition '{"type":"path","op":"eq","value":"/api/guestbook"}' \
  --condition '{"type":"method","op":"eq","value":"GET"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 120 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --description "Protect Blob list/read endpoint from request floods" \
  --yes

vercel firewall rules add "Graduation guestbook image GET rate limit" \
  --condition '{"type":"environment","op":"eq","value":"production"}' \
  --condition '{"type":"path","op":"eq","value":"/api/guestbook-image"}' \
  --condition '{"type":"method","op":"eq","value":"GET"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 240 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit \
  --description "Protect private image proxy and Blob reads from floods" \
  --yes

echo

echo "Staged firewall diff:"
vercel firewall diff

echo
read -r -p "Publish these firewall rules now? [y/N] " answer
case "$answer" in
  y|Y|yes|YES)
    vercel firewall publish --yes
    echo "Firewall rules published."
    ;;
  *)
    echo "Rules remain staged. Publish later with: vercel firewall publish --yes"
    ;;
esac
