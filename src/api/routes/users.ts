import { Router } from "express";
import prisma from "../../lib/prisma";
import { userGuard, AuthenticatedRequest } from "../middleware/userGuard";
import {
  uploadIdDocument,
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

    await prisma.user.update({
      where: { id: authReq.user.id },
      data: { pushToken },
    });

    console.log(`Push token updated for user ${authReq.user.id}`);
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
        profileCompleted: true,
        idDocumentUrl: true,
        idUploadedAt: true,
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
    const { url, publicId } = await uploadIdDocument(image, authReq.user.id);

    // Update user with new ID document info
    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        idDocumentUrl: url,
        idDocumentId: publicId,
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

// Get ID document for a specific user (only accessible by event organizers for their event requests)
router.get("/:userId/id-document", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = req.params;

    // User can always view their own ID document
    if (userId === authReq.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { idDocumentId: true, idDocumentUrl: true },
      });

      if (!user?.idDocumentId) {
        return res.status(404).json({ error: "No ID document found" });
      }

      const signedUrl = getSignedIdDocumentUrl(user.idDocumentId);
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
      select: { idDocumentId: true },
    });

    if (!user?.idDocumentId) {
      return res.status(404).json({ error: "No ID document found for this user" });
    }

    // Generate signed URL
    const signedUrl = getSignedIdDocumentUrl(user.idDocumentId);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Error fetching ID document:", error);
    res.status(500).json({ error: "Failed to fetch ID document" });
  }
});

export default router;
