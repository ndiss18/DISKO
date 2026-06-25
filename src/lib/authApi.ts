export type AuthRole = "user" | "umkm" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AuthRole;
  businessName?: string | null;
  businessCategory?: string | null;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "umkm";
  businessCategory?: string;
}) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
