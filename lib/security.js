import { json } from './http.js';

function firstHeader(value) {
  return String(value || '').split(',')[0].trim();
}

function reject(res, status, error) {
  json(res, status, { error });
  return false;
}

export function enforceJsonPost(req, res, { maxBytes = 32_768 } = {}) {
  const contentType = firstHeader(req.headers?.['content-type']).toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return reject(res, 415, 'Content-Type phải là application/json.');
  }

  const fetchSite = firstHeader(req.headers?.['sec-fetch-site']).toLowerCase();
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite)) {
    return reject(res, 403, 'Cross-site request bị từ chối.');
  }

  const origin = firstHeader(req.headers?.origin);
  const host = firstHeader(req.headers?.['x-forwarded-host'] || req.headers?.host).toLowerCase();
  if (origin && host) {
    try {
      if (new URL(origin).host.toLowerCase() !== host) {
        return reject(res, 403, 'Origin không hợp lệ.');
      }
    } catch {
      return reject(res, 403, 'Origin không hợp lệ.');
    }
  }

  const contentLength = Number(firstHeader(req.headers?.['content-length']));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return reject(res, 413, 'Payload quá lớn.');
  }

  let bodyBytes = 0;
  try {
    bodyBytes = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
  } catch {
    return reject(res, 400, 'JSON không hợp lệ.');
  }

  if (bodyBytes > maxBytes) {
    return reject(res, 413, 'Payload quá lớn.');
  }

  return true;
}
