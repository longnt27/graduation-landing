import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGuestbook } from '../lib/validation.js';
import {
  classifyLegacyPrivateMigration,
  isPublicGuestbookRow,
  storagePlanForGuestbook
} from '../lib/guestbook-policy.js';
import {
  buildGuestbookTelegramMessage,
  sendTelegramPhoto,
  sendTelegramText
} from '../lib/telegram.js';

test('guestbook visibility defaults to public', () => {
  const result = validateGuestbook({ message: 'Chúc mừng nhé!' });
  assert.equal(result.data.isPublic, true);
});

test('guestbook accepts explicit private visibility', () => {
  const result = validateGuestbook({ message: 'Tin nhắn riêng', isPublic: false });
  assert.equal(result.data.isPublic, false);
});

test('legacy rows without visibility remain public', () => {
  assert.equal(isPublicGuestbookRow({ approved: true }), true);
  assert.equal(isPublicGuestbookRow({}), true);
});

test('private and unapproved rows are hidden', () => {
  assert.equal(isPublicGuestbookRow({ visibility: 'private' }), false);
  assert.equal(isPublicGuestbookRow({ approved: false }), false);
});

test('private guestbook submissions do not persist', () => {
  assert.deepEqual(storagePlanForGuestbook(false), {
    storeRecord: false,
    storeImage: false
  });
});

test('public guestbook submissions persist record and image', () => {
  assert.deepEqual(storagePlanForGuestbook(true), {
    storeRecord: true,
    storeImage: true
  });
});

test('legacy migration selects exactly one public Bố mày đây row', () => {
  const target = { id: 'target', name: 'Bố mày đây', visibility: 'public' };
  const result = classifyLegacyPrivateMigration([
    { id: 'other', name: 'Người khác' },
    target
  ]);
  assert.deepEqual(result, { state: 'migrate', row: target });
});

test('legacy migration is idempotent after the row becomes private', () => {
  const target = { id: 'target', name: 'Bố mày đây', visibility: 'private' };
  const result = classifyLegacyPrivateMigration([target]);
  assert.deepEqual(result, { state: 'already-private', row: target });
});

test('legacy migration refuses ambiguous duplicate names', () => {
  assert.throws(
    () => classifyLegacyPrivateMigration([
      { id: 'a', name: 'Bố mày đây' },
      { id: 'b', name: 'Bố mày đây' }
    ]),
    /expected exactly one/i
  );
});

test('guestbook Telegram text labels private/public delivery', () => {
  const text = buildGuestbookTelegramMessage({
    id: 'abc',
    name: 'Lan',
    title: 'Chúc mừng',
    message: 'Tốt nghiệp vui nhé',
    created_at: '2026-09-16T12:00:00.000Z'
  }, { isPublic: false });
  assert.match(text, /RIÊNG TƯ/);
  assert.match(text, /Lan/);
  assert.match(text, /Tốt nghiệp vui nhé/);
});

test('sendTelegramText posts to sendMessage', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  await sendTelegramText('hello', {
    fetchImpl,
    env: { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' }
  });

  assert.equal(request.url, 'https://api.telegram.org/bottoken/sendMessage');
  assert.deepEqual(JSON.parse(request.options.body), {
    chat_id: 'chat',
    text: 'hello',
    disable_web_page_preview: true
  });
});

test('sendTelegramPhoto posts multipart photo to sendPhoto', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ ok: true, result: { message_id: 2 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  await sendTelegramPhoto({
    buffer: Buffer.from([1, 2, 3]),
    contentType: 'image/png',
    filename: 'note.png',
    caption: 'photo'
  }, {
    fetchImpl,
    env: { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' }
  });

  assert.equal(request.url, 'https://api.telegram.org/bottoken/sendPhoto');
  assert.equal(request.options.body.get('chat_id'), 'chat');
  assert.equal(request.options.body.get('caption'), 'photo');
  assert.equal(request.options.body.get('photo').name, 'note.png');
});
