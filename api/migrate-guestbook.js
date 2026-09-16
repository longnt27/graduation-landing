import { json, methodNotAllowed } from '../lib/http.js';
import { migrateLegacyPrivateMessage } from '../lib/guestbook-service.js';
import { enforceJsonPost } from '../lib/security.js';
import {
  overwriteRecord,
  readPrivateBlobBuffer,
  readRecentEntries
} from '../lib/store.js';
import { sendTelegramPhoto, sendTelegramText } from '../lib/telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!enforceJsonPost(req, res, { maxBytes: 1_024 })) return;

  try {
    const entries = await readRecentEntries('guestbook', 1000, { fresh: true });
    const result = await migrateLegacyPrivateMessage({
      entries,
      loadImage: async pathname => {
        const image = await readPrivateBlobBuffer(pathname);
        if (!image) throw new Error(`Không thể đọc ảnh cũ: ${pathname}`);
        return image;
      },
      sendText: sendTelegramText,
      sendPhoto: sendTelegramPhoto,
      overwriteRecord
    });

    return json(res, 200, {
      ok: true,
      state: result.state,
      id: result.row.id,
      name: result.row.name,
      photo: Boolean(result.row.image_path)
    });
  } catch (err) {
    console.error(err);
    if (/expected exactly one/i.test(err?.message || '')) {
      return json(res, 409, { error: err.message });
    }
    if (err?.message?.startsWith('Telegram')) {
      return json(res, 502, { error: 'Telegram không nhận được lưu bút cần chuyển.' });
    }
    return json(res, 500, { error: 'Không thể chuyển lưu bút cũ lúc này.' });
  }
}
