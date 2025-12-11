import { Router } from "express";
import prisma from "../../lib/prisma";
import { userGuard, AuthenticatedRequest } from "../middleware/userGuard";

const router = Router();

// Get my events (as organizer) - MUST be before /:id
router.get("/my/organized", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const events = await prisma.event.findMany({
      where: { organizerId: authReq.user.id },
      include: {
        _count: {
          select: {
            requests: { where: { status: "PENDING" } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching my events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get all events (public, with filters)
router.get("/", async (req, res) => {
  try {
    const { type, city, date, lat, lng, radius, includeFull } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    if (date) {
      const dateObj = new Date(date as string);
      where.date = {
        gte: dateObj,
        lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { requests: { where: { status: "ACCEPTED" } } },
        },
      },
      orderBy: { date: "asc" },
    });

    // Filter out full events (unless includeFull=true)
    let filteredEvents = events;
    if (includeFull !== "true") {
      filteredEvents = events.filter(
        (event) => event.currentCount < event.maxParticipants
      );
    }

    // Filter by radius if coordinates provided
    if (lat && lng && radius) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = parseFloat(radius as string); // in km

      filteredEvents = filteredEvents.filter((event) => {
        const distance = getDistanceFromLatLonInKm(
          userLat,
          userLng,
          event.latitude,
          event.longitude
        );
        return distance <= maxRadius;
      });
    }

    res.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get single event
router.get("/:id", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        requests: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Create event (protected)
router.post("/", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      title,
      description,
      type,
      date,
      endDate,
      address,
      city,
      latitude,
      longitude,
      maxParticipants,
    } = req.body;

    if (!title || !type || !date || !address || !city || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        address,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        maxParticipants: maxParticipants || 10,
        organizerId: authReq.user.id,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update event (protected, only organizer)
router.put("/:id", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const eventId = req.params.id;

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (existingEvent.organizerId !== authReq.user.id) {
      return res.status(403).json({ error: "Not authorized to update this event" });
    }

    const {
      title,
      description,
      type,
      date,
      endDate,
      address,
      city,
      latitude,
      longitude,
      maxParticipants,
    } = req.body;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(date && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(address && { address }),
        ...(city && { city }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(maxParticipants && { maxParticipants }),
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event (protected, only organizer)
router.delete("/:id", userGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const eventId = req.params.id;

    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (existingEvent.organizerId !== authReq.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this event" });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Helper function to calculate distance
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
