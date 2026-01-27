"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface ComponentView {
  id: string; // Internal ID for tracking unmounts
  component: string;
  title?: string;
  description?: string;
  endpoint?: string;
  params?: Record<string, unknown>;
}

interface BeaconContextType {
  sessionId: string;
  views: ComponentView[]; // Exposed for ChatContext
  setPageMetadata: (meta: { name: string; description?: string }) => void;
  registerView: (view: ComponentView) => void;
  unregisterView: (id: string) => void;
}

const BeaconContext = createContext<BeaconContextType | undefined>(undefined);

// Generate a random session ID
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

export function BeaconProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState("");
  
  // State for the Beacon Payload
  const [pageMeta, setPageMetadata] = useState<{ name: string; description?: string }>({ name: "Unknown" });
  const [views, setViews] = useState<ComponentView[]>([]);
  
  // Use a ref to debounce the API call
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Session ID
    let sid = window.sessionStorage.getItem("genui_session_id");
    if (!sid) {
      sid = generateSessionId();
      window.sessionStorage.setItem("genui_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Register/Unregister logic
  const registerView = useCallback((view: ComponentView) => {
    setViews((prev) => {
      const exists = prev.find((v) => v.id === view.id);
      if (exists && JSON.stringify(exists) === JSON.stringify(view)) return prev; // No change
      
      // Update or Add
      const filtered = prev.filter((v) => v.id !== view.id);
      return [...filtered, view];
    });
  }, []);

  const unregisterView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Sync to Backend (Debounced)
  useEffect(() => {
    if (!sessionId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const payload = {
        sessionId,
        page: pageMeta.name,
        pathname,
        views: views.map(({ id, ...rest }) => rest), // Remove internal ID before sending
      };

      console.log("📡 [Beacon] Syncing:", payload);

      fetch("/api/beacon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) => console.error("📡 [Beacon] Error:", err));

    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionId, pathname, pageMeta, views]);

  // Reset page meta on route change (optional, but good practice)
  useEffect(() => {
    setPageMetadata({ name: "Loading..." });
    setViews([]); // Clear views on navigation? 
    // ACTUALLY: We shouldn't clear views here blindly because components might remount 
    // OR we might want to keep the "Dashboard" state if it persists in layout.
    // Ideally, unmounting components call unregisterView, so this handles itself.
    // But pageMeta should definitely reset or update.
  }, [pathname]);

  return (
    <BeaconContext.Provider value={{ sessionId, views, setPageMetadata, registerView, unregisterView }}>
      {children}
    </BeaconContext.Provider>
  );
}

export function useBeacon() {
  const context = useContext(BeaconContext);
  if (context === undefined) {
    throw new Error("useBeacon must be used within a BeaconProvider");
  }
  return context;
}
