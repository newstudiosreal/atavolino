"use client";

// Wrapper sottile su react-hot-toast per centralizzare stile e lingua.
import toast from "react-hot-toast";

export function useGameToast() {
  return {
    info: (msg: string) => toast(msg, { icon: "ℹ️" }),
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    event: (msg: string) => toast(msg, { icon: "🎴" })
  };
}
