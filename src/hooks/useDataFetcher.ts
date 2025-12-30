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
        if (!res.ok) throw new Error("Failed to fetch");
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
