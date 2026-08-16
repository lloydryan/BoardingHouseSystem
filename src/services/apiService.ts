const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("bh_access_token");
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function parseError(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text).message ?? text;
  } catch {
    return text || response.statusText;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("bh_access_token");
      localStorage.removeItem("bh_user");
      localStorage.removeItem("bh_landlord");
      window.dispatchEvent(new Event("bh:session-expired"));
    }
    throw new ApiError(response.status, await parseError(response));
  }
  return response.json() as Promise<T>;
}

export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: authHeaders() });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body)
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body)
  });
  return handleResponse<T>(response);
}

export function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
}
