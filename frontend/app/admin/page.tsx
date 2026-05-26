"use client";

import { useEffect, useState } from "react";
import { adminMe } from "@/lib/api";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

type AuthState = "checking" | "authed" | "guest";

const LEGACY_TOKEN_KEY = "kcq_admin_token";

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("checking");

  // Best-effort sweep of the legacy localStorage token; the session is now
  // httpOnly-cookie-based and the localStorage value is no longer trusted.
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const checkSession = async () => {
    try {
      await adminMe();
      setAuth("authed");
    } catch {
      setAuth("guest");
    }
  };

  useEffect(() => {
    void checkSession();
  }, []);

  if (auth === "checking") {
    return (
      <div className="container-page py-16 text-center text-muted">Loading...</div>
    );
  }

  if (auth === "guest") {
    return <AdminLogin onSuccess={() => setAuth("authed")} />;
  }

  return <AdminDashboard onLogout={() => setAuth("guest")} />;
}
