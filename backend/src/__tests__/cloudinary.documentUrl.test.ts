import { describe, it, expect, beforeAll } from 'vitest';

// Cloudinary denies public delivery of PDFs on default accounts ("deny or ACL
// failure"), so PDF links must be signed, expiring API download URLs.
describe('documentUrl', () => {
  let documentUrl: (publicId: string, mimeType: string) => string;

  beforeAll(async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY    = '123456';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    ({ documentUrl } = await import('../lib/cloudinary.ts'));
  });

  it('returns a signed, expiring download link for PDFs', () => {
    const url = new URL(documentUrl('medmarket/documents/s1/drug_license_x.pdf', 'application/pdf'));
    expect(url.host).toBe('api.cloudinary.com');
    expect(url.pathname).toBe('/v1_1/demo-cloud/raw/download');
    expect(url.searchParams.get('public_id')).toBe('medmarket/documents/s1/drug_license_x.pdf');
    expect(url.searchParams.get('signature')).toBeTruthy();
    const expiresAt = Number(url.searchParams.get('expires_at'));
    expect(expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() / 1000 + 3600 + 5);
  });

  it('returns a normal delivery URL for images', () => {
    const url = documentUrl('medmarket/documents/s1/store_photo_x', 'image/jpeg');
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/demo-cloud\/image\/upload\/.*store_photo_x/);
  });
});
