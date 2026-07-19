import axios, { type AxiosInstance } from "axios";

import { API_BASE } from "@/lib/format";

let memoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  return config;
});

// Refresh-token interceptor: on 401 from a non-auth endpoint, try refresh once.
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
    if (res.status === 200 && res.data?.access_token) {
      setAccessToken(res.data.access_token);
      return true;
    }
  } catch {
    setAccessToken(null);
  }
  return false;
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const url = original?.url ?? "";
    if (status === 401 && !original._retry && !url.includes("/auth/login") && !url.includes("/auth/register") && !url.includes("/auth/refresh")) {
      original._retry = true;
      if (!refreshing) refreshing = tryRefresh().finally(() => (refreshing = null));
      const ok = await refreshing;
      if (ok) {
        original.headers.Authorization = `Bearer ${memoryAccessToken}`;
        return client(original);
      }
      setAccessToken(null);
    }
    return Promise.reject(error);
  },
);

export default client;