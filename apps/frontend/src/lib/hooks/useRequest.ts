"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Runs one request at a time and keeps its busy flag and error message.
// `run` resolves with the result, or undefined if the request failed.
export function useRequest() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError("");
    try {
      return await task();
    } catch (caught) {
      if (mounted.current) setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
      return undefined;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
