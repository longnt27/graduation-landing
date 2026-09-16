import { get, list, put } from '@vercel/blob';

const ACCESS = 'private';

function isoPathTimestamp(iso) {
  return iso.replaceAll(':', '-');
}

export async function writePrivateBlob(pathname, body, contentType, { allowOverwrite = false } = {}) {
  await put(pathname, body, {
    access: ACCESS,
    contentType,
    addRandomSuffix: false,
    ...(allowOverwrite ? { allowOverwrite: true } : {})
  });
  return pathname;
}

export async function readPrivateBlob(pathname, { fresh = false } = {}) {
  return get(pathname, {
    access: ACCESS,
    ...(fresh ? { useCache: false } : {})
  });
}

export async function readPrivateBlobBuffer(pathname) {
  const result = await readPrivateBlob(pathname, { fresh: true });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: result.blob?.contentType || 'application/octet-stream',
    filename: pathname.split('/').pop() || 'guestbook-photo'
  };
}

export async function writeRecord(prefix, id, data) {
  const createdAt = data.created_at || new Date().toISOString();
  const pathname = `${prefix}/${isoPathTimestamp(createdAt)}-${id}.json`;
  await writePrivateBlob(
    pathname,
    JSON.stringify(data),
    'application/json; charset=utf-8'
  );
  return data;
}

export async function overwriteRecord(pathname, data) {
  await writePrivateBlob(
    pathname,
    JSON.stringify(data),
    'application/json; charset=utf-8',
    { allowOverwrite: true }
  );
  return data;
}

async function readBlobJson(pathname, { fresh = false } = {}) {
  const result = await readPrivateBlob(pathname, { fresh });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function readRecentEntries(prefix, limit = 80, { fresh = false } = {}) {
  const { blobs } = await list({ prefix: `${prefix}/`, limit: Math.min(Math.max(limit, 1), 1000) });
  const selected = blobs
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, limit);

  const entries = await Promise.all(selected.map(async blob => ({
    pathname: blob.pathname,
    row: await readBlobJson(blob.pathname, { fresh })
  })));

  return entries
    .filter(entry => entry.row)
    .sort((a, b) => new Date(b.row.created_at) - new Date(a.row.created_at));
}

export async function readRecent(prefix, limit = 80) {
  return (await readRecentEntries(prefix, limit)).map(entry => entry.row);
}

export async function checkStore() {
  await list({ prefix: 'health/', limit: 1 });
  return true;
}
