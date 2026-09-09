const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);

export function validateRsvp(body = {}) {
  if (clean(body.website, 200)) return { spam: true };

  const guestName = clean(body.guestName, 100);
  const guestRelation = clean(body.guestRelation, 80);
  const attendance = clean(body.attendance, 20);
  const arrivalTime = clean(body.arrivalTime, 10);
  const contact = clean(body.contact, 80);
  const note = clean(body.note, 600);
  const companions = Number(body.companions ?? 0);

  if (guestName.length < 2) throw new Error('Vui lòng nhập họ và tên.');
  if (!['attending', 'maybe', 'declined'].includes(attendance)) {
    throw new Error('Vui lòng chọn trạng thái tham dự.');
  }
  if (arrivalTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(arrivalTime)) {
    throw new Error('Vui lòng nhập giờ dự kiến hợp lệ.');
  }
  if (!Number.isInteger(companions) || companions < 0 || companions > 10) {
    throw new Error('Số người đi cùng phải từ 0 đến 10.');
  }

  return {
    spam: false,
    data: {
      guestName,
      guestRelation,
      attendance,
      arrivalTime: attendance === 'declined' || !arrivalTime ? null : arrivalTime,
      companions: attendance === 'declined' ? 0 : companions,
      contact,
      note
    }
  };
}

export function validateGuestbook(body = {}) {
  if (clean(body.website, 200)) return { spam: true };

  const name = clean(body.name, 100) || 'Ẩn danh';
  const title = clean(body.title, 120);
  const message = clean(body.message, 1200);
  const image = String(body.image ?? '').trim();

  if (message.length < 2) throw new Error('Lời lưu bút hơi ngắn rồi.');

  if (image) {
    if (image.length > 3_000_000) throw new Error('Ảnh đính kèm quá lớn.');
    if (!/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
      throw new Error('Ảnh đính kèm phải là JPEG, PNG hoặc WebP.');
    }
  }

  return { spam: false, data: { name, title, message, image: image || null } };
}
