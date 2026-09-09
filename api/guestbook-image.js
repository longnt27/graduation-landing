import { methodNotAllowed } from '../lib/http.js';
import { readPrivateBlob } from '../lib/store.js';

const SAFE_IMAGE_PATH = /^guestbook-images\/[A-Za-z0-9._-]+\.(?:jpg|png|webp)$/;

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

    if (pathname.length > 300 || !SAFE_IMAGE_PATH.test(pathname)) {
      res.statusCode = 400;
      res.setHeader('Cache-Control', 'no-store');
      return res.end('Invalid image path');
    }

    const result = await readPrivateBlob(pathname);
    if (!result || result.statusCode !== 200 || !result.stream) {
      res.statusCode = 404;
      res.setHeader('Cache-Control', 'no-store');
      return res.end('Image not found');
    }

    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    if (bytes.length > 2_000_000) {
      res.statusCode = 413;
      res.setHeader('Cache-Control', 'no-store');
      return res.end('Image too large');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeFromPath(pathname));
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    return res.end(bytes);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Cache-Control', 'no-store');
    return res.end('Unable to load image');
  }
}
