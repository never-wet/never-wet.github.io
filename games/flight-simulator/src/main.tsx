import React from "react";
import ReactDOM from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { App } from "./App";
import "./styles.css";

window.CESIUM_BASE_URL = import.meta.env.VITE_CESIUM_BASE_URL ?? CESIUM_BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

