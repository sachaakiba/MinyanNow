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

// Folders for documents (private)
export const ID_DOCUMENTS_FOLDER = "minyannow/id-documents";
export const KETOUBA_DOCUMENTS_FOLDER = "minyannow/ketouba-documents";
export const SELFIE_DOCUMENTS_FOLDER = "minyannow/selfie-documents";

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

// Upload a Ketouba document
export const uploadKetoubaDocument = async (
  base64Image: string,
  userId: string
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: KETOUBA_DOCUMENTS_FOLDER,
    public_id: `ketouba_${userId}_${Date.now()}`,
    resource_type: "image",
    type: "authenticated",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

// Upload a Selfie document
export const uploadSelfieDocument = async (
  base64Image: string,
  userId: string
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: SELFIE_DOCUMENTS_FOLDER,
    public_id: `selfie_${userId}_${Date.now()}`,
    resource_type: "image",
    type: "authenticated",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export default cloudinary;
