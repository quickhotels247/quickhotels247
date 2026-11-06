"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HotelSearchCriteria, HotelSearchResponse } from "@quickhotels/types/hotels";
import { ApiError } from "@/lib/api/client";
import { hotelsApi } from "@/lib/api/hotels";
import { PAGE_SIZE, type SearchView } from "../utils/searchView";

interface HotelSearchState {
  data: HotelSearchResponse | null;
  loading: boolean;
  error: string | null;
}

// Runs a hotel search for the criteria and shows the requested view of it.
// A new search (POST) only happens when the criteria change or the old one
// has expired; paging, sorting and filtering reuse it (GET …/results).
// While a new view loads, the previous results stay on screen.
export function useHotelSearch(criteria: HotelSearchCriteria | null, view: SearchView) {
  const [state, setState] = useState<HotelSearchState>({ data: null, loading: Boolean(criteria), error: null });
  const [attempt, setAttempt] = useState(0);
  // The backend search for the current criteria, reused across views.
  const session = useRef<{ key: string; searchId: string } | null>(null);

  const criteriaKey = criteria ? JSON.stringify(criteria) : "";
  const viewKey = JSON.stringify(view);

  useEffect(() => {
    if (!criteria) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    const options = { ...view, pageSize: PAGE_SIZE };
    setState((previous) => ({
      // A different search shouldn't show the last destination's hotels.
      data: session.current?.key === criteriaKey ? previous.data : null,
      loading: true,
      error: null,
    }));

    (async () => {
      const known = session.current?.key === criteriaKey ? session.current.searchId : null;
      if (known) {
        try {
          return await hotelsApi.results(known, options, signal);
        } catch (error) {
          // Expired or forgotten searches are run again; other errors are shown.
          if (!(error instanceof ApiError && (error.status === 404 || error.status === 410))) throw error;
        }
      }
      const { page, ...rest } = options;
      const first = await hotelsApi.search(criteria, rest, signal);
      session.current = { key: criteriaKey, searchId: first.searchId };
      return page > 1 ? hotelsApi.results(first.searchId, options, signal) : first;
    })()
      .then((data) => !signal.aborted && setState({ data, loading: false, error: null }))
      .catch((error: Error) => !signal.aborted && setState((previous) => ({ ...previous, loading: false, error: error.message })));

    return () => controller.abort();
    // criteriaKey and viewKey stand for criteria and view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteriaKey, viewKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
