import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore deep-link path captured by public/404.html (SPA fallback)
const redirect = sessionStorage.getItem("spa-redirect");
if (redirect) {
  sessionStorage.removeItem("spa-redirect");
  if (redirect !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", redirect);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
