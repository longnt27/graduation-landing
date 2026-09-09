import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';

const requiredAssets = [
  'assets/frame-tablet-v3.png',
  'assets/frame-mobile-v3.png',
  'assets/divider-v3.png',
];

for (const path of requiredAssets) {
  test(`${path} exists`, async () => {
    const file = await stat(path);
    assert.equal(file.isFile(), true, `${path} must be a file`);
  });
}
