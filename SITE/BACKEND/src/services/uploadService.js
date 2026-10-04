import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} public_id - Cloudinary public_id
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder, public_id) =>
  new Promise((resolve, reject) => {
    // 30 second timeout to prevent hanging requests
    const timer = setTimeout(() => {
      reject(new Error("Cloudinary upload timed out"));
    }, 30000);

    const uploader = cloudinary?.uploader || cloudinary?.default?.uploader;
    if (!uploader || typeof uploader.upload_stream !== 'function') {
      clearTimeout(timer);
      return reject(new Error('Cloudinary uploader not configured'));
    }

    try {
      const stream = uploader.upload_stream(
        { folder, public_id, overwrite: true, invalidate: true, timeout: 30000 },
        (error, result) => {
          clearTimeout(timer);
          if (error) return reject(error);
          resolve(result);
        }
      );

      // Handle stream-level errors that might bypass the callback
      stream.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      stream.end(buffer);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });

export { uploadToCloudinary };
export default { uploadToCloudinary };
