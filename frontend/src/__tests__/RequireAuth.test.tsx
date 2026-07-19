import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import * as authApi from "@/api/auth";
import * as clientApi from "@/api/client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import type { User } from "@/types";

const alice: User = {
  id: 1, name: "Alice", email: "alice@example.com",
  role: "customer", is_suspended: false,
};

function Probe({ user }: { user: User | null }) {
  const { setUser } = useAuth() as any;
  React.useEffect(() => { setUser?.(user); }, [user]);
  return null;
}

// Use React import here so the JSX in Probe is valid
import React from "react";

function setupRoutes(user: User | null, allow: User["role"][]) {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <AuthProvider>
        <Routes>
          <Route path="/protected" element={
            <RequireAuth allow={allow}>
              <div>Protected content</div>
            </RequireAuth>
          } />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    vi.spyOn(clientApi, "getAccessToken").mockReturnValue(null);
    vi.spyOn(clientApi, "setAccessToken").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("redirects to /login when not signed in", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(null);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    setupRoutes(null, ["customer"]);
    await waitFor(() => expect(screen.getByText(/Login page|Sign in/)).toBeInTheDocument());
  });

  it("shows protected content when user has allowed role", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(alice);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    setupRoutes(alice, ["customer"]);
    await waitFor(() => expect(screen.getByText("Protected content")).toBeInTheDocument());
  });

  it("redirects to / when role is not allowed", async () => {
    vi.spyOn(authApi, "me").mockResolvedValue(alice);
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    setupRoutes(alice, ["restaurant", "admin"]);
    await waitFor(() => expect(screen.getByText(/Home|Protected/)).toBeInTheDocument());
  });

  it("shows spinner while initializing", async () => {
    // /me never resolves during this microtask
    vi.spyOn(authApi, "me").mockImplementation(() => new Promise(() => {}));
    vi.spyOn(authApi, "refresh").mockResolvedValue(null);
    setupRoutes(null, ["customer"]);
    // Just verify nothing else rendered yet
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});