import { Router } from "express";
import prisma from "../../lib/prisma";
import { userGuard, AuthenticatedRequest } from "../middleware/userGuard";
import {
  uploadIdDocument,
  uploadKetoubaDocument,
  uploadSelfieDocument,
  getSignedIdDocumentUrl,
  deleteIdDocument,
} from "../../lib/cloudinary";

const router = Router();

// Update push token for the current user
router.post("/push-token", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: "Push token is required" });
    }

    // IMPORTANT: Clear this push token from ALL other users first.
    // This prevents the case where user A logs in on a device, then user B
    // logs in on the same device — both would have the same token,
    // causing user B to receive user A's notifications.
    await prisma.user.updateMany({
      where: {
        pushToken: pushToken,
        id: { not: authReq.user.id },
      },
      data: { pushToken: null },
    });

    await prisma.user.update({
      where: { id: authReq.user.id },
      data: { pushToken },
    });

    console.log(`Push token updated for user ${authReq.user.id} (cleared from other users)`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ error: "Failed to update push token" });
  }
});

// Get current user profile
router.get("/me", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        hebrewName: true,
        dateOfBirth: true,
        barMitzvahParasha: true,
        synagogue: true,
        community: true,
        language: true,
        profileCompleted: true,
        role: true,
        idDocumentUrl: true,
        idDocumentId: true,
        idDocumentResourceType: true,
        idUploadedAt: true,
        ketoubaDocumentUrl: true,
        ketoubaDocumentId: true,
        ketoubaDocumentResourceType: true,
        ketoubaUploadedAt: true,
        selfieDocumentUrl: true,
        selfieDocumentId: true,
        selfieDocumentResourceType: true,
        selfieUploadedAt: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Complete user profile
router.put("/profile", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    console.log("📝 Profile update request body:", req.body);

    const {
      firstName,
      lastName,
      hebrewName,
      dateOfBirth,
      synagogue,
    } = req.body;

    console.log("📝 Parsed fields:", { firstName, lastName, hebrewName, dateOfBirth, synagogue });

    // Validation
    if (!firstName || !lastName || !dateOfBirth) {
      console.log("❌ Validation failed - missing fields");
      return res.status(400).json({
        error: "Les champs obligatoires sont: firstName, lastName, dateOfBirth",
      });
    }

    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        firstName,
        lastName,
        hebrewName: hebrewName || null,
        dateOfBirth: new Date(dateOfBirth),
        synagogue: synagogue || null,
        profileCompleted: true,
        name: `${firstName} ${lastName}`, // Met aussi à jour le champ name
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        hebrewName: true,
        dateOfBirth: true,
        synagogue: true,
        profileCompleted: true,
      },
    });

    console.log(`Profile completed for user ${authReq.user.id}`);
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update user language preference
router.put("/language", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { language } = req.body;

    // Validate language code
    const validLanguages = ["fr", "en", "he"];
    if (!language || !validLanguages.includes(language)) {
      return res.status(400).json({
        error: "Invalid language. Must be one of: fr, en, he",
      });
    }

    await prisma.user.update({
      where: { id: authReq.user.id },
      data: { language },
    });

    console.log(`Language updated to ${language} for user ${authReq.user.id}`);
    res.json({ success: true, language });
  } catch (error) {
    console.error("Error updating language:", error);
    res.status(500).json({ error: "Failed to update language" });
  }
});

// Upload ID document
router.post("/id-document", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { image } = req.body; // Base64 image

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Check if user already has an ID document and delete it
    const existingUser = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { idDocumentId: true },
    });

    if (existingUser?.idDocumentId) {
      try {
        await deleteIdDocument(existingUser.idDocumentId);
      } catch (error) {
        console.error("Error deleting old ID document:", error);
      }
    }

    // Upload new ID document
    const { url, publicId, resourceType } = await uploadIdDocument(image, authReq.user.id);

    // Update user with new ID document info
    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        idDocumentUrl: url,
        idDocumentId: publicId,
        idDocumentResourceType: resourceType,
        idUploadedAt: new Date(),
      },
      select: {
        id: true,
        idDocumentUrl: true,
        idUploadedAt: true,
      },
    });

    console.log(`ID document uploaded for user ${authReq.user.id}`);
    res.json({ success: true, idUploadedAt: user.idUploadedAt });
  } catch (error) {
    console.error("Error uploading ID document:", error);
    res.status(500).json({ error: "Failed to upload ID document" });
  }
});

// Upload Ketouba document
router.post("/ketouba-document", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { image } = req.body; // Base64 image

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Check if user already has a Ketouba document and delete it
    const existingUser = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { ketoubaDocumentId: true },
    });

    if (existingUser?.ketoubaDocumentId) {
      try {
        await deleteIdDocument(existingUser.ketoubaDocumentId);
      } catch (error) {
        console.error("Error deleting old Ketouba document:", error);
      }
    }

    // Upload new Ketouba document
    const { url, publicId, resourceType } = await uploadKetoubaDocument(image, authReq.user.id);

    // Update user with new Ketouba document info
    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        ketoubaDocumentUrl: url,
        ketoubaDocumentId: publicId,
        ketoubaDocumentResourceType: resourceType,
        ketoubaUploadedAt: new Date(),
      },
      select: {
        id: true,
        ketoubaDocumentUrl: true,
        ketoubaUploadedAt: true,
      },
    });

    console.log(`Ketouba document uploaded for user ${authReq.user.id}`);
    res.json({ success: true, ketoubaUploadedAt: user.ketoubaUploadedAt });
  } catch (error) {
    console.error("Error uploading Ketouba document:", error);
    res.status(500).json({ error: "Failed to upload Ketouba document" });
  }
});

// Upload Selfie document
router.post("/selfie-document", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { image } = req.body; // Base64 image

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Check if user already has a Selfie document and delete it
    const existingUser = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: { selfieDocumentId: true },
    });

    if (existingUser?.selfieDocumentId) {
      try {
        await deleteIdDocument(existingUser.selfieDocumentId);
      } catch (error) {
        console.error("Error deleting old Selfie document:", error);
      }
    }

    // Upload new Selfie document
    const { url, publicId, resourceType } = await uploadSelfieDocument(image, authReq.user.id);

    // Update user with new Selfie document info
    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        selfieDocumentUrl: url,
        selfieDocumentId: publicId,
        selfieDocumentResourceType: resourceType,
        selfieUploadedAt: new Date(),
      },
      select: {
        id: true,
        selfieDocumentUrl: true,
        selfieUploadedAt: true,
      },
    });

    console.log(`Selfie document uploaded for user ${authReq.user.id}`);
    res.json({ success: true, selfieUploadedAt: user.selfieUploadedAt });
  } catch (error) {
    console.error("Error uploading Selfie document:", error);
    res.status(500).json({ error: "Failed to upload Selfie document" });
  }
});

// Get notification preferences
router.get("/notification-preferences", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        notificationsEnabled: true,
        notifyProximity: true,
        notifyNewRequests: true,
        notifyRequestStatus: true,
        notifyEventUpdates: true,
        notifyEventReminders: true,
        proximityRadius: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// Update notification preferences
router.put("/notification-preferences", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      notificationsEnabled,
      notifyProximity,
      notifyNewRequests,
      notifyRequestStatus,
      notifyEventUpdates,
      notifyEventReminders,
      proximityRadius,
    } = req.body;

    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        notificationsEnabled,
        notifyProximity,
        notifyNewRequests,
        notifyRequestStatus,
        notifyEventUpdates,
        notifyEventReminders,
        proximityRadius: Math.min(Math.max(proximityRadius || 500, 100), 2000), // Clamp between 100-2000
      },
      select: {
        notificationsEnabled: true,
        notifyProximity: true,
        notifyNewRequests: true,
        notifyRequestStatus: true,
        notifyEventUpdates: true,
        notifyEventReminders: true,
        proximityRadius: true,
      },
    });

    console.log(`Notification preferences updated for user ${authReq.user.id}`);
    res.json(user);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

// Update user location (for proximity notifications)
router.post("/location", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ error: "Valid latitude and longitude are required" });
    }

    await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        lastKnownLatitude: latitude,
        lastKnownLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Get ID document for a specific user (only accessible by event organizers for their event requests)
router.get("/:userId/id-document", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;

    // User can always view their own ID document
    if (userId === authReq.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { idDocumentId: true, idDocumentResourceType: true, idDocumentUrl: true },
      });

      if (!user?.idDocumentId) {
        return res.status(404).json({ error: "No ID document found" });
      }

      const signedUrl = getSignedIdDocumentUrl(user.idDocumentId, user.idDocumentResourceType || "image");
      return res.json({ url: signedUrl });
    }

    // Check if the requesting user is an organizer of an event where the target user has a pending request
    const pendingRequest = await prisma.eventRequest.findFirst({
      where: {
        userId: userId,
        status: "PENDING",
        event: {
          organizerId: authReq.user.id,
        },
      },
    });

    if (!pendingRequest) {
      return res.status(403).json({
        error: "Vous ne pouvez voir la pièce d'identité que des demandeurs de vos événements",
      });
    }

    // Get the user's ID document
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { idDocumentId: true, idDocumentResourceType: true },
    });

    if (!user?.idDocumentId) {
      return res.status(404).json({ error: "No ID document found for this user" });
    }

    // Generate signed URL
    const signedUrl = getSignedIdDocumentUrl(user.idDocumentId, user.idDocumentResourceType || "image");
    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Error fetching ID document:", error);
    res.status(500).json({ error: "Failed to fetch ID document" });
  }
});

// Delete user account and all associated data
router.delete("/me", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    console.log(`🗑️ Account deletion requested for user ${userId}`);

    // Get user's Cloudinary document IDs before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        idDocumentId: true,
        ketoubaDocumentId: true,
        selfieDocumentId: true,
      },
    });

    // Delete Cloudinary documents if they exist
    const cloudinaryDeletions: Promise<void>[] = [];
    
    if (user?.idDocumentId) {
      cloudinaryDeletions.push(
        deleteIdDocument(user.idDocumentId).catch((err) => {
          console.error("Error deleting ID document from Cloudinary:", err);
        })
      );
    }
    
    if (user?.ketoubaDocumentId) {
      cloudinaryDeletions.push(
        deleteIdDocument(user.ketoubaDocumentId).catch((err) => {
          console.error("Error deleting Ketouba document from Cloudinary:", err);
        })
      );
    }
    
    if (user?.selfieDocumentId) {
      cloudinaryDeletions.push(
        deleteIdDocument(user.selfieDocumentId).catch((err) => {
          console.error("Error deleting Selfie document from Cloudinary:", err);
        })
      );
    }

    // Wait for all Cloudinary deletions (non-blocking errors)
    await Promise.all(cloudinaryDeletions);

    // Delete user from database (cascades to sessions, accounts, events, event requests)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`✅ Account deleted successfully for user ${userId}`);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Get all documents for a specific user (ID, Ketouba, Selfie)
router.get("/:userId/documents", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;

    // User can always view their own documents
    if (userId !== authReq.user.id) {
      // Check if the requesting user is an organizer of an event where the target user has a pending request
      const pendingRequest = await prisma.eventRequest.findFirst({
        where: {
          userId: userId,
          status: "PENDING",
          event: {
            organizerId: authReq.user.id,
          },
        },
      });

      if (!pendingRequest) {
        return res.status(403).json({
          error: "Vous ne pouvez voir les documents que des demandeurs de vos événements",
        });
      }
    }

    // Get all user's documents
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        idDocumentId: true,
        idDocumentResourceType: true,
        idUploadedAt: true,
        ketoubaDocumentId: true,
        ketoubaDocumentResourceType: true,
        ketoubaUploadedAt: true,
        selfieDocumentId: true,
        selfieDocumentResourceType: true,
        selfieUploadedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate signed URLs for each document
    const documents = {
      idDocument: user.idDocumentId
        ? {
          url: getSignedIdDocumentUrl(user.idDocumentId, user.idDocumentResourceType || "image"),
          uploadedAt: user.idUploadedAt,
        }
        : null,
      ketoubaDocument: user.ketoubaDocumentId
        ? {
          url: getSignedIdDocumentUrl(user.ketoubaDocumentId, user.ketoubaDocumentResourceType || "image"),
          uploadedAt: user.ketoubaUploadedAt,
        }
        : null,
      selfieDocument: user.selfieDocumentId
        ? {
          url: getSignedIdDocumentUrl(user.selfieDocumentId, user.selfieDocumentResourceType || "image"),
          uploadedAt: user.selfieUploadedAt,
        }
        : null,
    };

    res.json(documents);
  } catch (error) {
    console.error("Error fetching user documents:", error);
    res.status(500).json({ error: "Failed to fetch user documents" });
  }
});

export default router;
