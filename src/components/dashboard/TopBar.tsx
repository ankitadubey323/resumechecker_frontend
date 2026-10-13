"use client";

import { useState } from "react";

import { Avatar } from "@/components/dashboard/Avatar";
import { api, type User } from "@/lib/api";

export function TopBar({ user, photoVersion }: { user: User; photoVersion: number | null }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } finally {
      // Full load drops the client router cache, so Back can't show the dashboard.
      window.location.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#home" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">RC</span>
          <span className="hidden sm:inline">Resume Customizer</span>
        </a>
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} photoVersion={photoVersion} size={32} />
          <span className="hidden text-sm font-medium md:inline">{user.full_name}</span>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}
