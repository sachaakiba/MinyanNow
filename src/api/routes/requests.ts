import { Router } from "express";
import prisma from "../../lib/prisma";
import { userGuard, AuthenticatedRequest } from "../middleware/userGuard";
import {
  sendPushNotification,
  NotificationTemplates,
} from "../services/notifications";

const router = Router();

// Create a request to join an event
router.post("/:eventId", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;
    const { message } = req.body;

    // Check if user has all required documents
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      select: {
        idDocumentUrl: true,
        ketoubaDocumentUrl: true,
        selfieDocumentUrl: true,
      },
    });

    if (!user?.idDocumentUrl || !user?.ketoubaDocumentUrl || !user?.selfieDocumentUrl) {
      return res.status(403).json({
        error: "Missing required documents",
        message: "You must upload all required documents (ID, Ketouba, and Selfie) before requesting to join an event",
        code: "MISSING_DOCUMENTS",
      });
    }

    // Check if event exists with organizer info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, pushToken: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Can't request to join your own event
    if (event.organizerId === authReq.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot request to join your own event" });
    }

    // Check if already requested
    const existingRequest = await prisma.eventRequest.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: authReq.user.id,
        },
      },
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ error: "You have already requested to join this event" });
    }

    // Check if event is full
    const acceptedCount = await prisma.eventRequest.count({
      where: { eventId, status: "ACCEPTED" },
    });

    if (acceptedCount >= event.maxParticipants) {
      return res.status(400).json({ error: "This event is already full" });
    }

    const request = await prisma.eventRequest.create({
      data: {
        eventId,
        userId: authReq.user.id,
        message,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    });

    console.log("✅ Request created:", {
      requestId: request.id,
      eventTitle: event.title,
      participant: request.user.name || request.user.email,
      organizerPushToken: event.organizer.pushToken ? "Present" : "Missing",
    });

    // 🔔 Send notification to organizer
    const participantName = request.user.name || request.user.email;
    const notification = NotificationTemplates.newRequest(
      participantName,
      event.title
    );

    if (event.organizer.pushToken) {
      console.log("📱 Sending push notification to organizer...");
      await sendPushNotification(event.organizer.pushToken, {
        ...notification,
        data: { type: "new_request", eventId: event.id, requestId: request.id },
      });
    } else {
      console.log("⚠️ No push token for organizer, skipping notification");
    }

    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// Get my requests (as participant)
router.get("/my", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const requests = await prisma.eventRequest.findMany({
      where: { userId: authReq.user.id },
      include: {
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Get requests for an event (only organizer)
router.get("/event/:eventId", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.organizerId !== authReq.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these requests" });
    }

    const requests = await prisma.eventRequest.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching event requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// Accept a request (only organizer)
router.put("/:requestId/accept", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { requestId } = req.params;

    const request = await prisma.eventRequest.findUnique({
      where: { id: requestId },
      include: {
        event: true,
        user: {
          select: { id: true, name: true, email: true, pushToken: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.event.organizerId !== authReq.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to accept this request" });
    }

    // Check if event is full
    const acceptedCount = await prisma.eventRequest.count({
      where: { eventId: request.eventId, status: "ACCEPTED" },
    });

    if (acceptedCount >= request.event.maxParticipants) {
      return res.status(400).json({ error: "Event is already full" });
    }

    const updatedRequest = await prisma.eventRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 🔔 Send notification to participant
    const notification = NotificationTemplates.requestAccepted(
      request.event.title
    );
    await sendPushNotification(request.user.pushToken, {
      ...notification,
      data: { type: "request_accepted", eventId: request.eventId },
    });

    // Calculate current count (initial participants + accepted requests)
    const newAcceptedCount = acceptedCount + 1;
    const currentCount =
      request.event.initialParticipants.length + newAcceptedCount;

    // 🔔 If event is now full, notify organizer
    if (currentCount >= request.event.maxParticipants) {
      const organizer = await prisma.user.findUnique({
        where: { id: request.event.organizerId },
        select: { pushToken: true },
      });
      const fullNotification = NotificationTemplates.eventFull(
        request.event.title
      );
      await sendPushNotification(organizer?.pushToken, {
        ...fullNotification,
        data: { type: "event_full", eventId: request.eventId },
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// Reject a request (only organizer)
router.put("/:requestId/reject", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { requestId } = req.params;

    const request = await prisma.eventRequest.findUnique({
      where: { id: requestId },
      include: {
        event: true,
        user: {
          select: { id: true, name: true, email: true, pushToken: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.event.organizerId !== authReq.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to reject this request" });
    }

    const updatedRequest = await prisma.eventRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 🔔 Send notification to participant
    const notification = NotificationTemplates.requestRejected(
      request.event.title
    );
    await sendPushNotification(request.user.pushToken, {
      ...notification,
      data: { type: "request_rejected", eventId: request.eventId },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// Cancel my request
router.delete("/:requestId", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { requestId } = req.params;

    const request = await prisma.eventRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.userId !== authReq.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this request" });
    }

    await prisma.eventRequest.delete({
      where: { id: requestId },
    });

    res.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({ error: "Failed to cancel request" });
  }
});

export default router;
