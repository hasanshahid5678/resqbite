import client from "./client";
import type { TokenResponse, User } from "@/types";

export async function register(payload: { name: string; email: string; password: string; role: "customer" | "restaurant" }): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/auth/register", payload);
  return res.data;
}

export async function login(payload: { email: string; password: string }): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>("/auth/login", payload);
  return res.data;
}

export async function refresh(): Promise<TokenResponse | null> {
  try {
    const res = await client.post<TokenResponse>("/auth/refresh");
    return res.data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function me(): Promise<User | null> {
  try {
    const res = await client.get<User>("/auth/me");
    return res.data;
  } catch {
    return null;
  }
}