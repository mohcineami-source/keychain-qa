"use client";

import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const TOKEN_KEY = "kcq_admin_token";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const handleSuccess = (next: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, next);
    } catch {
      /* ignore */
    }
    setToken(next);
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
  };

  if (!ready) {
    return (
      <div className="container-page py-16 text-center text-muted">Loading...</div>
    );
  }

  if (!token) {
    return <AdminLogin onSuccess={handleSuccess} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
