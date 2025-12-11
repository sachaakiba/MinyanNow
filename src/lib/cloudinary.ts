import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// Debug: log cloudinary config (remove in production)
console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4) : "NOT SET",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "***" + process.env.CLOUDINARY_API_SECRET.slice(-4) : "NOT SET",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder for ID documents (private)
export const ID_DOCUMENTS_FOLDER = "minyannow/id-documents";

// Upload an ID document
export const uploadIdDocument = async (
  base64Image: string,
  userId: string
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: ID_DOCUMENTS_FOLDER,
    public_id: `id_${userId}_${Date.now()}`,
    resource_type: "image",
    type: "authenticated", // Authenticated upload - requires signed URL to access
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

// Generate a signed URL for viewing (expires in 1 hour)
export const getSignedIdDocumentUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
};

// Delete an ID document
export const deleteIdDocument = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { type: "authenticated" });
};

export default cloudinary;
