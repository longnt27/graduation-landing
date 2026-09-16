function telegramConfig(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  const missing = [];
  if (!token) missing.push('TELEGRAM_BOT_TOKEN');
  if (!chatId) missing.push('TELEGRAM_CHAT_ID');
  if (missing.length) throw new Error(`Telegram chưa được cấu hình: thiếu ${missing.join(', ')}.`);
  return { token, chatId };
}

async function readTelegramResponse(response, action) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const reason = payload?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram ${action} failed: ${reason}`);
  }
  return payload.result;
}

export async function sendTelegramText(text, {
  fetchImpl = fetch,
  env = process.env
} = {}) {
  const { token, chatId } = telegramConfig(env);
  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });
  return readTelegramResponse(response, 'sendMessage');
}

export async function sendTelegramPhoto({ buffer, contentType, filename, caption = '' }, {
  fetchImpl = fetch,
  env = process.env
} = {}) {
  const { token, chatId } = telegramConfig(env);
  const body = new FormData();
  body.set('chat_id', chatId);
  if (caption) body.set('caption', caption);
  body.set('photo', new Blob([buffer], { type: contentType }), filename);

  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body
  });
  return readTelegramResponse(response, 'sendPhoto');
}

function clean(value, fallback = '—') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function formatVietnamTime(iso) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(iso));
}

export function buildGuestbookTelegramMessage(row, { isPublic }) {
  return [
    isPublic ? '💌 LƯU BÚT CÔNG KHAI — EM LONG' : '🔒 LƯU BÚT RIÊNG TƯ — EM LONG',
    '',
    `👤 Tên: ${clean(row.name, 'Ẩn danh')}`,
    `🏷 Tiêu đề: ${clean(row.title)}`,
    `💬 Lời nhắn: ${clean(row.message)}`,
    '',
    `🗓 Gửi lúc: ${formatVietnamTime(row.created_at)}`,
    `🆔 ${row.id}`
  ].join('\n');
}
