import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

// Get API URL from environment variable or default to localhost
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  // Fallback for development
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }
  // Production fallback - use current origin
  return window.location.origin;
};

export const apiUrl = getApiUrl();

export const trpc = createTRPCReact<AppRouter>();
