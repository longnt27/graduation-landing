import crypto from 'node:crypto';
import { json, methodNotAllowed } from '../lib/http.js';
import { readRecent, writeRecord } from '../lib/store.js';
import { validateGuestbook } from '../lib/validation.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await readRecent('guestbook', 80);
      return json(res, 200, { messages: rows.filter(row => row.approved !== false) });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Không thể tải lưu bút lúc này.' });
    }
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  try {
    const validated = validateGuestbook(req.body || {});
    if (validated.spam) return json(res, 200, { ok: true });

    const d = validated.data;
    const row = {
      id: crypto.randomUUID(),
      name: d.name,
      title: d.title,
      message: d.message,
      approved: true,
      created_at: new Date().toISOString()
    };

    await writeRecord('guestbook', row.id, row);
    return json(res, 201, { ok: true, message: row });
  } catch (err) {
    if (err?.message?.startsWith('Vui lòng') || err?.message?.startsWith('Lời lưu bút')) {
      return json(res, 400, { error: err.message });
    }
    console.error(err);
    return json(res, 500, { error: 'Không thể lưu lời chúc lúc này.' });
  }
}
