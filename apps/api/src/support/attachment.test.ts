import { describe, expect, it } from 'vitest';
import { detectImageMime, extensionForMime } from './attachment';

const pad = (head: number[]) => Buffer.from([...head, ...new Array(16).fill(0)]);

describe('detectImageMime', () => {
  it('reconnaît un PNG à sa signature', () => {
    expect(detectImageMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
  });

  it('reconnaît un JPEG à sa signature', () => {
    expect(detectImageMime(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });

  it('reconnaît un WebP (RIFF…WEBP)', () => {
    const buf = Buffer.from('RIFF' + '0123' + 'WEBP' + '....', 'latin1');
    expect(detectImageMime(buf)).toBe('image/webp');
  });

  it('rejette un contenu qui n’est pas une image (ex. un PDF)', () => {
    expect(detectImageMime(pad([0x25, 0x50, 0x44, 0x46]))).toBeNull();
  });

  it('rejette un buffer trop court', () => {
    expect(detectImageMime(Buffer.from([0x89, 0x50]))).toBeNull();
  });
});

describe('extensionForMime', () => {
  it('mappe chaque type accepté', () => {
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/webp')).toBe('webp');
  });
});
