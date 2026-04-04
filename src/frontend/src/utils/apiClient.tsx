const BASE_URL = "http://localhost:5000/api";

interface RequestParameters {
  method: "POST" | "GET" | "PATCH" | "PUT";
  include_credentials?: boolean;
  body?: any;
}

export async function callAPI<T>(
  endpoint: string,
  requestParameters: RequestParameters,
): Promise<T> {
  const init: RequestInit = {
    method: requestParameters.method,
    headers: { "content-type": "application/json" },
  };

  if (
    !requestParameters.include_credentials ||
    requestParameters.include_credentials
  ) {
    init.credentials = "include";
  }
  if (requestParameters.body) {
    init.body = requestParameters.body;
  }
  console.log(requestParameters.body);

  const response = await fetch(BASE_URL + endpoint, init);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  return response.json();
}
