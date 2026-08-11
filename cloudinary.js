const cloudinary = require("cloudinary").v2;
const fs = require("fs");

let enabled = false;

function configure() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return;
  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
  enabled = true;
}

function isEnabled() {
  return enabled;
}

async function uploadFile(filePath, publicId) {
  if (!enabled) throw new Error("cloudinary not configured");
  const res = await cloudinary.uploader.upload(filePath, {
    folder: "leadsite",
    public_id: publicId,
    overwrite: true,
    resource_type: "image"
  });
  return res.secure_url;
}

async function downloadToFile(url, destPath) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("cloudinary fetch failed: " + resp.status);
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

module.exports = { configure, isEnabled, uploadFile, downloadToFile };
