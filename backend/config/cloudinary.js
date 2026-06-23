const crypto = require('crypto');

const requiredCloudinaryEnv = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment variables are not configured');
  }
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
};

const createSignature = (params, apiSecret) => {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
};

const uploadBuffer = async (file, folder, resourceType) => {
  const { cloudName, apiKey, apiSecret } = requiredCloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = createSignature(params, apiSecret);
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: form
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }
  return data.secure_url;
};

exports.uploadImageBuffer = async (file, folder = 'marketplace/provider-profiles') => {
  return uploadBuffer(file, folder, 'image');
};

exports.uploadDeliveryBuffer = async (file, folder = 'marketplace/deliveries') => {
  return uploadBuffer(file, folder, 'auto');
};
