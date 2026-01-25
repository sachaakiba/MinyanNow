import Constants from "expo-constants";
import { authClient } from "./auth-client";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000";

// Debug: Log the API URL being used
console.log("🔗 API_URL configured:", API_URL);
console.log("📦 Constants.expoConfig?.extra?.apiUrl:", Constants.expoConfig?.extra?.apiUrl);
console.log("🌍 process.env.EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL);
// Event Types
export type EventType =
  | "SHEVA_BERAKHOT"
  | "BRIT_MILA"
  | "MINCHA"
  | "ARVIT"
  | "OTHER";

export type EventRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface User {
  id: string;
  name: string | null;
  email: string;
  idDocumentUrl?: string | null;
  idUploadedAt?: string | null;
  ketoubaDocumentUrl?: string | null;
  ketoubaUploadedAt?: string | null;
  selfieDocumentUrl?: string | null;
  selfieUploadedAt?: string | null;
}

export interface UserDocuments {
  idDocument: { url: string; uploadedAt: string | null } | null;
  ketoubaDocument: { url: string; uploadedAt: string | null } | null;
  selfieDocument: { url: string; uploadedAt: string | null } | null;
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
  initialParticipants: string[] | null;
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
  initialParticipants?: string[];
}

// Use authClient's $fetch which handles cookies/auth automatically
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await authClient.$fetch<T>(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    return response.data as T;
  } catch (error: any) {
    // Don't throw 403 errors as authentication errors - they're permission errors
    if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
      throw new Error(error.message || "Forbidden - Admin access required");
    }
    throw error;
  }
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

  removeInitialParticipant: async (
    id: string,
    participantIndex: number
  ): Promise<Event & { requests: EventRequest[] }> => {
    return apiFetch<Event & { requests: EventRequest[] }>(
      `/api/events/${id}/participants/${participantIndex}`,
      {
        method: "DELETE",
      }
    );
  },

  addInitialParticipant: async (
    id: string,
    name: string
  ): Promise<Event & { requests: EventRequest[] }> => {
    return apiFetch<Event & { requests: EventRequest[] }>(
      `/api/events/${id}/participants`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    );
  },

  updateInitialParticipant: async (
    id: string,
    participantIndex: number,
    name: string
  ): Promise<Event & { requests: EventRequest[] }> => {
    return apiFetch<Event & { requests: EventRequest[] }>(
      `/api/events/${id}/participants/${participantIndex}`,
      {
        method: "PUT",
        body: JSON.stringify({ name }),
      }
    );
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

// Users API
export const usersApi = {
  uploadIdDocument: async (
    base64Image: string
  ): Promise<{ success: boolean; idUploadedAt: string }> => {
    return apiFetch<{ success: boolean; idUploadedAt: string }>(
      "/api/users/id-document",
      {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
      }
    );
  },

  uploadKetoubaDocument: async (
    base64Image: string
  ): Promise<{ success: boolean; ketoubaUploadedAt: string }> => {
    return apiFetch<{ success: boolean; ketoubaUploadedAt: string }>(
      "/api/users/ketouba-document",
      {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
      }
    );
  },

  uploadSelfieDocument: async (
    base64Image: string
  ): Promise<{ success: boolean; selfieUploadedAt: string }> => {
    return apiFetch<{ success: boolean; selfieUploadedAt: string }>(
      "/api/users/selfie-document",
      {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
      }
    );
  },

  getIdDocument: async (userId: string): Promise<{ url: string }> => {
    return apiFetch<{ url: string }>(`/api/users/${userId}/id-document`);
  },

  getUserDocuments: async (userId: string): Promise<UserDocuments> => {
    return apiFetch<UserDocuments>(`/api/users/${userId}/documents`);
  },

  getMe: async (): Promise<{
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    role?: "USER" | "SUPER_ADMIN";
    firstName: string | null;
    lastName: string | null;
    hebrewName: string | null;
    dateOfBirth: string | null;
    barMitzvahParasha: string | null;
    synagogue: string | null;
    community: string | null;
    profileCompleted: boolean;
    idDocumentUrl: string | null;
    idUploadedAt: string | null;
    idVerificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
    idRejectionReason?: string | null;
    ketoubaDocumentUrl: string | null;
    ketoubaUploadedAt: string | null;
    ketoubaVerificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
    ketoubaRejectionReason?: string | null;
    selfieDocumentUrl: string | null;
    selfieUploadedAt: string | null;
    selfieVerificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
    selfieRejectionReason?: string | null;
  }> => {
    return apiFetch("/api/users/me");
  },

  getNotificationPreferences: async (): Promise<{
    notificationsEnabled: boolean;
    notifyProximity: boolean;
    notifyNewRequests: boolean;
    notifyRequestStatus: boolean;
    notifyEventUpdates: boolean;
    notifyEventReminders: boolean;
    proximityRadius: number;
  }> => {
    return apiFetch("/api/users/notification-preferences");
  },

  updateNotificationPreferences: async (preferences: {
    notificationsEnabled: boolean;
    notifyProximity: boolean;
    notifyNewRequests: boolean;
    notifyRequestStatus: boolean;
    notifyEventUpdates: boolean;
    notifyEventReminders: boolean;
    proximityRadius: number;
  }): Promise<void> => {
    await apiFetch("/api/users/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  },

  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await apiFetch("/api/users/location", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    hebrewName?: string;
    dateOfBirth: string;
    synagogue?: string;
  }): Promise<void> => {
    await apiFetch("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// Event type labels
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SHEVA_BERAKHOT: "Sheva Berakhot",
  BRIT_MILA: "Brit Mila",
  MINCHA: "Min'ha",
  ARVIT: "Arvit",
  OTHER: "Autre",
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  SHEVA_BERAKHOT: "🏠",
  BRIT_MILA: "👶",
  MINCHA: "🌅",
  ARVIT: "🌙",
  OTHER: "✡️",
};

// Admin API
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  idDocumentUrl: string | null;
  idDocumentId: string | null;
  idUploadedAt: string | null;
  idVerificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  ketoubaDocumentUrl: string | null;
  ketoubaDocumentId: string | null;
  ketoubaUploadedAt: string | null;
  ketoubaVerificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  selfieDocumentUrl: string | null;
  selfieDocumentId: string | null;
  selfieUploadedAt: string | null;
  selfieVerificationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export const adminApi = {
  getPendingDocuments: async (type?: "id" | "ketouba" | "selfie") => {
    const query = type ? `?type=${type}` : "";
    return apiFetch<{ users: AdminUser[] }>(`/api/admin/pending-documents${query}`);
  },

  getDocumentUrl: async (userId: string, documentType: "id" | "ketouba" | "selfie") => {
    return apiFetch<{ url: string }>(`/api/admin/users/${userId}/document/${documentType}`);
  },

  verifyDocument: async (
    userId: string,
    documentType: "id" | "ketouba" | "selfie",
    action: "approve" | "reject",
    rejectionReason?: string
  ) => {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/verify-document", {
      method: "POST",
      body: JSON.stringify({ userId, documentType, action, rejectionReason }),
    });
  },
};
