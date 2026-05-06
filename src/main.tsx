import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "@/lib/attribution";
import { startSessionTracking } from "@/lib/session";

// Capture UTM/referrer once on first load so all subsequent tracking events
// can be attributed to their origin (Instagram, Google Ads, partner, etc.).
captureAttribution();
startSessionTracking();

createRoot(document.getElementById("root")!).render(<App />);
