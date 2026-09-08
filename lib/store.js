import { get, list, put } from '@vercel/blob';

const ACCESS = 'private';

function isoPathTimestamp(iso) {
  return iso.replaceAll(':', '-');
}

export async function writeRecord(prefix, id, data) {
  const createdAt = data.created_at || new Date().toISOString();
  const pathname = `${prefix}/${isoPathTimestamp(createdAt)}-${id}.json`;
  await put(pathname, JSON.stringify(data), {
    access: ACCESS,
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false
  });
  return data;
}

async function readBlobJson(pathname) {
  const result = await get(pathname, { access: ACCESS });
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
