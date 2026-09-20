"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#2A2D33",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)"
        },
        success: { iconTheme: { primary: "#F5B93D", secondary: "#1F2226" } }
      }}
    />
  );
}
