import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Could not find the "root" element in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);