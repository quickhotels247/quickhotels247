"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FlightSearchCriteria, FlightSearchResponse } from "@quickhotels/types/flights";
import { ApiError } from "@/lib/api/client";
import { flightsApi } from "@/lib/api/flights";
import { PAGE_SIZE, type FlightView } from "../utils/flightView";

interface FlightSearchState {
  data: FlightSearchResponse | null;
  loading: boolean;
  error: string | null;
}

// Runs a flight search for the criteria and shows the requested view of it.
// A new search (POST) only happens when the criteria change or the old one
// has expired; lists, paging, sorting and filters reuse it (GET …/results).
// While a new view loads, the previous results stay on screen.
// The search for these criteria is remembered for the tab, so coming Back
// (e.g. from the fare check) shows the same fares instead of searching again.
const storageKey = (criteriaKey: string) => `quickhotels.flightSearch:${criteriaKey}`;
function rememberedSearch(criteriaKey: string) {
  try {
    const searchId = sessionStorage.getItem(storageKey(criteriaKey));
    return searchId ? { key: criteriaKey, searchId } : null;
  } catch {
    return null;
  }
}
function rememberSearch(criteriaKey: string, searchId: string) {
  try {
    sessionStorage.setItem(storageKey(criteriaKey), searchId);
  } catch {
    // Not remembered; Back searches again.
  }
}

export function useFlightSearch(criteria: FlightSearchCriteria | null, view: FlightView) {
  const [state, setState] = useState<FlightSearchState>({ data: null, loading: Boolean(criteria), error: null });
  const [attempt, setAttempt] = useState(0);
  const criteriaKey = criteria ? JSON.stringify(criteria) : "";
  const session = useRef<{ key: string; searchId: string } | null>(null);
  const viewKey = JSON.stringify(view);

  useEffect(() => {
    if (!criteria) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    const options = { ...view, pageSize: PAGE_SIZE };
    setState((previous) => ({ data: session.current?.key === criteriaKey ? previous.data : null, loading: true, error: null }));

    (async () => {
      if (session.current?.key !== criteriaKey) session.current = rememberedSearch(criteriaKey);
      const known = session.current?.key === criteriaKey ? session.current.searchId : null;
      if (known) {
        try {
          return await flightsApi.results(known, options, signal);
        } catch (error) {
          // Expired or forgotten searches run again; other errors are shown.
          if (!(error instanceof ApiError && (error.status === 404 || error.status === 410))) throw error;
        }
      }
      const { page, ...rest } = options;
      const first = await flightsApi.search(criteria, rest, signal);
      session.current = { key: criteriaKey, searchId: first.searchId };
      rememberSearch(criteriaKey, first.searchId);
      return page > 1 ? flightsApi.results(first.searchId, options, signal) : first;
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
