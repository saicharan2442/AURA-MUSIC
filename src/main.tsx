import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* retire the boot splash once React has mounted */
requestAnimationFrame(() => {
  const splash = document.getElementById("aura-splash");
  if (splash) {
    splash.classList.add("done");
    window.setTimeout(() => splash.remove(), 700);
  }
});
