export const LEGACY_PRIVATE_NAME = 'Bố mày đây';

export function isPublicGuestbookRow(row = {}) {
  if (row.visibility === 'private' || row.approved === false) return false;

  // The one legacy note predates explicit visibility. Keep it out of the public
  // feed without re-running any migration or affecting future public notes that
  // happen to use the same display name.
  if (row.visibility == null && row.name === LEGACY_PRIVATE_NAME) return false;

  return true;
}

export function storagePlanForGuestbook(isPublic) {
  const persist = Boolean(isPublic);
  return { storeRecord: persist, storeImage: persist };
}
