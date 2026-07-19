import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import * as authApi from "@/api/auth";
import * as clientApi from "@/api/client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import type { User } from "@/types";

const alice: User = {
  id: 1, name: "Alice Customer", email: "alice@example.com",
  role: "customer", is_suspended: false,
};

interface Probe {
  // Exposes the consumer-facing state during a test.
  getState: () => ReturnType<typeof useAuth> | null;
}

function ProbeWrapper(): Probe & { renderOutput: React.ReactNode } {
  const holder: Probe = { getState: () => null };
  function Consumer() {
    const state = useAuth();
    holder.getState = () => state;
    return null;
  }
  return {
    getState: () => holder.getState(),
    renderOutput: (
      <MemoryRouter>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>
    ),
  } as any;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.spyOn(clientApi, "getAccessToken").mockReturnValue(null);
    vi.spyOn(clientApi, "setAccessToken").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with no user when /auth/me returns null", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(null);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);

    const probe = ProbeWrapper() as any;
    await act(async () => {
      render(probe.renderOutput);
    });
    await waitFor(() => {
      expect(probe.getState().initializing).toBe(false);
    });
    expect(probe.getState().user).toBe(null);
  });

  it("calls refresh on boot if no token and restores user", async () => {
    vi.spyOn(authApi, "refresh").mockResolvedValue({
      access_token: "new-token",
      token_type: "bearer",
      user: alice,
    });
    vi.spyOn(clientApi, "setAccessToken");
    vi.spyOn(authApi, "me").mockResolvedValue(alice);

    const probe = ProbeWrapper() as any;
    await act(async () => render(probe.renderOutput));
    await waitFor(() => expect(probe.getState().user?.email).toBe("alice@example.com"));
    expect(authApi.refresh).toHaveBeenCalled();
  });

  it("login sets user and access token", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(null);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    const setSpy = vi.spyOn(clientApi, "setAccessToken");
    vi.spyOn(authApi, "login").mockResolvedValue({
      access_token: "tok", token_type: "bearer", user: alice,
    });

    const probe = ProbeWrapper() as any;
    await act(async () => render(probe.renderOutput));
    await waitFor(() => expect(probe.getState().initializing).toBe(false));
    await act(async () => {
      await probe.getState().login("alice@example.com", "password123");
    });
    expect(probe.getState().user?.email).toBe("alice@example.com");
    expect(setSpy).toHaveBeenCalledWith("tok");
  });

  it("register sets user", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(null);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    vi.spyOn(authApi, "register").mockResolvedValue({
      access_token: "tok", token_type: "bearer", user: alice,
    });
    const probe = ProbeWrapper() as any;
    await act(async () => render(probe.renderOutput));
    await waitFor(() => expect(probe.getState().initializing).toBe(false));
    await act(async () => {
      await probe.getState().register({ name: "Alice", email: "alice@example.com", password: "password123", role: "customer" });
    });
    expect(probe.getState().user?.email).toBe("alice@example.com");
  });

  it("logout clears the user", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(alice);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    vi.spyOn(authApi, "logout").mockResolvedValue(undefined);

    const probe = ProbeWrapper() as any;
    await act(async () => render(probe.renderOutput));
    await waitFor(() => expect(probe.getState().user?.email).toBe("alice@example.com"));
    await act(async () => {
      await probe.getState().logout();
    });
    expect(probe.getState().user).toBe(null);
  });
});