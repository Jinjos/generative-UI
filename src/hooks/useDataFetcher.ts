/**
 * ARCHITECTURE NOTE: ACTIVE HYDRATION
 * 
 * In the GenUI architecture, the Agent provides the "Instructions" (the API URL), 
 * but the Client performs the "Action" (the Fetch).
 * 
 * This hook is the engine for that action. When a "Smart Component" (Chart, Table) 
 * mounts with an apiEndpoint provided by the Agent, this hook hydrates the component 
 * with real-time data.
 * 
 * This ensures that the UI is always live and interactive, and that the LLM is 
 * never a bottleneck for data transfer.
 */

"use client";

import { useState, useEffect } from "react";

export function useDataFetcher<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true); // Start loading by default
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;
    
    let isMounted = true;
    
    // Reset states when URL changes, but avoid redundant update on mount
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        const json = await res.json();
                
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}
