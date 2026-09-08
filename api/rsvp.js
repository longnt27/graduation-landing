import crypto from 'node:crypto';
import { json, methodNotAllowed } from '../lib/http.js';
import { readRecent, writeRecord } from '../lib/store.js';
import { validateRsvp } from '../lib/validation.js';

function csvCell(value) {
  const text = String(value ?? '').replaceAll('"', '""');
  return `"${text}"`;
}

function rsvpsToCsv(rows) {
  const headers = ['id', 'guest_name', 'guest_relation', 'attendance', 'arrival_time', 'companions', 'contact', 'note', 'created_at'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(key => csvCell(row[key])).join(','));
  }
  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const adminToken = process.env.ADMIN_TOKEN;
    const auth = req.headers.authorization || '';
    if (!adminToken || auth !== `Bearer ${adminToken}`) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    try {
      const rows = await readRecent('rsvp', 1000);
      if (req.query?.format === 'csv') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="long-graduation-rsvps.csv"');
        res.setHeader('Cache-Control', 'no-store');
        return res.end('\uFEFF' + rsvpsToCsv(rows));
      }
      return json(res, 200, { rsvps: rows });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Không thể đọc danh sách xác nhận.' });
    }
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  try {
    const validated = validateRsvp(req.body || {});
    if (validated.spam) return json(res, 200, { ok: true });

    const d = validated.data;
    const row = {
      id: crypto.randomUUID(),
      guest_name: d.guestName,
      guest_relation: d.guestRelation,
      attendance: d.attendance,
      arrival_time: d.arrivalTime,
      companions: d.companions,
      contact: d.contact,
      note: d.note,
      created_at: new Date().toISOString()
    };

    await writeRecord('rsvp', row.id, row);

    return json(res, 201, {
      ok: true,
      rsvp: {
        id: row.id,
        guest_name: row.guest_name,
        guest_relation: row.guest_relation,
        attendance: row.attendance,
        arrival_time: row.arrival_time,
        companions: row.companions,
        created_at: row.created_at
      }
    });
  } catch (err) {
    if (err?.message?.startsWith('Vui lòng') || err?.message?.startsWith('Số người')) {
      return json(res, 400, { error: err.message });
    }
    console.error(err);
    return json(res, 500, { error: 'Không thể lưu xác nhận lúc này.' });
  }
}
