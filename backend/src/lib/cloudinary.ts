import { v2 as cloudinary } from 'cloudinary';

function applyConfig() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key:    process.env.CLOUDINARY_API_KEY    || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  });
}

applyConfig();

export { cloudinary };

export async function uploadToCloudinary(
  buffer:   Buffer,
  mimeType: string,
  folder:   string,
  publicId: string,
): Promise<{ secure_url: string; public_id: string }> {
  applyConfig();
  return new Promise((resolve, reject) => {
    const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:     publicId,
        resource_type: resourceType,
        overwrite:     true,
        format:        mimeType === 'application/pdf' ? 'pdf' : undefined,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, mimeType: string): Promise<void> {
  applyConfig();
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
