"use client";

import { useEffect, useState } from "react";
import { isElectron } from "@/lib/desktop";

/**
 * Safe for SSR/hydration — always false on server and first client paint,
 * then true after mount when running inside Electron.
 */
export function useIsElectron(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    setValue(isElectron());
  }, []);
  return value;
}
