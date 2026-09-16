export const LEGACY_PRIVATE_NAME = 'Bố mày đây';

export function isPublicGuestbookRow(row = {}) {
  return row.visibility !== 'private' && row.approved !== false;
}

export function storagePlanForGuestbook(isPublic) {
  const persist = Boolean(isPublic);
  return { storeRecord: persist, storeImage: persist };
}

export function classifyLegacyPrivateMigration(rows = []) {
  const matches = rows.filter(row => row?.name === LEGACY_PRIVATE_NAME);
  if (matches.length !== 1) {
    throw new Error(`Legacy migration expected exactly one '${LEGACY_PRIVATE_NAME}' row, found ${matches.length}.`);
  }
  const row = matches[0];
  if (!isPublicGuestbookRow(row)) return { state: 'already-private', row };
  return { state: 'migrate', row };
}
