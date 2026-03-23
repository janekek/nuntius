import { useState, useEffect } from "react";

export function useCallAPI<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(url, options)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((json: T) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url, JSON.stringify(options)]);

  return { data, loading, error };
}
