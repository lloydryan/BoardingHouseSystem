const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

function demoHeaders() {
  const user = JSON.parse(localStorage.getItem("bh_user") ?? "null");
  return {
    "x-demo-role": user?.role ?? "LANDLORD",
    "x-landlord-id": user?.landlordId ?? "landlord-rivera"
  };
}

export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: demoHeaders() });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...demoHeaders() },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
}
