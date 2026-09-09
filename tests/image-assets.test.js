import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const expected = [
  { file: 'assets/frame-tablet-original.png', width: 1448, height: 1086 },
  { file: 'assets/frame-mobile-original.png', width: 941, height: 1672 },
  { file: 'assets/divider-original.png', width: 2172, height: 724 }
];

for (const asset of expected) {
  test(`${asset.file} exists and is the original-resolution PNG`, () => {
    const absolute = path.resolve(asset.file);
    assert.ok(fs.existsSync(absolute), `Missing ${asset.file}`);

    const stat = fs.statSync(absolute);
    assert.ok(stat.size > 100_000, `${asset.file} is suspiciously small (${stat.size} bytes)`);

    const header = Buffer.alloc(24);
    const fd = fs.openSync(absolute, 'r');
    try {
      fs.readSync(fd, header, 0, header.length, 0);
    } finally {
      fs.closeSync(fd);
    }

    assert.deepEqual([...header.subarray(0, 8)], [137,80,78,71,13,10,26,10], `${asset.file} is not a PNG`);
    assert.equal(header.readUInt32BE(16), asset.width, `${asset.file} has the wrong width`);
    assert.equal(header.readUInt32BE(20), asset.height, `${asset.file} has the wrong height`);
  });
}
