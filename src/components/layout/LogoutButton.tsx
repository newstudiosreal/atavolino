"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="rounded-full px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await logoutAction();
        router.push("/");
        router.refresh();
      }}
    >
      Esci
    </button>
  );
}
