import crypto from 'node:crypto';
import { json, methodNotAllowed } from '../lib/http.js';
import { decodeGuestbookImage } from '../lib/guestbook-image.js';
import { isPublicGuestbookRow } from '../lib/guestbook-policy.js';
import { deliverGuestbookSubmission } from '../lib/guestbook-service.js';
import { enforceJsonPost } from '../lib/security.js';
import { readRecent, writePrivateBlob, writeRecord } from '../lib/store.js';
import { sendTelegramPhoto, sendTelegramText } from '../lib/telegram.js';
import { validateGuestbook } from '../lib/validation.js';

function publicMessage(row) {
  const imageUrl = row.image_path
    ? `/api/guestbook-image?path=${encodeURIComponent(row.image_path)}`
    : null;

  return {
    id: row.id,
    name: row.name,
    title: row.title,
    message: row.message,
    created_at: row.created_at,
    image_url: imageUrl
  };
}

function isValidationError(err) {
  return [
    'Vui lòng',
    'Lời lưu bút',
    'Ảnh',
    'Không đọc được',
    'Kích thước ảnh'
  ].some(prefix => err?.message?.startsWith(prefix));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await readRecent('guestbook', 40);
      const messages = rows
        .filter(isPublicGuestbookRow)
        .map(publicMessage);
      return json(res, 200, { messages });
    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Không thể tải lưu bút lúc này.' });
    }
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!enforceJsonPost(req, res, { maxBytes: 3_100_000 })) return;

  try {
    const validated = validateGuestbook(req.body || {});
    if (validated.spam) return json(res, 200, { ok: true });

    const d = validated.data;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    let image = null;

    if (d.image) {
      const decoded = decodeGuestbookImage(d.image);
      const filename = `${id}.${decoded.extension}`;
      image = {
        buffer: decoded.buffer,
        contentType: decoded.contentType,
        filename,
        pathname: `guestbook-images/${createdAt.replaceAll(':', '-')}-${filename}`
      };
    }

    const row = {
      id,
      name: d.name,
      title: d.title,
      message: d.message,
      image_path: d.isPublic && image ? image.pathname : null,
      visibility: d.isPublic ? 'public' : 'private',
      created_at: createdAt
    };

    const delivery = await deliverGuestbookSubmission({
      row,
      isPublic: d.isPublic,
      image,
      sendText: sendTelegramText,
      sendPhoto: sendTelegramPhoto,
      persist: async (record, attachedImage) => {
        if (attachedImage) {
          await writePrivateBlob(
            attachedImage.pathname,
            attachedImage.buffer,
            attachedImage.contentType
          );
        }
        await writeRecord('guestbook', record.id, record);
      }
    });

    return json(res, 201, {
      ok: true,
      delivery: d.isPublic ? 'public+telegram' : 'telegram-private',
      message: d.isPublic
        ? publicMessage(row)
        : { id: row.id, name: row.name, created_at: row.created_at },
      persisted: delivery.persisted
    });
  } catch (err) {
    if (isValidationError(err)) {
      return json(res, 400, { error: err.message });
    }
    console.error(err);
    if (err?.message?.startsWith('Telegram')) {
      return json(res, 502, { error: 'Không thể gửi lời chúc tới em Long lúc này. Vui lòng thử lại sau.' });
    }
    return json(res, 500, { error: 'Không thể lưu lời chúc lúc này.' });
  }
}
