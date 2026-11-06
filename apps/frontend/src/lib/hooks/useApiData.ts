"use client";

import { useEffect, useState } from "react";

export interface ApiData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Loads data in the browser when a component mounts (and when `deps` change),
// cancelling the request if the component goes away first.
export function useApiData<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []): ApiData<T> {
  const [state, setState] = useState<ApiData<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));
    load(controller.signal)
      .then((data) => !controller.signal.aborted && setState({ data, loading: false, error: null }))
      .catch((error: Error) => !controller.signal.aborted && setState({ data: null, loading: false, error: error.message }));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass their own deps
  }, deps);
  return state;
}
