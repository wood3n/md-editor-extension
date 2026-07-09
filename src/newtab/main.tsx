import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles/globals.css";
import { initCache } from "./lib/cache";

// Pre-load persistent cache into memory before first render
initCache();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
