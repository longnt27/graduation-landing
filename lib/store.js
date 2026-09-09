import { get, list, put } from '@vercel/blob';

const ACCESS = 'private';

function isoPathTimestamp(iso) {
  return iso.replaceAll(':', '-');
}

export async function writePrivateBlob(pathname, body, contentType) {
  await put(pathname, body, {
    access: ACCESS,
    contentType,
    addRandomSuffix: false
  });
  return pathname;
}

export async function readPrivateBlob(pathname) {
  return get(pathname, { access: ACCESS });
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

async function readBlobJson(pathname) {
  const result = await readPrivateBlob(pathname);
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export async function readRecent(prefix, limit = 80) {
  const { blobs } = await list({ prefix: `${prefix}/`, limit: Math.min(Math.max(limit, 1), 1000) });
  const selected = blobs
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, limit);

  const rows = await Promise.all(selected.map(blob => readBlobJson(blob.pathname)));
  return rows.filter(Boolean).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function checkStore() {
  await list({ prefix: 'health/', limit: 1 });
  return true;
}
