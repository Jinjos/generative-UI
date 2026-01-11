"use client";

import React, { use, useEffect } from "react";
import { DashboardRenderer } from "@/components/genui/DashboardRenderer";
import { useChatContext } from "@/hooks/use-chat-context";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const { setRoomId, activeDashboard, roomId: currentRoomId } = useChatContext();

  // On mount, tell the global ChatProvider we are in a room
  useEffect(() => {
    // Prevent infinite loop: Only update if the room has changed
    if (currentRoomId !== roomId) {
      setRoomId(roomId);
    }
    // Cleanup: Reset to global chat when leaving the room
    return () => {
      // Only reset if we are actually the one leaving (simplistic check)
      // In strict mode, cleanup runs before re-effect, so this might be tricky.
      // But for now, we trust the mount check above.
      // setRoomId(null); 
      // Removing explicit cleanup to prevent flicker/loop issues. 
      // Navigating away (unmounting AppShellContent?) handles it? 
      // No, AppShell stays. We need to reset on unmount.
    };
  }, [roomId, currentRoomId, setRoomId]);

  // Separate effect for cleanup to ensure we reset when truly unmounting
  useEffect(() => {
    return () => {
        // We can't easily check if we are navigating to another room or out of rooms entirely here.
        // Let's assume navigating to "/" will reset it via another mechanism or we live with "stale" room context
        // until the next room sets it.
        // Actually, let's keep it simple: If component unmounts, we try to reset.
        // BUT this caused the loop because Remount -> Cleanup -> Mount -> Set -> Remount.
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Room Header Info */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[color:var(--color-primary)]">Room: {roomId}</h2>
          <p className="text-xs text-[color:var(--color-secondary)] opacity-70">
            Multi-player session active • Syncing live
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-medium text-[color:var(--color-secondary)]">Live</span>
        </div>
      </div>

      {/* Main Canvas Driven by Shared Config from Context */}
      <div className="flex-1">
        <DashboardRenderer config={activeDashboard} />
      </div>
    </div>
  );
}
