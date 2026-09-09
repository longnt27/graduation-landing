import { methodNotAllowed } from '../lib/http.js';
import { readPrivateBlob } from '../lib/store.js';

function contentTypeFromPath(pathname) {
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.searchParams.get('path') || '';

    if (!pathname.startsWith('guestbook-images/') || pathname.includes('..')) {
      res.statusCode = 400;
      return res.end('Invalid image path');
    }

    const result = await readPrivateBlob(pathname);
    if (!result || result.statusCode !== 200 || !result.stream) {
      res.statusCode = 404;
      return res.end('Image not found');
    }

    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeFromPath(pathname));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.end(bytes);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.end('Unable to load image');
  }
}
