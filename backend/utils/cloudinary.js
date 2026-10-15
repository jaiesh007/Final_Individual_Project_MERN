const crypto = require("crypto");

async function uploadToCloudinary(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Cloudinary environment variables are missing");
    error.code = "CLOUDINARY_NOT_CONFIGURED";
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "artisan-marketplace/products";
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body: formData }
  );
  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    console.error("Cloudinary upload failed:", result.error?.message || response.statusText);
    const error = new Error("Cloudinary image upload failed");
    error.code = "CLOUDINARY_UPLOAD_FAILED";
    throw error;
  }

  return result.secure_url;
}

module.exports = uploadToCloudinary;
