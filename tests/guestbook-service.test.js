import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverGuestbookSubmission } from '../lib/guestbook-service.js';

test('private submission goes to Telegram and never persists', async () => {
  const calls = [];
  const result = await deliverGuestbookSubmission({
    row: {
      id: 'private-1',
      name: 'Lan',
      title: '',
      message: 'Tin nhắn riêng',
      created_at: '2026-09-16T12:00:00.000Z'
    },
    isPublic: false,
    image: null,
    sendText: async () => calls.push('text'),
    sendPhoto: async () => calls.push('photo'),
    persist: async () => calls.push('persist')
  });

  assert.deepEqual(calls, ['text']);
  assert.equal(result.persisted, false);
});

test('public submission notifies Telegram then persists', async () => {
  const calls = [];
  const result = await deliverGuestbookSubmission({
    row: {
      id: 'public-1',
      name: 'Lan',
      title: '',
      message: 'Chúc mừng',
      created_at: '2026-09-16T12:00:00.000Z'
    },
    isPublic: true,
    image: { buffer: Buffer.from([1]), contentType: 'image/png', filename: 'x.png' },
    sendText: async () => calls.push('text'),
    sendPhoto: async () => calls.push('photo'),
    persist: async () => calls.push('persist')
  });

  assert.deepEqual(calls, ['text', 'photo', 'persist']);
  assert.equal(result.persisted, true);
});
