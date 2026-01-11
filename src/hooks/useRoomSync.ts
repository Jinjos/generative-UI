"use client";

import { useState, useEffect } from "react";
import { DashboardTool } from "@/lib/genui/schemas";

interface RoomState {
  roomId: string;
  messages: unknown[];
  dashboardConfig: DashboardTool | null;
  lastUpdated: string;
}

export function useRoomSync(roomId: string) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) throw new Error("Failed to fetch room state");
        const data = await res.json();
        
        if (isMounted) {
          setRoom(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchRoom();

    // Polling Interval (3 seconds)
    const interval = setInterval(fetchRoom, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  return { room, loading, error };
}
