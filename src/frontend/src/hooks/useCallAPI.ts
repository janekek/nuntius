import { useState, useEffect, useCallback } from "react";
import type ServerResponse from "../shared/ServerResponse";

export function useCallAPI<T>(url?: string, options?: RequestInit) {
  const [response, setResponse] = useState<ServerResponse<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/" + url, options);
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

  return { response, loading, error, execute };
}
