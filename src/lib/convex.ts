import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";

export const convexClient = new ConvexReactClient(convexUrl);
export { ConvexAuthProvider };
