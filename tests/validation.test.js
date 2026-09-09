import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp, validateGuestbook } from '../lib/validation.js';

test('valid attending RSVP', () => {
  const r = validateRsvp({ guestName:'Nguyễn Văn A', attendance:'attending', arrivalTime:'07:45', companions:'1' });
  assert.equal(r.data.companions, 1);
  assert.equal(r.data.arrivalTime, '07:45');
});

test('declined RSVP does not require arrival time', () => {
  const r = validateRsvp({ guestName:'Nguyễn Văn A', attendance:'declined', companions:'4' });
  assert.equal(r.data.arrivalTime, null);
  assert.equal(r.data.companions, 0);
});

test('reject invalid companions', () => {
  assert.throws(() => validateRsvp({ guestName:'Nguyễn Văn A', attendance:'attending', arrivalTime:'08:00', companions:'99' }));
});

test('valid named guestbook message', () => {
  const r = validateGuestbook({ name:'Hương', message:'Chúc mừng em Long!' });
  assert.equal(r.data.name, 'Hương');
});

test('guestbook message may be anonymous', () => {
  const r = validateGuestbook({ name:'', message:'Chúc mừng nhé!' });
  assert.equal(r.data.name, 'Ẩn danh');
});

test('guestbook accepts supported image data URLs', () => {
  const r = validateGuestbook({ message:'Một kỷ niệm đẹp', image:'data:image/webp;base64,AAAA' });
  assert.equal(r.data.image, 'data:image/webp;base64,AAAA');
});

test('guestbook rejects unsupported image types', () => {
  assert.throws(() => validateGuestbook({ message:'Một kỷ niệm đẹp', image:'data:image/svg+xml;base64,AAAA' }));
});

test('honeypot submissions are silently classified as spam', () => {
  assert.equal(validateGuestbook({ website:'https://spam.test' }).spam, true);
});

test('attending RSVP may omit arrival time', () => {
  const result = validateRsvp({ guestName: 'Nguyen Van A', attendance: 'attending', companions: 0 });
  assert.equal(result.data.arrivalTime, null);
});
