import { Router } from "express";
import prisma from "../../lib/prisma";
import { adminGuard, AdminRequest } from "../middleware/adminGuard";
import { getSignedIdDocumentUrl } from "../../lib/cloudinary";

const router = Router();

// All admin routes require SUPER_ADMIN role
router.use(adminGuard);

/**
 * GET /api/admin/pending-documents
 * Get list of users with pending documents
 */
router.get("/pending-documents", async (req, res) => {
  try {
    const { type } = req.query; // 'id', 'ketouba', 'selfie', or undefined for all

    let whereClause: any = {};

    if (type === "id") {
      whereClause = { idVerificationStatus: "PENDING", idDocumentUrl: { not: null } };
    } else if (type === "ketouba") {
      whereClause = { ketoubaVerificationStatus: "PENDING", ketoubaDocumentUrl: { not: null } };
    } else if (type === "selfie") {
      whereClause = { selfieVerificationStatus: "PENDING", selfieDocumentUrl: { not: null } };
    } else {
      // All pending documents
      whereClause = {
        OR: [
          { idVerificationStatus: "PENDING", idDocumentUrl: { not: null } },
          { ketoubaVerificationStatus: "PENDING", ketoubaDocumentUrl: { not: null } },
          { selfieVerificationStatus: "PENDING", selfieDocumentUrl: { not: null } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        // ID Document
        idDocumentUrl: true,
        idDocumentId: true,
        idUploadedAt: true,
        idVerificationStatus: true,
        // Ketouba
        ketoubaDocumentUrl: true,
        ketoubaDocumentId: true,
        ketoubaUploadedAt: true,
        ketoubaVerificationStatus: true,
        // Selfie
        selfieDocumentUrl: true,
        selfieDocumentId: true,
        selfieUploadedAt: true,
        selfieVerificationStatus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({ error: "Failed to fetch pending documents" });
  }
});

/**
 * GET /api/admin/users/:userId/document/:documentType
 * Get signed URL for viewing a document
 */
router.get("/users/:userId/document/:documentType", async (req, res) => {
  try {
    const { userId, documentType } = req.params;

    if (!["id", "ketouba", "selfie"].includes(documentType)) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        idDocumentId: true,
        ketoubaDocumentId: true,
        selfieDocumentId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let publicId: string | null = null;
    if (documentType === "id") publicId = user.idDocumentId;
    else if (documentType === "ketouba") publicId = user.ketoubaDocumentId;
    else if (documentType === "selfie") publicId = user.selfieDocumentId;

    if (!publicId) {
      return res.status(404).json({ error: "Document not found" });
    }

    const signedUrl = getSignedIdDocumentUrl(publicId);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Error getting document URL:", error);
    res.status(500).json({ error: "Failed to get document URL" });
  }
});

/**
 * POST /api/admin/verify-document
 * Approve or reject a document
 */
router.post("/verify-document", async (req, res) => {
  try {
    const adminReq = req as AdminRequest;
    const { userId, documentType, action, rejectionReason } = req.body;

    // Validate input
    if (!userId || !documentType || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["id", "ketouba", "selfie"].includes(documentType)) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "reject" && !rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    // Build update data based on document type
    const now = new Date();
    let updateData: any = {};

    if (documentType === "id") {
      updateData = {
        idVerificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
        idVerifiedAt: now,
        idVerifiedBy: adminReq.admin.id,
        idRejectionReason: action === "reject" ? rejectionReason : null,
      };
    } else if (documentType === "ketouba") {
      updateData = {
        ketoubaVerificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
        ketoubaVerifiedAt: now,
        ketoubaVerifiedBy: adminReq.admin.id,
        ketoubaRejectionReason: action === "reject" ? rejectionReason : null,
      };
    } else if (documentType === "selfie") {
      updateData = {
        selfieVerificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
        selfieVerifiedAt: now,
        selfieVerifiedBy: adminReq.admin.id,
        selfieRejectionReason: action === "reject" ? rejectionReason : null,
      };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        idVerificationStatus: true,
        ketoubaVerificationStatus: true,
        selfieVerificationStatus: true,
      },
    });

    console.log(
      `Document ${documentType} ${action}ed for user ${userId} by admin ${adminReq.admin.id}`
    );

    res.json({
      success: true,
      message: `Document ${action === "approve" ? "approved" : "rejected"} successfully`,
      user,
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ error: "Failed to verify document" });
  }
});

export default router;
