import type { CreateRoomResponse, LobbyRoomSummary, RoomSettings, RoomState } from "@/types/room";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      throw new Error(body.message ?? fallbackMessage);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  return response.json() as Promise<T>;
}

export const api = {
  listRooms() {
    return request<LobbyRoomSummary[]>("/rooms");
  },
  createRoom(hostName: string) {
    return request<CreateRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ hostName }),
    });
  },
  createProtectedRoom(params: {
    hostName: string;
    roomName: string;
    password: string;
    settings?: Partial<RoomSettings>;
  }) {
    return request<CreateRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  getRoom(roomId: string, password: string) {
    return request<RoomState>(`/rooms/${roomId}?password=${encodeURIComponent(password)}`);
  },
  deleteRoom(roomId: string, memberId: string) {
    return request<void>(`/rooms/${roomId}`, {
      method: "DELETE",
      body: JSON.stringify({ memberId }),
    });
  },
};
