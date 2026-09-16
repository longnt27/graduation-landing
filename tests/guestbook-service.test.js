import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deliverGuestbookSubmission,
  migrateLegacyPrivateMessage
} from '../lib/guestbook-service.js';

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

test('legacy migration sends text and photo before setting visibility private', async () => {
  const calls = [];
  const entry = {
    pathname: 'guestbook/original.json',
    row: {
      id: 'legacy-1',
      name: 'Bố mày đây',
      title: 'hehe',
      message: 'legacy',
      image_path: 'guestbook-images/legacy.webp',
      created_at: '2026-09-14T12:00:00.000Z'
    }
  };

  const result = await migrateLegacyPrivateMessage({
    entries: [entry],
    loadImage: async path => {
      calls.push(`load:${path}`);
      return { buffer: Buffer.from([1, 2]), contentType: 'image/webp', filename: 'legacy.webp' };
    },
    sendText: async () => calls.push('text'),
    sendPhoto: async () => calls.push('photo'),
    overwriteRecord: async (pathname, row) => {
      calls.push(`write:${row.visibility || 'public'}`);
      assert.equal(pathname, entry.pathname);
    },
    now: () => '2026-09-16T13:00:00.000Z'
  });

  assert.deepEqual(calls, [
    'text',
    'write:public',
    'load:guestbook-images/legacy.webp',
    'photo',
    'write:public',
    'write:private'
  ]);
  assert.equal(result.state, 'migrated');
  assert.equal(result.row.visibility, 'private');
});

test('legacy migration resumes after text was already delivered', async () => {
  const calls = [];
  const result = await migrateLegacyPrivateMessage({
    entries: [{
      pathname: 'guestbook/original.json',
      row: {
        id: 'legacy-1',
        name: 'Bố mày đây',
        message: 'legacy',
        image_path: 'guestbook-images/legacy.webp',
        telegram_migration_text_sent_at: '2026-09-16T12:59:00.000Z',
        created_at: '2026-09-14T12:00:00.000Z'
      }
    }],
    loadImage: async () => ({ buffer: Buffer.from([1]), contentType: 'image/webp', filename: 'legacy.webp' }),
    sendText: async () => calls.push('text'),
    sendPhoto: async () => calls.push('photo'),
    overwriteRecord: async (_pathname, row) => calls.push(`write:${row.visibility || 'public'}`),
    now: () => '2026-09-16T13:00:00.000Z'
  });

  assert.deepEqual(calls, ['photo', 'write:public', 'write:private']);
  assert.equal(result.state, 'migrated');
});

test('legacy migration is a no-op after target is private', async () => {
  const calls = [];
  const result = await migrateLegacyPrivateMessage({
    entries: [{
      pathname: 'guestbook/original.json',
      row: { id: 'legacy-1', name: 'Bố mày đây', message: 'legacy', visibility: 'private' }
    }],
    loadImage: async () => calls.push('load'),
    sendText: async () => calls.push('text'),
    sendPhoto: async () => calls.push('photo'),
    overwriteRecord: async () => calls.push('write')
  });

  assert.deepEqual(calls, []);
  assert.equal(result.state, 'already-private');
});
