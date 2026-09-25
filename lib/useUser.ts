// Re-exported from UserContext so existing `import { useUser } from "@/lib/useUser"` calls keep
// working, but now share one login-state fetch across the whole app instead of each component
// (including the navbar) polling independently. See UserContext.tsx for details.
export { useUser } from "./UserContext";
export type { PublicUser } from "./UserContext";
