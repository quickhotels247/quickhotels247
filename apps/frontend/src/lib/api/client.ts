// How the website calls our backend (never a supplier directly). Every
// request goes to NEXT_PUBLIC_API_URL + "/api".
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

// A failed request, with the backend's message (safe to show to customers).
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// NestJS error bodies carry `message` as a string or a list of strings.
function messageFrom(body: unknown, status: number) {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message) return message;
  return status >= 500 ? "Something went wrong on our side. Please try again." : "That request didn't work. Please check and try again.";
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError("We couldn't reach QuickHotels24/7. Check your connection and try again.", 0);
  }
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(messageFrom(body, response.status), response.status);
  return body as T;
}

export const postJson = <T>(path: string, data: unknown, init: RequestInit = {}) =>
  apiRequest<T>(path, { ...init, method: "POST", body: JSON.stringify(data) });
