/**
 * Tiny fetch wrapper for the Noble Spaces backend.
 *
 * Configured via `.env`:
 *   VITE_API_URL       — base URL of your API (e.g. https://api.example.com)
 *   VITE_ADMIN_TOKEN   — bearer token for admin write operations
 *
 * If VITE_API_URL is empty the app falls back to the bundled local services
 * (see `src/data/services.ts`), so the site keeps working with no backend.
 */

export const API_URL: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
export const ADMIN_TOKEN: string = import.meta.env.VITE_ADMIN_TOKEN ?? "";

export const isBackendConfigured = () => API_URL.length > 0;

export type Availability = "both" | "custom" | "service";

/** Service shape returned by the backend (also used by the admin UI). */
export type ApiService = {
  slug: string;
  title: string;
  description: string;
  /** lucide-react icon name, e.g. "Sofa", "ChefHat". */
  icon: string;
  availability: Availability;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  /** Cover image URL — first image shown on cards/hero. */
  coverUrl: string;
  /** Ordered list of image URLs (cover may also appear here). */
  gallery: string[];
  /** Display order, ascending. */
  sortOrder: number;
};

export type CreateServiceInput = Omit<ApiService, "gallery" | "coverUrl"> & {
  coverUrl?: string;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { auth = false }: { auth?: boolean } = {},
): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError(0, "Backend not configured (set VITE_API_URL).");
  }
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    if (!ADMIN_TOKEN) throw new ApiError(401, "Missing VITE_ADMIN_TOKEN.");
    headers.set("Authorization", `Bearer ${ADMIN_TOKEN}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      if (data?.error || data?.message) msg = data.error ?? data.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* -------- Services CRUD -------- */

export const listServices = () => request<ApiService[]>("/services");

export const getService = (slug: string) =>
  request<ApiService>(`/services/${encodeURIComponent(slug)}`);

export const createService = (body: CreateServiceInput) =>
  request<ApiService>("/services", { method: "POST", body: JSON.stringify(body) }, { auth: true });

export const updateService = (slug: string, body: UpdateServiceInput) =>
  request<ApiService>(
    `/services/${encodeURIComponent(slug)}`,
    { method: "PUT", body: JSON.stringify(body) },
    { auth: true },
  );

export const deleteService = (slug: string) =>
  request<void>(
    `/services/${encodeURIComponent(slug)}`,
    { method: "DELETE" },
    { auth: true },
  );

/* -------- Image management -------- */

export type ServiceImage = { id: string; url: string; sortOrder: number };

export const listImages = (slug: string) =>
  request<ServiceImage[]>(`/services/${encodeURIComponent(slug)}/images`);

export async function uploadImage(slug: string, file: File): Promise<ServiceImage> {
  const form = new FormData();
  form.append("file", file);
  return request<ServiceImage>(
    `/services/${encodeURIComponent(slug)}/images`,
    { method: "POST", body: form },
    { auth: true },
  );
}

export const deleteImage = (slug: string, imageId: string) =>
  request<void>(
    `/services/${encodeURIComponent(slug)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" },
    { auth: true },
  );

export { ApiError };
