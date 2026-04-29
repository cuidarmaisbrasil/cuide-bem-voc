import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttribution } from "@/lib/attribution";

// Capture UTM/referrer once on first load so all subsequent tracking events
// can be attributed to their origin (Instagram, Google Ads, partner, etc.).
captureAttribution();

createRoot(document.getElementById("root")!).render(<App />);
