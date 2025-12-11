import { authClient } from "./auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Event Types
export type EventType =
  | "SHEVA_BERAKHOT"
  | "SHABBAT"
  | "BRIT_MILA"
  | "BAR_MITZVAH"
  | "OTHER";

export type EventRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface User {
  id: string;
  name: string | null;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  date: string;
  endDate: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  maxParticipants: number;
  currentCount: number;
  organizerId: string;
  organizer: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    requests: number;
  };
}

export interface EventRequest {
  id: string;
  status: EventRequestStatus;
  message: string | null;
  eventId: string;
  userId: string;
  user: User;
  event?: Event;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  type: EventType;
  date: string;
  endDate?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  maxParticipants?: number;
}

// Use authClient's $fetch which handles cookies/auth automatically
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  
  const response = await authClient.$fetch<T>(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  
  return response.data as T;
};

// Events API
export const eventsApi = {
  getAll: async (filters?: {
    type?: EventType;
    city?: string;
    date?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.city) params.append("city", filters.city);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.lat) params.append("lat", filters.lat.toString());
    if (filters?.lng) params.append("lng", filters.lng.toString());
    if (filters?.radius) params.append("radius", filters.radius.toString());

    const queryString = params.toString();
    return apiFetch<Event[]>(`/api/events${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id: string): Promise<Event & { requests: EventRequest[] }> => {
    return apiFetch<Event & { requests: EventRequest[] }>(`/api/events/${id}`);
  },

  getMyEvents: async (): Promise<Event[]> => {
    return apiFetch<Event[]>("/api/events/my/organized");
  },

  create: async (data: CreateEventData): Promise<Event> => {
    return apiFetch<Event>("/api/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateEventData>): Promise<Event> => {
    return apiFetch<Event>(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<{ success: boolean }>(`/api/events/${id}`, {
      method: "DELETE",
    });
  },
};

// Requests API
export const requestsApi = {
  create: async (eventId: string, message?: string): Promise<EventRequest> => {
    return apiFetch<EventRequest>(`/api/requests/${eventId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  getMyRequests: async (): Promise<EventRequest[]> => {
    return apiFetch<EventRequest[]>("/api/requests/my");
  },

  getEventRequests: async (eventId: string): Promise<EventRequest[]> => {
    return apiFetch<EventRequest[]>(`/api/requests/event/${eventId}`);
  },

  accept: async (requestId: string): Promise<EventRequest> => {
    return apiFetch<EventRequest>(`/api/requests/${requestId}/accept`, {
      method: "PUT",
    });
  },

  reject: async (requestId: string): Promise<EventRequest> => {
    return apiFetch<EventRequest>(`/api/requests/${requestId}/reject`, {
      method: "PUT",
    });
  },

  cancel: async (requestId: string): Promise<void> => {
    await apiFetch<{ success: boolean }>(`/api/requests/${requestId}`, {
      method: "DELETE",
    });
  },
};

// Event type labels
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SHEVA_BERAKHOT: "Sheva Berakhot",
  SHABBAT: "Shabbat",
  BRIT_MILA: "Brit Mila",
  BAR_MITZVAH: "Bar Mitzvah",
  OTHER: "Autre",
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  SHEVA_BERAKHOT: "💒",
  SHABBAT: "🕯️",
  BRIT_MILA: "👶",
  BAR_MITZVAH: "📖",
  OTHER: "✡️",
};
