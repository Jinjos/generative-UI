"use client";

import { useEffect } from "react";
import { useBeacon } from "@/components/genui/BeaconProvider";

export function usePageBeacon(meta: { name: string; description?: string }) {
  const { setPageMetadata } = useBeacon();

  useEffect(() => {
    setPageMetadata(meta);
  }, [meta, setPageMetadata]);
}
