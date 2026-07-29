import fs from 'fs';
import path from 'path';

const isVercel = !!process.env.VERCEL;

/**
 * Persists an uploaded file (from multer) and returns a publicly accessible URL/path.
 *
 * - On Vercel: uploads the in-memory buffer to Vercel Blob storage (persists across
 *   invocations, unlike /tmp) and returns the public blob URL.
 * - Locally: writes the buffer to the local uploads/ folder and returns a relative
 *   /uploads/<filename> path, served by the existing express.static middleware.
 *
 * Requires the BLOB_READ_WRITE_TOKEN env var to be set in Vercel (automatically
 * provided once Blob storage is enabled for the project) for the production path.
 */
export const saveUploadedFile = async (file, uploadsDir) => {
  const filename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;

  if (isVercel) {
    const { put } = await import('@vercel/blob');
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype
    });
    return blob.url;
  }

  const destPath = path.join(uploadsDir, filename);
  fs.writeFileSync(destPath, file.buffer);
  return `/uploads/${filename}`;
};
