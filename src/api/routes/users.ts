import { Router } from "express";
import prisma from "../../lib/prisma";
import { userGuard, AuthenticatedRequest } from "../middleware/userGuard";

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
    const {
      firstName,
      lastName,
      hebrewName,
      dateOfBirth,
      barMitzvahParasha,
      synagogue,
      community,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !barMitzvahParasha || !community) {
      return res.status(400).json({
        error: "Les champs obligatoires sont: firstName, lastName, dateOfBirth, barMitzvahParasha, community",
      });
    }

    const user = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        firstName,
        lastName,
        hebrewName: hebrewName || null,
        dateOfBirth: new Date(dateOfBirth),
        barMitzvahParasha,
        synagogue: synagogue || null,
        community,
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
        barMitzvahParasha: true,
        synagogue: true,
        community: true,
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

export default router;
