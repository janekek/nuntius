import { useState, useEffect, useCallback } from "react";
import type { ServerResponse } from "../types/ServerResponse";

export function useCallAPI<T>(url?: string, options?: RequestInit) {
  const [response, setResponse] = useState<ServerResponse<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json: ServerResponse<T> = await res.json();
      setResponse(json);
      return json;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (url) {
      execute(url, options);
    }
  }, [url, JSON.stringify(options), execute]);

  // useEffect(() => {
  //   setLoading(true);
  //   fetch(url, options)
  //     .then((res) => {
  //       if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  //       return res.json();
  //     })
  //     .then((json: ServerResponse<T>) => {
  //       setResponse(json);
  //     })
  //     .catch((err) => setError(err.message))
  //     .finally(() => setLoading(false));
  // }, [url, JSON.stringify(options)]);

  return { response, loading, error, execute };
}
