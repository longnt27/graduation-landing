import crypto from 'node:crypto';
import { json, methodNotAllowed } from '../lib/http.js';
import { validateRsvp } from '../lib/validation.js';

const ATTENDANCE_LABELS = {
  attending: '✅ Sẽ tham dự',
  maybe: '🤔 Có thể tham dự',
  declined: '❌ Không tham dự được'
};

function formatVietnamTime(iso) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(iso));
}

function clean(value, fallback = '—') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function buildTelegramMessage(row) {
  return [
    '🎓 RSVP MỚI — LỄ TỐT NGHIỆP EM LONG',
    '',
    `👤 Họ tên: ${clean(row.guest_name)}`,
    `🤝 Mối quan hệ: ${clean(row.guest_relation)}`,
    `📌 Trạng thái: ${ATTENDANCE_LABELS[row.attendance] || clean(row.attendance)}`,
    `🕐 Dự kiến có mặt: ${clean(row.arrival_time, 'Chưa xác định')}`,
    `👥 Đi cùng: ${Number(row.companions || 0)} người`,
    `📞 Liên hệ: ${clean(row.contact)}`,
    `💌 Lời nhắn: ${clean(row.note)}`,
    '',
    `🗓 Gửi lúc: ${formatVietnamTime(row.created_at)}`,
    `🆔 ${row.id}`
  ].join('\n');
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram RSVP chưa được cấu hình.');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const reason = payload?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram sendMessage failed: ${reason}`);
  }

  return payload.result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

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

    await sendTelegram(buildTelegramMessage(row));

    return json(res, 201, {
      ok: true,
      delivered: 'telegram',
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
    return json(res, 502, {
      error: 'Không thể gửi xác nhận tới em Long lúc này. Vui lòng thử lại sau.'
    });
  }
}
