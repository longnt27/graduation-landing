import { json } from '../lib/http.js';
import { checkStore } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    await checkStore();
    return json(res, 200, { ok: true, service: 'long-graduation', storage: 'vercel-blob', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    return json(res, 503, { ok: false, error: 'Storage unavailable' });
  }
}
