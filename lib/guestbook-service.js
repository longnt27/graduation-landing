import { buildGuestbookTelegramMessage } from './telegram.js';
import { classifyLegacyPrivateMigration } from './guestbook-policy.js';

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

export async function migrateLegacyPrivateMessage({
  entries,
  loadImage,
  sendText,
  sendPhoto,
  overwriteRecord,
  now = () => new Date().toISOString()
}) {
  const rows = entries.map(entry => entry.row);
  const classification = classifyLegacyPrivateMigration(rows);
  const entry = entries.find(candidate => candidate.row === classification.row);

  if (classification.state === 'already-private') {
    return classification;
  }

  let row = { ...classification.row };

  if (!row.telegram_migration_text_sent_at) {
    await sendText(buildGuestbookTelegramMessage(row, { isPublic: false }));
    row.telegram_migration_text_sent_at = now();
    await overwriteRecord(entry.pathname, row);
  }

  if (row.image_path && !row.telegram_migration_photo_sent_at) {
    const image = await loadImage(row.image_path);
    await sendPhoto({ ...image, caption: photoCaption(row) });
    row.telegram_migration_photo_sent_at = now();
    await overwriteRecord(entry.pathname, row);
  }

  row.visibility = 'private';
  row.telegram_migrated_at = now();
  await overwriteRecord(entry.pathname, row);

  return { state: 'migrated', row };
}
