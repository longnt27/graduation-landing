import crypto from 'node:crypto';
import { json, methodNotAllowed } from '../lib/http.js';
import { readRecent, writePrivateBlob, writeRecord } from '../lib/store.js';
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

function decodeImage(dataUrl) {
  if (!dataUrl) return null;
  const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error('Ảnh đính kèm không hợp lệ.');

  const subtype = match[1].toLowerCase();
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  const contentType = subtype === 'jpeg' ? 'image/jpeg' : `image/${subtype}`;
  const buffer = Buffer.from(match[2], 'base64');

  if (!buffer.length || buffer.length > 2_000_000) {
    throw new Error('Ảnh đính kèm quá lớn.');
  }

  return { buffer, extension, contentType };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await readRecent('guestbook', 80);
      const messages = rows
        .filter(row => row.approved !== false)
        .map(publicMessage);
      return json(res, 200, { messages });
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
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    let imagePath = null;

    if (d.image) {
      const image = decodeImage(d.image);
      const safeTimestamp = createdAt.replaceAll(':', '-');
      imagePath = `guestbook-images/${safeTimestamp}-${id}.${image.extension}`;
      await writePrivateBlob(imagePath, image.buffer, image.contentType);
    }

    const row = {
      id,
      name: d.name,
      title: d.title,
      message: d.message,
      image_path: imagePath,
      approved: true,
      created_at: createdAt
    };

    await writeRecord('guestbook', row.id, row);
    return json(res, 201, { ok: true, message: publicMessage(row) });
  } catch (err) {
    if (
      err?.message?.startsWith('Vui lòng') ||
      err?.message?.startsWith('Lời lưu bút') ||
      err?.message?.startsWith('Ảnh đính kèm')
    ) {
      return json(res, 400, { error: err.message });
    }
    console.error(err);
    return json(res, 500, { error: 'Không thể lưu lời chúc lúc này.' });
  }
}
