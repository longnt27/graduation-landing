import { buildGuestbookTelegramMessage } from './telegram.js';

function photoCaption(row) {
  return `Ảnh đính kèm · ${row.name || 'Ẩn danh'} · ${row.id}`;
}

export async function deliverGuestbookSubmission({
  row,
  isPublic,
  image,
  sendText,
  sendPhoto,
  persist
}) {
  await sendText(buildGuestbookTelegramMessage(row, { isPublic }));

  if (image) {
    await sendPhoto({ ...image, caption: photoCaption(row) });
  }

  if (!isPublic) return { persisted: false, row };

  await persist(row, image);
  return { persisted: true, row };
}
