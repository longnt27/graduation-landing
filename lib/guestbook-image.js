function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    let markerOffset = offset + 1;
    while (buffer[markerOffset] === 0xff) markerOffset += 1;
    const marker = buffer[markerOffset];
    offset = markerOffset + 1;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (offset + 2 > buffer.length) break;

    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;

    const isSof = [
      0xc0, 0xc1, 0xc2, 0xc3,
      0xc5, 0xc6, 0xc7,
      0xc9, 0xca, 0xcb,
      0xcd, 0xce, 0xcf
    ].includes(marker);

    if (isSof && length >= 7) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }

    offset += length;
  }
  return null;
}

function pngDimensions(buffer) {
  if (buffer.length < 24) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function webpDimensions(buffer) {
  if (buffer.length < 30) return null;
  const chunk = buffer.subarray(12, 16).toString('ascii');

  if (chunk === 'VP8X') {
    return {
      width: readUInt24LE(buffer, 24) + 1,
      height: readUInt24LE(buffer, 27) + 1
    };
  }

  if (chunk === 'VP8L' && buffer[20] === 0x2f) {
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
    };
  }

  if (
    chunk === 'VP8 ' &&
    buffer[23] === 0x9d &&
    buffer[24] === 0x01 &&
    buffer[25] === 0x2a
  ) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  return null;
}

function inspectImage(buffer, subtype) {
  if (subtype === 'jpeg') {
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      throw new Error('Ảnh JPEG không hợp lệ.');
    }
    return jpegDimensions(buffer);
  }

  if (subtype === 'png') {
    const signature = '89504e470d0a1a0a';
    if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
      throw new Error('Ảnh PNG không hợp lệ.');
    }
    return pngDimensions(buffer);
  }

  if (subtype === 'webp') {
    if (
      buffer.length < 30 ||
      buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
    ) {
      throw new Error('Ảnh WebP không hợp lệ.');
    }
    return webpDimensions(buffer);
  }

  return null;
}

export function decodeGuestbookImage(dataUrl) {
  if (!dataUrl) return null;

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
  if (!match || match[2].length % 4 !== 0) {
    throw new Error('Ảnh đính kèm không hợp lệ.');
  }

  const subtype = match[1].toLowerCase();
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  const contentType = subtype === 'jpeg' ? 'image/jpeg' : `image/${subtype}`;
  const buffer = Buffer.from(match[2], 'base64');

  if (!buffer.length || buffer.length > 2_000_000) {
    throw new Error('Ảnh đính kèm quá lớn.');
  }

  const dimensions = inspectImage(buffer, subtype);
  if (!dimensions || !dimensions.width || !dimensions.height) {
    throw new Error('Không đọc được kích thước ảnh đính kèm.');
  }

  const { width, height } = dimensions;
  if (width > 5_000 || height > 5_000 || width * height > 20_000_000) {
    throw new Error('Kích thước ảnh đính kèm quá lớn.');
  }

  return { buffer, extension, contentType, width, height };
}
